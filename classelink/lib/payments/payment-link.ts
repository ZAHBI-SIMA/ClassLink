import { SignJWT, jwtVerify } from 'jose'

/**
 * Récupère la clé de signature des liens de paiement.
 * Évaluation paresseuse (à l'appel, pas à l'import) pour ne pas casser le
 * chargement des modules qui importent ce fichier. Aucun secret de repli codé
 * en dur : si rien n'est configuré, la signature/vérification échoue volontairement.
 */
function getPaymentLinkSecret(): Uint8Array {
  const secret =
    process.env.PAYMENT_LINK_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error(
      'PAYMENT_LINK_SECRET (ou AUTH_SECRET) doit être défini pour signer les liens de paiement.'
    )
  }
  return new TextEncoder().encode(secret)
}

export interface PaymentLinkPayload {
  paymentId:   string
  schemaName:  string
  studentId:   string
  amount:      number
  feeName:     string
  studentName: string
  schoolName:  string
}

export async function signPaymentToken(payload: PaymentLinkPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getPaymentLinkSecret())
}

export async function verifyPaymentToken(token: string): Promise<PaymentLinkPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getPaymentLinkSecret())
    return payload as unknown as PaymentLinkPayload
  } catch {
    return null
  }
}
