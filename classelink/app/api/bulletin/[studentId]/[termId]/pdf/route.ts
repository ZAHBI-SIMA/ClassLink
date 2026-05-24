import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { getBulletinData } from '@/actions/bulletin'
import { BulletinPdf } from '@/lib/pdf/bulletin-pdf'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string; termId: string }> }
) {
  const { studentId, termId } = await params

  const result = await getBulletinData(studentId, termId)
  if (!result.success || !result.data) {
    return NextResponse.json({ error: 'Bulletin introuvable.' }, { status: 404 })
  }

  const { student, term, school, subjects, general_average, class_average, rank, attendance, council } = result.data

  const element = createElement(BulletinPdf, {
    student,
    term,
    school,
    subjects,
    general_average,
    class_average,
    rank,
    attendance,
    council,
  }) as ReactElement<DocumentProps>

  const buffer = await renderToBuffer(element)

  const filename = `bulletin_${student.last_name ?? 'eleve'}_${term?.name ?? 'trimestre'}.pdf`
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.-]/g, '')

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  })
}
