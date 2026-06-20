'use server'

import { verifyPaymentToken } from '@/lib/payments/payment-link'
import { getTenantPrisma } from '@/lib/db/tenant'
import { initiateSchoolPayment } from '@/lib/payments/provider'
import type { ActionResult } from '@/types'

export async function getPublicPaymentDetails(token: string): Promise<ActionResult<{
  feeName:     string
  studentName: string
  schoolName:  string
  amount:      number
  status:      string
}>> {
  try {
    const payload = await verifyPaymentToken(token)
    if (!payload) return { success: false, error: 'Lien de paiement invalide ou expiré.' }

    const db = getTenantPrisma(payload.schemaName) as any
    const rows: any[] = await db.$queryRaw`
      SELECT p.status FROM payments p WHERE p.id = ${payload.paymentId} LIMIT 1
    `
    if (!rows[0]) return { success: false, error: 'Paiement introuvable.' }

    return {
      success: true,
      data: {
        feeName:     payload.feeName,
        studentName: payload.studentName,
        schoolName:  payload.schoolName,
        amount:      payload.amount,
        status:      rows[0].status,
      },
    }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Erreur.' }
  }
}

export async function initiatePublicPayment(token: string): Promise<ActionResult<{ paymentUrl: string }>> {
  try {
    const payload = await verifyPaymentToken(token)
    if (!payload) return { success: false, error: 'Lien de paiement invalide ou expiré.' }

    const { paymentId, schemaName, studentId, amount, feeName, studentName } = payload
    const db = getTenantPrisma(schemaName) as any

    const rows: any[] = await db.$queryRaw`
      SELECT p.id, p.status FROM payments p WHERE p.id = ${paymentId} LIMIT 1
    `
    const payment = rows[0]
    if (!payment)                      return { success: false, error: 'Paiement introuvable.' }
    if (payment.status === 'SUCCESS')  return { success: false, error: 'Ce paiement a déjà été effectué.' }
    if (payment.status !== 'PENDING')  return { success: false, error: 'Ce paiement n\'est plus disponible.' }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const init = await initiateSchoolPayment(schemaName, {
      amount,
      description: feeName,
      customerId:   studentId,
      customerName: studentName,
      customerEmail: '',
      returnUrl: `${baseUrl}/paiement/retour?token=${encodeURIComponent(token)}`,
      baseUrl,
      metadata:   { paymentId, schemaName, studentId },
    })

    await db.$executeRaw`
      UPDATE payments
      SET provider = ${init.provider}, provider_ref = ${init.transactionId}
      WHERE id = ${paymentId}
    `

    return { success: true, data: { paymentUrl: init.paymentUrl } }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Erreur lors de l\'initiation du paiement.' }
  }
}
