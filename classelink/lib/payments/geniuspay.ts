/**
 * Intégration GeniusPay — https://pay.genius.ci/docs/api
 *
 * Variables d'environnement requises :
 *   GENIUSPAY_API_KEY        Clé publique  (pk_sandbox_... / pk_live_...)
 *   GENIUSPAY_API_SECRET     Clé secrète   (sk_sandbox_... / sk_live_...)
 *   GENIUSPAY_WEBHOOK_SECRET Secret webhook (whsec_...)
 *   GENIUSPAY_API_URL        (optionnel) défaut : https://pay.genius.ci/api/v1/merchant
 */

const GENIUSPAY_API =
  process.env.GENIUSPAY_API_URL ?? 'https://pay.genius.ci/api/v1/merchant'

interface PaymentInitData {
  amount: number
  description: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  returnUrl: string
  /** Conservé pour compatibilité — GeniusPay configure le webhook séparément. */
  notifyUrl?: string
  metadata?: Record<string, string>
}

interface PaymentInitResponse {
  transactionId: string
  paymentUrl: string
}

type NormalizedStatus = 'ACCEPTED' | 'REFUSED' | 'PENDING'

function authHeaders(): HeadersInit {
  return {
    'X-API-Key': process.env.GENIUSPAY_API_KEY ?? '',
    'X-API-Secret': process.env.GENIUSPAY_API_SECRET ?? '',
    'Content-Type': 'application/json',
  }
}

// Statuts GeniusPay → statut interne
function normalizeStatus(status: string): NormalizedStatus {
  switch (status) {
    case 'completed':
      return 'ACCEPTED'
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'REFUSED'
    default: // pending, processing, refunded
      return 'PENDING'
  }
}

/**
 * Initie un paiement et renvoie l'URL de checkout GeniusPay.
 * On omet `payment_method` pour afficher la page de choix (Wave, Orange Money, MTN, carte…).
 */
export async function initiatePayment(
  data: PaymentInitData
): Promise<PaymentInitResponse> {
  const response = await fetch(`${GENIUSPAY_API}/payments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      amount: data.amount,
      currency: 'XOF',
      description: data.description,
      customer: {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone ?? undefined,
        country: 'CI',
      },
      success_url: data.returnUrl,
      error_url: data.returnUrl,
      metadata: data.metadata ?? {},
    }),
  })

  const result = await response.json().catch(() => null)

  if (!response.ok || !result?.success || !result?.data) {
    const msg = result?.message ?? result?.error ?? `HTTP ${response.status}`
    throw new Error(`Erreur GeniusPay: ${msg}`)
  }

  const { reference, checkout_url, payment_url } = result.data
  const paymentUrl = checkout_url ?? payment_url

  if (!reference || !paymentUrl) {
    throw new Error('Erreur GeniusPay: réponse incomplète (reference/url manquant).')
  }

  return { transactionId: reference, paymentUrl }
}

/**
 * Vérifie le statut d'une transaction auprès de GeniusPay.
 */
export async function verifyPayment(reference: string): Promise<{
  status: NormalizedStatus
  amount: number
  paymentMethod: string
}> {
  const response = await fetch(
    `${GENIUSPAY_API}/payments/${encodeURIComponent(reference)}`,
    { method: 'GET', headers: authHeaders() }
  )

  const result = await response.json().catch(() => null)

  if (!response.ok || !result?.data) {
    return { status: 'PENDING', amount: 0, paymentMethod: '' }
  }

  return {
    status: normalizeStatus(result.data.status),
    amount: Number(result.data.amount ?? 0),
    paymentMethod: result.data.payment_method ?? result.data.provider ?? '',
  }
}

/**
 * Vérifie la signature HMAC-SHA256 d'un webhook GeniusPay.
 * Signature = HMAC_SHA256(`${timestamp}.${rawBody}`, GENIUSPAY_WEBHOOK_SECRET)
 *
 * IMPORTANT : passer le corps brut (texte) de la requête, pas un objet re-sérialisé.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET
  if (!secret || !signature || !timestamp) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${timestamp}.${rawBody}`)
  )
  const expected = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Comparaison à temps constant
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}
