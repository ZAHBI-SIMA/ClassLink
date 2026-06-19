import { NextRequest, NextResponse } from 'next/server'
import { withMobileAuth } from '@/lib/auth/mobile-guard'

export const GET = withMobileAuth(['STUDENT', 'PARENT'], async (req, { user, tenantDb }) => {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')

  let studentSqlId = `(SELECT id FROM students WHERE user_id = '${user.userId}' LIMIT 1)`

  if (user.role === 'PARENT' && studentId) {
    const check: any[] = await tenantDb.$queryRawUnsafe(`
      SELECT ps.id FROM parent_students ps
      JOIN parents p ON p.id = ps.parent_id
      WHERE p.user_id = '${user.userId}' AND ps.student_id = '${studentId}'
      LIMIT 1
    `)
    if (!check[0]) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })
    studentSqlId = `'${studentId}'`
  }

  const rows: any[] = await tenantDb.$queryRawUnsafe(`
    SELECT
      a.id, a.date, a.status, a.justified, a.comment,
      s.name AS subject_name
    FROM attendances a
    LEFT JOIN schedule_slots sl ON sl.id = a.schedule_slot_id
    LEFT JOIN subject_assignments sa ON sa.id = sl.subject_assignment_id
    LEFT JOIN subjects s ON s.id = sa.subject_id
    WHERE a.student_id = ${studentSqlId}
    ORDER BY a.date DESC
    LIMIT 100
  `)

  const stats = {
    absent:    rows.filter(r => r.status === 'ABSENT').length,
    late:      rows.filter(r => r.status === 'LATE').length,
    justified: rows.filter(r => r.justified).length,
  }

  return NextResponse.json({
    records: rows.map(r => ({
      id:          r.id,
      date:        r.date,
      status:      r.status,
      justified:   r.justified,
      comment:     r.comment,
      subjectName: r.subject_name,
    })),
    stats,
  })
})
