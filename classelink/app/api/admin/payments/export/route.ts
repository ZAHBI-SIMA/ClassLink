import { NextResponse } from 'next/server'
import { getPaymentsForExport } from '@/actions/admin'

export async function GET() {
  const payments = await getPaymentsForExport()

  const headers = [
    'N° Élève', 'Nom', 'Prénom', 'Classe',
    'Type de frais', 'Montant', 'Statut',
    'Date échéance', 'Date paiement',
  ]

  const rows = payments.map((p: any) => [
    p.student_number,
    p.last_name,
    p.first_name,
    p.class_name ?? '',
    p.fee_name,
    p.amount,
    p.status,
    p.due_date ? new Date(p.due_date).toLocaleDateString('fr-FR') : '',
    p.paid_at  ? new Date(p.paid_at).toLocaleDateString('fr-FR')  : '',
  ])

  const csv = [headers, ...rows]
    .map(row =>
      row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    )
    .join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="paiements.csv"',
    },
  })
}
