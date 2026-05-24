/**
 * Jeton de connexion automatique à usage unique (après paiement d'abonnement).
 *
 * Format : `${email}:${expiresAt}.${hmacHex}`
 * Signé via HMAC-SHA256(AUTH_SECRET). Durée de vie courte (10 min).
 *
 * Permet de connecter l'administrateur juste après l'activation de son école,
 * sans qu'il ait à ressaisir son mot de passe.
 */

const TTL_MS = 10 * 60 * 1000 // 10 minutes

function secret(): string {
  return process.env.AUTH_SECRET ?? ''
}

async function hmacHex(data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function mintAutoLoginToken(email: string): Promise<string> {
  const payload = `${email.toLowerCase()}:${Date.now() + TTL_MS}`
  const sig = await hmacHex(payload)
  return `${payload}.${sig}`
}

/** Retourne l'email si le jeton est valide et non expiré, sinon null. */
export async function verifyAutoLoginToken(token: string): Promise<string | null> {
  if (!token || !secret()) return null
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const expected = await hmacHex(payload)
  if (expected.length !== sig.length) return null
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  if (diff !== 0) return null

  const colon = payload.lastIndexOf(':')
  if (colon === -1) return null
  const email = payload.slice(0, colon)
  const exp = parseInt(payload.slice(colon + 1), 10)
  if (isNaN(exp) || Date.now() > exp) return null

  return email
}
