import { getTenantPrisma } from '@/lib/db/tenant'
import { decryptSecret } from '@/lib/crypto/secrets'
import * as geniuspay from './geniuspay'
import * as cinetpay from './cinetpay'

/**
 * Orchestrateur de paiement « par école ».
 *
 * Chaque école peut configurer son propre PSP (GeniusPay ou CinetPay) dans ses
 * paramètres. Si `payment_enabled` est vrai et les clés présentes, les frais sont
 * collectés sur le compte de l'école ; sinon on retombe sur le compte global
 * MyClassLink (GeniusPay via variables d'environnement).
 */

export type PaymentProvider = 'GENIUSPAY' | 'CINETPAY'

export interface SchoolPaymentData {
  amount:        number
  description:   string
  customerId:    string
  customerName:  string
  customerEmail: string
  customerPhone?: string
  returnUrl:     string
  /** URL racine de l'app ; la notifyUrl du webhook est dérivée selon le PSP retenu. */
  baseUrl:       string
  metadata?:     Record<string, string>
}

function notifyUrlFor(baseUrl: string, provider: PaymentProvider): string {
  return `${baseUrl}/api/webhooks/${provider === 'CINETPAY' ? 'cinetpay' : 'geniuspay'}`
}

interface SchoolPaymentConfig {
  provider:      PaymentProvider
  enabled:       boolean
  apiKey:        string
  apiSecret:     string
  siteId:        string | null
  webhookSecret: string | null
}

/** Lit et déchiffre la configuration de paiement d'une école. null si non configurée. */
export async function getSchoolPaymentConfig(schemaName: string): Promise<SchoolPaymentConfig | null> {
  try {
    const db = getTenantPrisma(schemaName) as any
    const rows: any[] = await db.$queryRaw`
      SELECT payment_provider, payment_enabled,
             payment_api_key_enc, payment_api_secret_enc,
             payment_site_id_enc, payment_webhook_secret_enc
      FROM school_settings LIMIT 1
    `
    const r = rows[0]
    if (!r || !r.payment_enabled || !r.payment_provider) return null

    const apiKey = decryptSecret(r.payment_api_key_enc)
    if (!apiKey) return null

    return {
      provider:      r.payment_provider as PaymentProvider,
      enabled:       true,
      apiKey,
      apiSecret:     decryptSecret(r.payment_api_secret_enc) ?? '',
      siteId:        decryptSecret(r.payment_site_id_enc),
      webhookSecret: decryptSecret(r.payment_webhook_secret_enc),
    }
  } catch {
    return null
  }
}

/**
 * Initie un paiement de frais avec le PSP de l'école (ou le compte global en repli).
 * Renvoie le `provider` réellement utilisé pour le stocker dans `payments.provider`.
 */
export async function initiateSchoolPayment(
  schemaName: string,
  data: SchoolPaymentData,
): Promise<{ transactionId: string; paymentUrl: string; provider: PaymentProvider }> {
  const cfg = await getSchoolPaymentConfig(schemaName)

  if (cfg?.provider === 'CINETPAY') {
    const res = await cinetpay.initiatePayment(
      { ...data, notifyUrl: notifyUrlFor(data.baseUrl, 'CINETPAY') },
      { apiKey: cfg.apiKey, siteId: cfg.siteId ?? '', secretKey: cfg.webhookSecret ?? undefined },
    )
    return { ...res, provider: 'CINETPAY' }
  }

  if (cfg?.provider === 'GENIUSPAY') {
    const res = await geniuspay.initiatePayment(
      { ...data, notifyUrl: notifyUrlFor(data.baseUrl, 'GENIUSPAY') },
      { apiKey: cfg.apiKey, apiSecret: cfg.apiSecret, webhookSecret: cfg.webhookSecret ?? undefined },
    )
    return { ...res, provider: 'GENIUSPAY' }
  }

  // Repli : compte GeniusPay global MyClassLink.
  const res = await geniuspay.initiatePayment({
    ...data,
    notifyUrl: notifyUrlFor(data.baseUrl, 'GENIUSPAY'),
  })
  return { ...res, provider: 'GENIUSPAY' }
}

/** Vérifie un paiement auprès du bon PSP avec les clés de l'école (repli global). */
export async function verifySchoolPayment(
  schemaName: string,
  provider: PaymentProvider | string | null,
  reference: string,
): Promise<{ status: 'ACCEPTED' | 'REFUSED' | 'PENDING'; amount: number; paymentMethod: string }> {
  const cfg = await getSchoolPaymentConfig(schemaName)

  if (provider === 'CINETPAY' || cfg?.provider === 'CINETPAY') {
    return cinetpay.verifyPayment(
      reference,
      cfg?.provider === 'CINETPAY'
        ? { apiKey: cfg.apiKey, siteId: cfg.siteId ?? '', secretKey: cfg.webhookSecret ?? undefined }
        : undefined,
    )
  }

  return geniuspay.verifyPayment(
    reference,
    cfg?.provider === 'GENIUSPAY'
      ? { apiKey: cfg.apiKey, apiSecret: cfg.apiSecret, webhookSecret: cfg.webhookSecret ?? undefined }
      : undefined,
  )
}
