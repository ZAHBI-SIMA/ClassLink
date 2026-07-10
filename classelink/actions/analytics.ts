'use server'

import { requireRole } from '@/lib/auth/rbac'
import { getTenantPrisma } from '@/lib/db/tenant'

export async function getAdminAnalytics() {
  const session = await requireRole('ADMIN', 'CENSOR', 'ACCOUNTANT')
  const db      = getTenantPrisma(session.user.schemaName) as any

  const [
    gradeDistribution,
    averagesByClass,
    averagesBySubject,
    attendanceSummary,
    attendanceByClass,
    paymentTrend,
    enrollmentByLevel,
    gradeEvolution,
  ] = await Promise.all([

    // Distribution des notes (0-5, 5-10, 10-15, 15-20)
    db.$queryRaw`
      SELECT
        CASE
          WHEN value * 20.0 / max_value < 5  THEN '0-5'
          WHEN value * 20.0 / max_value < 10 THEN '5-10'
          WHEN value * 20.0 / max_value < 15 THEN '10-15'
          ELSE '15-20'
        END AS range,
        COUNT(*)::int AS count
      FROM grades
      GROUP BY range
      ORDER BY range
    `,

    // Moyenne par classe (trimestre courant)
    db.$queryRaw`
      SELECT
        c.name AS class_name,
        ROUND(AVG(g.value * 20.0 / g.max_value)::numeric, 2) AS average,
        COUNT(DISTINCT g.student_id)::int AS student_count
      FROM grades g
      JOIN enrollments e  ON e.student_id = g.student_id AND e.status = 'ACTIVE'
      JOIN classes     c  ON e.class_id   = c.id
      JOIN terms       t  ON g.term_id    = t.id
      JOIN academic_years ay ON t.academic_year_id = ay.id AND ay.is_current = TRUE
      GROUP BY c.name
      ORDER BY average DESC
    `,

    // Moyenne par matière
    db.$queryRaw`
      SELECT
        s.name AS subject_name,
        s.code AS subject_code,
        ROUND(AVG(g.value * 20.0 / g.max_value)::numeric, 2) AS average,
        COUNT(*)::int AS grade_count
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      JOIN terms    t ON g.term_id    = t.id
      JOIN academic_years ay ON t.academic_year_id = ay.id AND ay.is_current = TRUE
      GROUP BY s.name, s.code
      ORDER BY average DESC
    `,

    // Résumé présences global
    db.$queryRaw`
      SELECT
        COUNT(*) FILTER (WHERE status = 'PRESENT')::int  AS present,
        COUNT(*) FILTER (WHERE status = 'ABSENT')::int   AS absent,
        COUNT(*) FILTER (WHERE status = 'LATE')::int     AS late,
        COUNT(*) FILTER (WHERE status = 'EXCUSED')::int  AS excused,
        COUNT(*)::int                                     AS total
      FROM attendances
    `,

    // Taux présence par classe
    db.$queryRaw`
      SELECT
        c.name AS class_name,
        COUNT(*) FILTER (WHERE a.status = 'PRESENT')::int  AS present,
        COUNT(*) FILTER (WHERE a.status = 'ABSENT')::int   AS absent,
        COUNT(*)::int                                        AS total,
        CASE WHEN COUNT(*) > 0
          THEN ROUND((COUNT(*) FILTER (WHERE a.status = 'PRESENT') * 100.0 / COUNT(*))::numeric, 1)
          ELSE 0
        END AS attendance_rate
      FROM attendances a
      JOIN students   s ON a.student_id = s.id
      JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
      JOIN classes    c ON e.class_id   = c.id
      GROUP BY c.name
      ORDER BY attendance_rate DESC
    `,

    // Tendance financière par mois (6 mois)
    db.$queryRaw`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
        DATE_TRUNC('month', created_at)                       AS month_date,
        SUM(amount) FILTER (WHERE status = 'SUCCESS')::float  AS collected,
        COUNT(*) FILTER (WHERE status = 'PENDING')::int       AS pending_count
      FROM payments
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month_date
    `,

    // Inscriptions par niveau
    db.$queryRaw`
      SELECT
        l.name AS level_name,
        COUNT(DISTINCT e.student_id)::int AS student_count
      FROM enrollments e
      JOIN classes     c  ON e.class_id    = c.id
      JOIN levels      l  ON c.level_id    = l.id
      JOIN academic_years ay ON c.academic_year_id = ay.id AND ay.is_current = TRUE
      WHERE e.status = 'ACTIVE'
      GROUP BY l.name, l.level_order
      ORDER BY l.level_order
    `,

    // Évolution des moyennes par trimestre
    db.$queryRaw`
      SELECT
        t.name       AS term_name,
        t.term_order,
        ROUND(AVG(g.value * 20.0 / g.max_value)::numeric, 2) AS average
      FROM grades g
      JOIN terms t ON g.term_id = t.id
      JOIN academic_years ay ON t.academic_year_id = ay.id AND ay.is_current = TRUE
      GROUP BY t.name, t.term_order
      ORDER BY t.term_order
    `,
  ])

  // Calculs supplémentaires
  const att = (attendanceSummary as any[])[0] ?? { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
  const attendanceRate = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0

  // Nombre total élèves actifs
  const [studentCountRow] = await db.$queryRaw`
    SELECT COUNT(DISTINCT e.student_id)::int AS count
    FROM enrollments e
    JOIN classes c ON e.class_id = c.id
    JOIN academic_years ay ON c.academic_year_id = ay.id AND ay.is_current = TRUE
    WHERE e.status = 'ACTIVE'
  ` as any[]

  const [paymentStats] = await db.$queryRaw`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0)::float AS collected,
      COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0)::float  AS pending,
      COUNT(*) FILTER (WHERE status = 'PENDING')::int                    AS pending_count
    FROM payments
  ` as any[]

  const [atRiskStudents, financialForecast] = await Promise.all([
    getAtRiskStudents(db),
    getFinancialForecast(db, paymentTrend as any[]),
  ])

  return {
    gradeDistribution:  gradeDistribution  as any[],
    averagesByClass:    averagesByClass     as any[],
    averagesBySubject:  averagesBySubject   as any[],
    attendanceSummary: {
      ...att,
      attendanceRate,
    },
    attendanceByClass:  attendanceByClass  as any[],
    paymentTrend:       paymentTrend       as any[],
    enrollmentByLevel:  enrollmentByLevel  as any[],
    gradeEvolution:     gradeEvolution     as any[],
    totalStudents:      studentCountRow?.count ?? 0,
    paymentStats,
    atRiskStudents,
    financialForecast,
  }
}

// ─── Élèves à risque ───────────────────────────────────────────────────────────
// Détection par règles explicites (pas d'IA) : un élève est signalé s'il cumule
// au moins un facteur parmi académique / assiduité / financier. Trié par nombre
// de facteurs cumulés, puis par moyenne croissante.
const RISK_ACADEMIC_THRESHOLD    = 10   // moyenne /20 en dessous de laquelle l'élève est à risque
const RISK_ABSENCE_RATE_THRESHOLD = 20  // % d'absences non justifiées à partir duquel c'est un risque

async function getAtRiskStudents(db: any) {
  const rows = await db.$queryRaw`
    WITH active_students AS (
      SELECT DISTINCT ON (s.id)
        s.id AS student_id, s.student_id AS student_number,
        u.first_name, u.last_name, c.name AS class_name
      FROM students s
      JOIN users      u ON s.user_id    = u.id
      JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
      JOIN classes    c ON e.class_id   = c.id
      JOIN academic_years ay ON c.academic_year_id = ay.id AND ay.is_current = TRUE
    ),
    academic AS (
      SELECT g.student_id, ROUND(AVG(g.value * 20.0 / g.max_value)::numeric, 2) AS average
      FROM grades g
      JOIN terms t ON g.term_id = t.id
      JOIN academic_years ay ON t.academic_year_id = ay.id AND ay.is_current = TRUE
      GROUP BY g.student_id
    ),
    attendance AS (
      SELECT
        a.student_id,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE a.status = 'ABSENT' AND NOT a.justified)::int AS unexcused_absences
      FROM attendances a
      GROUP BY a.student_id
    ),
    financial AS (
      SELECT p.student_id, COUNT(*)::int AS overdue_count, COALESCE(SUM(p.amount), 0)::float AS overdue_amount
      FROM payments p
      WHERE p.status = 'PENDING' AND p.due_date IS NOT NULL AND p.due_date < NOW()
      GROUP BY p.student_id
    )
    SELECT
      ast.student_id, ast.student_number, ast.first_name, ast.last_name, ast.class_name,
      ac.average,
      COALESCE(at.unexcused_absences, 0) AS unexcused_absences,
      COALESCE(at.total, 0)              AS attendance_total,
      CASE WHEN COALESCE(at.total, 0) > 0
        THEN ROUND((COALESCE(at.unexcused_absences, 0) * 100.0 / at.total)::numeric, 1)
        ELSE 0
      END AS absence_rate,
      COALESCE(fin.overdue_count, 0)  AS overdue_count,
      COALESCE(fin.overdue_amount, 0) AS overdue_amount
    FROM active_students ast
    LEFT JOIN academic   ac  ON ac.student_id  = ast.student_id
    LEFT JOIN attendance at  ON at.student_id  = ast.student_id
    LEFT JOIN financial  fin ON fin.student_id = ast.student_id
    WHERE
      (ac.average IS NOT NULL AND ac.average < ${RISK_ACADEMIC_THRESHOLD})
      OR (COALESCE(at.total, 0) > 0 AND (COALESCE(at.unexcused_absences, 0) * 100.0 / at.total) > ${RISK_ABSENCE_RATE_THRESHOLD})
      OR COALESCE(fin.overdue_count, 0) > 0
  `

  return (rows as any[])
    .map(r => {
      const reasons: string[] = []
      if (r.average !== null && parseFloat(r.average) < RISK_ACADEMIC_THRESHOLD) {
        reasons.push(`Moyenne faible (${parseFloat(r.average).toFixed(2)}/20)`)
      }
      if (parseFloat(r.absence_rate) > RISK_ABSENCE_RATE_THRESHOLD) {
        reasons.push(`${r.absence_rate}% d'absences non justifiées`)
      }
      if (r.overdue_count > 0) {
        reasons.push(`${r.overdue_count} paiement(s) en retard`)
      }
      return { ...r, reasons, riskScore: reasons.length }
    })
    .sort((a, b) => b.riskScore - a.riskScore || (parseFloat(a.average ?? '20') - parseFloat(b.average ?? '20')))
    .slice(0, 30)
}

// ─── Prévisions financières ────────────────────────────────────────────────────
// Régression linéaire simple sur la tendance des 6 derniers mois pour projeter
// le mois suivant, combinée au taux de recouvrement historique pour estimer la
// part réellement encaissable du reste à percevoir.
async function getFinancialForecast(db: any, monthlyTrend: any[]) {
  const points = monthlyTrend
    .map((m, i) => ({ x: i, y: Number(m.collected) || 0 }))
    .filter(p => p.y > 0 || monthlyTrend.length <= 3) // ignore les mois à 0 si assez d'historique

  const n = points.length
  let nextMonthProjected = 0
  if (n >= 2) {
    const sumX  = points.reduce((s, p) => s + p.x, 0)
    const sumY  = points.reduce((s, p) => s + p.y, 0)
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
    const sumXX = points.reduce((s, p) => s + p.x * p.x, 0)
    const denom = n * sumXX - sumX * sumX
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0
    const intercept = (sumY - slope * sumX) / n
    nextMonthProjected = Math.max(0, Math.round(slope * n + intercept))
  } else if (n === 1) {
    nextMonthProjected = Math.round(points[0].y)
  }

  const [{ pending, collected }] = await db.$queryRaw`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0)::float AS pending,
      COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0)::float AS collected
    FROM payments
  ` as any[]

  // Taux de recouvrement historique = collecté / (collecté + en attente)
  const historicalCollectionRate = (collected + pending) > 0 ? collected / (collected + pending) : 0
  const expectedFromPending = Math.round(pending * historicalCollectionRate)

  // Vitesse moyenne de collecte mensuelle (hors mois à 0) → délai estimé pour percevoir le reste
  const avgMonthly = points.length > 0
    ? points.reduce((s, p) => s + p.y, 0) / points.length
    : 0
  const monthsToCollectPending = avgMonthly > 0 ? Math.ceil(pending / avgMonthly) : null

  return {
    nextMonthProjected,
    pendingTotal: pending,
    expectedFromPending,
    historicalCollectionRate: Math.round(historicalCollectionRate * 100),
    monthsToCollectPending,
  }
}

// ─── Rapport financier détaillé ───────────────────────────────────────────────
export async function getFinancialReport() {
  const session = await requireRole('ADMIN', 'ACCOUNTANT')
  const db      = getTenantPrisma(session.user.schemaName) as any

  const [byFeeType, byClass, monthlyTrend, pendingList] = await Promise.all([

    // Par type de frais
    db.$queryRaw`
      SELECT
        ft.name                                                          AS fee_name,
        ft.amount                                                        AS unit_price,
        COUNT(p.id)::int                                                 AS total_payments,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'SUCCESS'), 0)::float  AS collected,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'PENDING'), 0)::float  AS pending,
        COUNT(p.id) FILTER (WHERE p.status = 'SUCCESS')::int            AS paid_count,
        COUNT(p.id) FILTER (WHERE p.status = 'PENDING')::int            AS pending_count
      FROM fee_types ft
      LEFT JOIN payments p ON p.fee_type_id = ft.id
      GROUP BY ft.name, ft.amount
      ORDER BY collected DESC
    `,

    // Par classe
    db.$queryRaw`
      SELECT
        c.name AS class_name,
        COUNT(DISTINCT p.student_id)::int                                AS student_count,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'SUCCESS'), 0)::float  AS collected,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'PENDING'), 0)::float  AS pending
      FROM payments p
      JOIN students   s ON p.student_id = s.id
      JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
      JOIN classes    c ON e.class_id   = c.id
      GROUP BY c.name
      ORDER BY collected DESC
    `,

    // Tendance mensuelle (12 mois)
    db.$queryRaw`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') AS month,
        DATE_TRUNC('month', created_at)                     AS month_date,
        COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0)::float AS collected,
        COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0)::float AS pending
      FROM payments
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month_date
    `,

    // Liste des impayés (top 50)
    db.$queryRaw`
      SELECT
        p.id,
        p.amount,
        p.due_date,
        p.created_at,
        ft.name      AS fee_name,
        u.first_name,
        u.last_name,
        s.student_id AS student_number,
        c.name       AS class_name,
        pu.first_name AS parent_first_name,
        pu.last_name  AS parent_last_name,
        par_user.phone AS parent_phone
      FROM payments p
      JOIN students   s  ON p.student_id  = s.id
      JOIN users      u  ON s.user_id     = u.id
      JOIN fee_types  ft ON p.fee_type_id = ft.id
      JOIN enrollments e  ON e.student_id  = s.id AND e.status = 'ACTIVE'
      JOIN classes    c  ON e.class_id    = c.id
      LEFT JOIN parent_students ps  ON ps.student_id = s.id AND ps.is_primary = TRUE
      LEFT JOIN parents        par  ON ps.parent_id  = par.id
      LEFT JOIN users par_user      ON par.user_id   = par_user.id
      LEFT JOIN users pu            ON par.user_id   = pu.id
      WHERE p.status = 'PENDING'
      ORDER BY p.due_date ASC NULLS LAST, p.amount DESC
      LIMIT 50
    `,
  ])

  // Totaux globaux
  const [totals] = await db.$queryRaw`
    SELECT
      COALESCE(SUM(amount), 0)::float                                    AS total_expected,
      COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0)::float  AS total_collected,
      COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0)::float  AS total_pending,
      COUNT(*) FILTER (WHERE status = 'SUCCESS')::int                    AS paid_count,
      COUNT(*) FILTER (WHERE status = 'PENDING')::int                    AS pending_count,
      COUNT(*)::int                                                        AS total_count
    FROM payments
  ` as any[]

  const collectionRate = totals?.total_expected > 0
    ? Math.round((totals.total_collected / totals.total_expected) * 100)
    : 0

  return {
    totals: { ...totals, collectionRate },
    byFeeType:    byFeeType     as any[],
    byClass:      byClass       as any[],
    monthlyTrend: monthlyTrend  as any[],
    pendingList:  pendingList   as any[],
  }
}
