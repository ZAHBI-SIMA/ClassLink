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

export async function initiatePayment(data: PaymentInitData): Promise<PaymentInitResponse> {
  const transactionId = `CL-${nanoid(12).toUpperCase()}`

  const response = await fetch(CINETPAY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
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

export async function verifyPayment(transactionId: string): Promise<{
  status: 'ACCEPTED' | 'REFUSED' | 'PENDING'
  amount: number
  paymentMethod: string
}> {
  const response = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
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

export function verifyWebhookSignature(payload: WebhookPayload): boolean {
  const secret = process.env.CINETPAY_SECRET_KEY!
  // Validation de signature selon la doc CinetPay
  const expectedSignature = generateSignature(payload, secret)
  return payload.signature === expectedSignature
}

function generateSignature(payload: WebhookPayload, secret: string): string {
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

  const crypto = require('crypto')
  return crypto.createHash('sha256').update(str).digest('hex')
}
