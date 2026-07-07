import { nanoid } from 'nanoid'

interface PaymentInitData {
  amount: number
  description: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  returnUrl: string
  notifyUrl: string
  metadata?: Record<string, string>
}

interface PaymentInitResponse {
  transactionId: string
  paymentUrl: string
}

interface WebhookPayload {
  cpm_trans_id: string
  cpm_site_id: string
  cpm_trans_date: string
  cpm_amount: string
  cpm_currency: string
  signature: string
  payment_method: string
  cel_phone_num: string
  cpm_phone_prefixe: string
  cpm_language: string
  cpm_version: string
  cpm_payment_config: string
  cpm_page_action: string
  cpm_custom: string
  cpm_designation: string
  cpm_error_message: string
}

const CINETPAY_API = 'https://api-checkout.cinetpay.com/v2/payment'

/** Identifiants CinetPay (par défaut : compte global MyClassLink via env). */
export interface CinetPayCreds {
  apiKey:        string
  siteId:        string
  secretKey?:    string
}

function resolveCreds(creds?: CinetPayCreds): CinetPayCreds {
  return {
    apiKey:     creds?.apiKey     ?? process.env.CINETPAY_API_KEY    ?? '',
    siteId:     creds?.siteId     ?? process.env.CINETPAY_SITE_ID    ?? '',
    secretKey:  creds?.secretKey  ?? process.env.CINETPAY_SECRET_KEY ?? '',
  }
}

export async function initiatePayment(
  data: PaymentInitData,
  creds?: CinetPayCreds
): Promise<PaymentInitResponse> {
  const c = resolveCreds(creds)
  const transactionId = `CL-${nanoid(12).toUpperCase()}`

  const response = await fetch(CINETPAY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: c.apiKey,
      site_id: c.siteId,
      transaction_id: transactionId,
      amount: data.amount,
      currency: 'XOF',
      description: data.description,
      return_url: data.returnUrl,
      notify_url: data.notifyUrl,
      customer_id: data.customerId,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone_number: data.customerPhone ?? '',
      customer_address: '',
      customer_city: '',
      customer_country: 'CI',
      customer_state: 'CI',
      customer_zip_code: '00225',
      channels: 'ALL',
      metadata: JSON.stringify(data.metadata ?? {}),
    }),
  })

  const result = await response.json()

  if (result.code !== '201') {
    throw new Error(`Erreur CinetPay: ${result.message}`)
  }

  return {
    transactionId,
    paymentUrl: result.data.payment_url,
  }
}

export async function verifyPayment(transactionId: string, creds?: CinetPayCreds): Promise<{
  status: 'ACCEPTED' | 'REFUSED' | 'PENDING'
  amount: number
  paymentMethod: string
}> {
  const c = resolveCreds(creds)
  const response = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: c.apiKey,
      site_id: c.siteId,
      transaction_id: transactionId,
    }),
  })

  const result = await response.json()

  const statusMap: Record<string, 'ACCEPTED' | 'REFUSED' | 'PENDING'> = {
    ACCEPTED: 'ACCEPTED',
    REFUSED: 'REFUSED',
    PENDING: 'PENDING',
  }

  return {
    status: statusMap[result.data?.status] ?? 'PENDING',
    amount: parseInt(result.data?.amount ?? '0'),
    paymentMethod: result.data?.payment_method ?? '',
  }
}

export async function verifyWebhookSignature(
  payload: WebhookPayload,
  secretKey?: string
): Promise<boolean> {
  const secret = secretKey ?? process.env.CINETPAY_SECRET_KEY ?? ''
  // Validation de signature selon la doc CinetPay
  const expectedSignature = await generateSignature(payload, secret)
  return payload.signature === expectedSignature
}

async function generateSignature(payload: WebhookPayload, secret: string): Promise<string> {
  const str = [
    payload.cpm_amount,
    payload.cpm_currency,
    payload.cpm_page_action,
    payload.cpm_site_id,
    payload.cpm_trans_date,
    payload.cpm_trans_id,
    payload.cpm_version,
    secret,
  ].join('')

  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
