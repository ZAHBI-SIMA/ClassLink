import { withMobileAuth } from '@/lib/auth/mobile-guard'
import { getTenantPrisma } from '@/lib/db/tenant'
import { initiateSchoolPayment } from '@/lib/payments/provider'
import { NextResponse } from 'next/server'

export const POST = withMobileAuth(['STUDENT', 'PARENT'], async (req, ctx) => {
  // Extraire le paymentId depuis l'URL : /api/mobile/payments/[paymentId]/initiate
  const paymentId = req.url.match(/\/payments\/([^/]+)\/initiate/)?.[1]
  if (!paymentId) {
    return NextResponse.json({ success: false, error: 'paymentId manquant.' }, { status: 400 })
  }

  const db = getTenantPrisma(ctx.schemaName) as any

  const rows: any[] = await db.$queryRaw`
    SELECT p.id, p.amount, p.status, p.student_id,
           ft.name AS fee_name,
           u.first_name || ' ' || u.last_name AS student_name,
           u.email AS student_email
    FROM payments p
    JOIN fee_types ft ON ft.id = p.fee_type_id
    JOIN students s ON s.id = p.student_id
    JOIN users u ON u.id = s.user_id
    WHERE p.id = ${paymentId}
    LIMIT 1
  `
  const payment = rows[0]
  if (!payment) {
    return NextResponse.json({ success: false, error: 'Paiement introuvable.' }, { status: 404 })
  }

  // Vérifier les droits d'accès
  if (ctx.user.role === 'STUDENT') {
    const check: any[] = await db.$queryRaw`
      SELECT id FROM students WHERE user_id = ${ctx.user.userId} AND id = ${payment.student_id} LIMIT 1
    `
    if (!check[0]) {
      return NextResponse.json({ success: false, error: 'Accès non autorisé.' }, { status: 403 })
    }
  } else if (ctx.user.role === 'PARENT') {
    const check: any[] = await db.$queryRaw`
      SELECT ps.id FROM parent_students ps
      JOIN parents p2 ON p2.id = ps.parent_id
      WHERE p2.user_id = ${ctx.user.userId} AND ps.student_id = ${payment.student_id}
      LIMIT 1
    `
    if (!check[0]) {
      return NextResponse.json({ success: false, error: 'Accès non autorisé.' }, { status: 403 })
    }
  }

  if (payment.status === 'SUCCESS') {
    return NextResponse.json({ success: false, error: 'Ce paiement a déjà été effectué.' }, { status: 400 })
  }
  if (payment.status !== 'PENDING') {
    return NextResponse.json({ success: false, error: 'Ce paiement n\'est plus disponible.' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const init = await initiateSchoolPayment(ctx.schemaName, {
    amount:        Number(payment.amount),
    description:   payment.fee_name,
    customerId:    payment.student_id,
    customerName:  payment.student_name,
    customerEmail: payment.student_email ?? '',
    returnUrl:     `${baseUrl}/paiement/mobile-retour`,
    baseUrl,
    metadata: {
      paymentId,
      schemaName: ctx.schemaName,
      studentId:  payment.student_id,
    },
  })

  await db.$executeRaw`
    UPDATE payments
    SET provider = ${init.provider}, provider_ref = ${init.transactionId}
    WHERE id = ${paymentId}
  `

  return NextResponse.json({ success: true, paymentUrl: init.paymentUrl })
})
