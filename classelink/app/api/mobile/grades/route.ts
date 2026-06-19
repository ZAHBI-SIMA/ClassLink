import { NextRequest, NextResponse } from 'next/server'
import { withMobileAuth } from '@/lib/auth/mobile-guard'

export const GET = withMobileAuth(['STUDENT'], async (req, { user, tenantDb }) => {
  const { searchParams } = new URL(req.url)
  const termId = searchParams.get('termId')

  const termFilter = termId
    ? `AND t.id = '${termId.replace(/'/g, "''")}'`
    : ''

  const rows: any[] = await tenantDb.$queryRawUnsafe(`
    SELECT
      g.id,
      g.value,
      g.coefficient,
      g.comment,
      g.graded_at,
      s.name  AS subject_name,
      s.color AS subject_color,
      t.name  AS term_name,
      t.term_order
    FROM grades g
    JOIN subject_assignments sa ON sa.id = g.subject_assignment_id
    JOIN subjects s ON s.id = sa.subject_id
    JOIN terms t ON t.id = g.term_id
    WHERE g.student_id = (
      SELECT id FROM students WHERE user_id = '${user.userId.replace(/'/g, "''")}' LIMIT 1
    )
    ${termFilter}
    ORDER BY t.term_order, s.name, g.graded_at DESC
  `)

  // Calcul moyenne par matière et globale
  const bySubject: Record<string, { name: string; color: string; grades: any[]; average: number | null }> = {}
  for (const g of rows) {
    if (!bySubject[g.subject_name]) {
      bySubject[g.subject_name] = { name: g.subject_name, color: g.subject_color, grades: [], average: null }
    }
    bySubject[g.subject_name].grades.push({
      id: g.id, value: parseFloat(g.value), coefficient: g.coefficient,
      comment: g.comment, gradedAt: g.graded_at,
    })
  }

  // Calcul moyennes
  for (const sub of Object.values(bySubject)) {
    const totalCoef = sub.grades.reduce((s, g) => s + g.coefficient, 0)
    if (totalCoef > 0) {
      const weighted = sub.grades.reduce((s, g) => s + g.value * g.coefficient, 0)
      sub.average = Math.round((weighted / totalCoef) * 100) / 100
    }
  }

  // Termes disponibles
  const terms: any[] = await tenantDb.$queryRaw`
    SELECT id, name, term_order FROM terms ORDER BY term_order
  `

  return NextResponse.json({ subjects: Object.values(bySubject), terms })
})
