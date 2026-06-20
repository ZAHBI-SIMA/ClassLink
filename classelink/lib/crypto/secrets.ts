import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

/**
 * Chiffrement symétrique des secrets stockés au repos (clés de paiement des écoles).
 *
 * AES-256-GCM. La clé de 32 octets est dérivée de `AUTH_SECRET` (déjà présent en
 * production) via SHA-256. Format de sortie : `iv.authTag.ciphertext` (base64url),
 * autonome et déchiffrable sans métadonnée externe.
 */

function getKey(): Buffer {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET doit être défini pour chiffrer les secrets de paiement.')
  }
  return createHash('sha256').update(secret).digest() // 32 octets
}

/** Chiffre une valeur en clair. Renvoie une chaîne autonome `iv.tag.data` (base64url). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv, authTag, ciphertext].map(b => b.toString('base64url')).join('.')
}

/** Déchiffre une valeur produite par {@link encryptSecret}. Renvoie null si invalide. */
export function decryptSecret(enc: string | null | undefined): string | null {
  if (!enc) return null
  try {
    const [ivB64, tagB64, dataB64] = enc.split('.')
    if (!ivB64 || !tagB64 || !dataB64) return null
    const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64url'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))
    const plain = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64url')),
      decipher.final(),
    ])
    return plain.toString('utf8')
  } catch {
    return null
  }
}

/**
 * Aperçu masqué d'un secret pour l'affichage (jamais renvoyer la valeur en clair
 * au client). Ex. `••••••••3f9a`.
 */
export function maskSecret(enc: string | null | undefined): string | null {
  if (!enc) return null
  const plain = decryptSecret(enc)
  if (!plain) return null
  const tail = plain.slice(-4)
  return `${'•'.repeat(8)}${tail}`
}
