import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { requireRole } from '@/lib/auth/rbac'
import { getTenantPrisma } from '@/lib/db/tenant'
import { SchedulePdf } from '@/lib/pdf/schedule-pdf'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await requireRole('ADMIN', 'CENSOR', 'ACCOUNTANT')
    const { classId } = await params
    const db = getTenantPrisma(session.user.schemaName) as any

    const [slots, classRows, schoolRows] = await Promise.all([
      db.$queryRaw`
        SELECT sc.id, sc.day_of_week, sc.start_time, sc.end_time, sc.room,
               s.name  AS subject_name,
               u.first_name AS teacher_first,
               u.last_name  AS teacher_last
        FROM schedules sc
        JOIN teacher_subject_classes tsc ON tsc.id = sc.teacher_subject_class_id
        JOIN subjects s ON s.id = tsc.subject_id
        JOIN teachers t ON t.id = tsc.teacher_id
        JOIN users u    ON u.id = t.user_id
        WHERE sc.class_id = ${classId}
        ORDER BY sc.day_of_week, sc.start_time
      ` as Promise<any[]>,

      db.$queryRaw`
        SELECT c.name, l.name AS level_name
        FROM classes c
        LEFT JOIN levels l ON l.id = c.level_id
        WHERE c.id = ${classId} LIMIT 1
      ` as Promise<any[]>,

      db.$queryRaw`
        SELECT school_name FROM school_settings LIMIT 1
      ` as Promise<any[]>,
    ])

    if (!classRows[0]) {
      return NextResponse.json({ error: 'Classe introuvable.' }, { status: 404 })
    }

    const cl        = classRows[0]
    const className = cl.level_name ? `${cl.name} (${cl.level_name})` : cl.name
    const schoolName = schoolRows[0]?.school_name ?? 'Établissement'

    if ((slots as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Aucun créneau à exporter pour cette classe.' },
        { status: 400 }
      )
    }

    const element = createElement(SchedulePdf, {
      schoolName,
      className,
      slots: slots as any[],
    }) as ReactElement<DocumentProps>

    const buffer = await renderToBuffer(element)

    const filename = `emploi-du-temps-${cl.name}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      + '.pdf'

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
      },
    })
  } catch (e: any) {
    if (e?.message?.includes('UNAUTHORIZED') || e?.status === 401) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur.' }, { status: 500 })
  }
}
