'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'

async function getParentDb() {
  const session = await requireRole('PARENT')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, session }
}

export async function getParentChildren() {
  const { db, session } = await getParentDb()
  return db.$queryRaw`
    SELECT s.id, s.student_id AS student_number,
           u.first_name, u.last_name, u.email, u.avatar_url,
           ps.relation,
           c.name AS class_name, l.name AS level_name,
           ay.name AS year_name
    FROM parent_students ps
    JOIN parents p ON p.id = ps.parent_id
    JOIN students s ON s.id = ps.student_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN enrollments e  ON e.student_id = s.id AND e.status = 'ACTIVE'
    LEFT JOIN classes c      ON c.id = e.class_id
    LEFT JOIN levels l       ON l.id = c.level_id
    LEFT JOIN academic_years ay ON ay.is_current = TRUE
    WHERE p.user_id = ${session.user.id}
    ORDER BY u.last_name, u.first_name
  ` as Promise<any[]>
}

export async function getChildDetails(studentId: string) {
  const { db, session } = await getParentDb()

  // Vérifier que l'élève appartient bien à ce parent
  const check: any[] = await db.$queryRaw`
    SELECT ps.id FROM parent_students ps
    JOIN parents p ON p.id = ps.parent_id
    WHERE p.user_id = ${session.user.id} AND ps.student_id = ${studentId}
    LIMIT 1
  `
  if (!check[0]) return null

  const [profile, terms, payments, attendance] = await Promise.all([
    db.$queryRaw`
      SELECT s.id, s.student_id AS student_number, s.date_of_birth, s.gender,
             u.first_name, u.last_name, u.email, u.phone, u.avatar_url,
             c.id AS class_id, c.name AS class_name, l.name AS level_name,
             ay.name AS year_name
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN enrollments e  ON e.student_id = s.id AND e.status = 'ACTIVE'
      LEFT JOIN classes c      ON c.id = e.class_id
      LEFT JOIN levels l       ON l.id = c.level_id
      LEFT JOIN academic_years ay ON ay.is_current = TRUE
      WHERE s.id = ${studentId} LIMIT 1
    ` as Promise<any[]>,

    db.$queryRaw`
      SELECT t.id, t.name, t.term_order FROM terms t
      JOIN academic_years ay ON ay.id = t.academic_year_id AND ay.is_current = TRUE
      ORDER BY t.term_order
    ` as Promise<any[]>,

    db.$queryRaw`
      SELECT p.id, p.amount, p.status, p.paid_at, p.due_date, ft.name AS fee_name
      FROM payments p
      JOIN fee_types ft ON ft.id = p.fee_type_id
      WHERE p.student_id = ${studentId}
      ORDER BY p.created_at DESC LIMIT 20
    ` as Promise<any[]>,

    db.$queryRaw`
      SELECT t.name AS term_name, t.term_order,
             COUNT(a.id)::int AS total,
             COUNT(CASE WHEN a.status='ABSENT' THEN 1 END)::int AS absent,
             COUNT(CASE WHEN a.status='LATE'   THEN 1 END)::int AS late,
             COUNT(CASE WHEN a.status='ABSENT' AND a.justified=FALSE THEN 1 END)::int AS unjustified
      FROM terms t
      JOIN academic_years ay ON ay.id = t.academic_year_id AND ay.is_current = TRUE
      LEFT JOIN attendances a ON a.term_id = t.id AND a.student_id = ${studentId}
      GROUP BY t.id, t.name, t.term_order
      ORDER BY t.term_order
    ` as Promise<any[]>,
  ])

  // Moyennes générales par trimestre
  const averages: any[] = await db.$queryRaw`
    SELECT g.term_id, t.name AS term_name, t.term_order,
           ROUND(
             SUM(
               (SUM(g.value * g.coefficient) / NULLIF(SUM(g.coefficient), 0))
               * COALESCE(ls.coefficient, 1)
             ) OVER (PARTITION BY g.term_id)
             /
             NULLIF(SUM(COALESCE(ls.coefficient, 1)) OVER (PARTITION BY g.term_id), 0),
             2
           ) AS general_average
    FROM grades g
    JOIN terms t ON t.id = g.term_id
    JOIN academic_years ay ON ay.id = t.academic_year_id AND ay.is_current = TRUE
    JOIN subjects s ON s.id = g.subject_id
    LEFT JOIN enrollments e ON e.student_id = ${studentId} AND e.status = 'ACTIVE'
    LEFT JOIN level_subjects ls ON ls.subject_id = g.subject_id AND ls.level_id = (
      SELECT c.level_id FROM classes c WHERE c.id = e.class_id LIMIT 1
    )
    WHERE g.student_id = ${studentId}
    GROUP BY g.term_id, g.subject_id, t.name, t.term_order, ls.coefficient
  `

  // Déduplique les moyennes par trimestre (prend la première valeur par term_id)
  const avgByTerm: Record<string, number | null> = {}
  for (const a of averages) {
    if (!avgByTerm[a.term_id]) {
      avgByTerm[a.term_id] = a.general_average ? parseFloat(a.general_average) : null
    }
  }

  return {
    profile: profile[0],
    terms: terms.map((t: any) => ({ ...t, average: avgByTerm[t.id] ?? null })),
    payments,
    attendance,
  }
}