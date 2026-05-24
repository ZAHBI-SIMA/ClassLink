import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, verifyPayment } from '@/lib/payments/geniuspay'
import { getTenantPrisma } from '@/lib/db/tenant'
import { activateSchoolIfPaid } from '@/actions/register'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Corps brut nécessaire pour la vérification de signature
    const rawBody = await request.text()
    const signature = request.headers.get('X-Webhook-Signature') ?? ''
    const timestamp = request.headers.get('X-Webhook-Timestamp') ?? ''

    const isValid = await verifyWebhookSignature(rawBody, timestamp, signature)
    if (!isValid) {
      console.error('[GeniusPay webhook] Signature invalide')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const data = payload?.data ?? {}
    const reference: string | undefined = data.reference
    const metadata: {
      kind?: string
      paymentId?: string
      schemaName?: string
      studentId?: string
      schoolId?: string
    } = data.metadata ?? {}

    // ── Paiement d'abonnement SaaS (création d'école) ──────────────────────
    if (metadata.kind === 'subscription') {
      if (!metadata.schoolId) {
        return NextResponse.json({ error: 'Missing schoolId' }, { status: 400 })
      }
      const res = await activateSchoolIfPaid(metadata.schoolId)
      console.info(`[GeniusPay webhook] Abonnement ${metadata.schoolId} → ${res.status}`)
      return NextResponse.json({ received: true })
    }

    // ── Paiement de frais (tenant) ─────────────────────────────────────────
    const { paymentId, schemaName } = metadata
    if (!reference || !paymentId || !schemaName) {
      console.error('[GeniusPay webhook] Métadonnées manquantes (reference/paymentId/schemaName)')
      return NextResponse.json({ error: 'Missing metadata fields' }, { status: 400 })
    }

    // On revérifie le statut côté GeniusPay (ne pas se fier au seul payload)
    const verification = await verifyPayment(reference)
    const db = getTenantPrisma(schemaName) as any

    if (verification.status === 'ACCEPTED') {
      await db.$executeRaw`
        UPDATE payments
        SET status = 'SUCCESS', paid_at = NOW()
        WHERE id = ${paymentId} AND provider_ref = ${reference}
      `
      console.info(`[GeniusPay webhook] Paiement ${paymentId} confirmé (${reference})`)
    } else if (verification.status === 'REFUSED') {
      await db.$executeRaw`
        UPDATE payments
        SET status = 'FAILED'
        WHERE id = ${paymentId} AND provider_ref = ${reference}
      `
      console.warn(`[GeniusPay webhook] Paiement ${paymentId} refusé (${reference})`)
    }
    // PENDING / processing : on attend une prochaine notification

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error('[GeniusPay webhook] Erreur inattendue:', e?.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GeniusPay peut envoyer un GET pour tester l'URL
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
