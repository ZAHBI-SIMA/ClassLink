/**
 * TOTP (Time-based One-Time Password) implementation — RFC 6238 / RFC 4226
 * Uses only Web Crypto API — no external dependency required.
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** Decode a Base32 string to Uint8Array */
function base32Decode(input: string): Uint8Array {
  const str = input.replace(/=+$/, '').toUpperCase()
  let bits = 0
  let value = 0
  let index = 0
  const output = new Uint8Array(Math.floor((str.length * 5) / 8))

  for (const char of str) {
    const charIndex = BASE32_CHARS.indexOf(char)
    if (charIndex === -1) continue
    value = (value << 5) | charIndex
    bits += 5
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff
      bits -= 8
    }
  }
  return output.slice(0, index)
}

/** Encode a Uint8Array to Base32 */
function base32Encode(buffer: Uint8Array): string {
  let result = ''
  let bits = 0
  let value = 0
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 31]
  }
  // Pad to multiple of 8
  while (result.length % 8 !== 0) result += '='
  return result
}

/** Generate a cryptographically random Base32 secret (20 bytes = 160 bits) */
export function generateTotpSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  return base32Encode(bytes)
}

/**
 * Compute HOTP(key, counter) = HMAC-SHA1 truncate → 6-digit code.
 * counter is a regular JS number (safe for TOTP timestamps until year 4147).
 */
async function hotp(secret: string, counter: number): Promise<string> {
  const keyBytes = base32Decode(secret)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  // Counter as big-endian 8-byte buffer (fits in number for decades)
  const counterBuffer = new ArrayBuffer(8)
  const counterView = new DataView(counterBuffer)
  // High 4 bytes (usually 0 for TOTP timestamps)
  counterView.setUint32(0, Math.floor(counter / 0x100000000))
  // Low 4 bytes
  counterView.setUint32(4, counter >>> 0)

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer)
  const hmac = new Uint8Array(signature)

  const offset = hmac[19] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return String(code % 1_000_000).padStart(6, '0')
}

/** Generate current TOTP code (30-second window) */
export async function generateTotp(secret: string): Promise<string> {
  const counter = Math.floor(Date.now() / 1000 / 30)
  return hotp(secret, counter)
}

/**
 * Verify a TOTP token.
 * Accepts window of ±1 step (90 seconds grace for clock drift).
 */
export async function verifyTotp(secret: string, token: string): Promise<boolean> {
  const normalized = token.replace(/\s/g, '')
  if (!/^\d{6}$/.test(normalized)) return false

  const step = Math.floor(Date.now() / 1000 / 30)
  for (const delta of [-1, 0, 1]) {
    const code = await hotp(secret, step + delta)
    if (code === normalized) return true
  }
  return false
}

/** Build an otpauth:// URI for QR code generation */
export function buildOtpAuthUri(secret: string, accountName: string, issuer = 'ClasseLink'): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  })
  const account = encodeURIComponent(`${issuer}:${accountName}`)
  return `otpauth://totp/${account}?${params.toString()}`
}

/** QR code image URL using Google Chart API */
export function buildQrCodeUrl(otpAuthUri: string, size = 200): string {
  const encoded = encodeURIComponent(otpAuthUri)
  return `https://chart.googleapis.com/chart?chs=${size}x${size}&chld=M|0&cht=qr&chl=${encoded}`
}
