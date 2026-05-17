'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/rbac'
import { getTenantPrisma } from '@/lib/db/tenant'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import type { ActionResult } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function dbError(e: any): string {
  if (e?.code === '23505' || e?.message?.includes('23505')) {
    const detail: string = e?.meta?.details ?? e?.message ?? ''
    if (detail.includes('email')) return 'Cette adresse email est déjà utilisée.'
    return 'Un enregistrement avec ces informations existe déjà.'
  }
  return e?.message ?? 'Une erreur est survenue.'
}

async function getDb() {
  const session = await requireRole('ADMIN', 'CENSOR', 'ACCOUNTANT')
  return { db: getTenantPrisma(session.user.schemaName) as any, session }
}

// ─── KPIs Dashboard ──────────────────────────────────────────────────────────

export async function getAdminKPIs() {
  const { db } = await getDb()

  const [
    studentsResult,
    teachersResult,
    classesResult,
    currentYear,
    absencesResult,
    unpaidResult,
  ] = await Promise.all([
    db.$queryRaw`SELECT COUNT(*)::int AS count FROM students`,
    db.$queryRaw`SELECT COUNT(*)::int AS count FROM teachers`,
    db.$queryRaw`SELECT COUNT(*)::int AS count FROM classes`,
    db.$queryRaw`SELECT id, name FROM academic_years WHERE is_current = TRUE LIMIT 1`,
    db.$queryRaw`
      SELECT COUNT(*)::int AS count FROM attendances
      WHERE status = 'ABSENT' AND justified = FALSE
      AND date >= NOW() - INTERVAL '30 days'
    `,
    db.$queryRaw`
      SELECT COUNT(*)::int AS count FROM payments
      WHERE status = 'PENDING' AND due_date < NOW()
    `,
  ])

  return {
    totalStudents: (studentsResult as any[])[0]?.count ?? 0,
    totalTeachers: (teachersResult as any[])[0]?.count ?? 0,
    totalClasses:  (classesResult as any[])[0]?.count ?? 0,
    currentYear:   (currentYear as any[])[0] ?? null,
    absencesMonth: (absencesResult as any[])[0]?.count ?? 0,
    unpaidFees:    (unpaidResult as any[])[0]?.count ?? 0,
  }
}

// ─── Années scolaires ─────────────────────────────────────────────────────────

export async function getAcademicYears() {
  const { db } = await getDb()
  return db.$queryRaw`
    SELECT ay.*, COUNT(t.id)::int AS terms_count
    FROM academic_years ay
    LEFT JOIN terms t ON t.academic_year_id = ay.id
    GROUP BY ay.id
    ORDER BY ay.start_date DESC
  ` as Promise<any[]>
}

export async function createAcademicYear(formData: FormData): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    const name      = formData.get('name') as string
    const startDate = formData.get('startDate') as string
    const endDate   = formData.get('endDate') as string
    const isCurrent = formData.get('isCurrent') === 'on'

    if (!name || !startDate || !endDate) {
      return { success: false, error: 'Tous les champs sont requis.' }
    }

    if (isCurrent) {
      await db.$executeRaw`UPDATE academic_years SET is_current = FALSE`
    }

    await db.$executeRaw`
      INSERT INTO academic_years (name, start_date, end_date, is_current)
      VALUES (${name}, ${toDate(startDate)}, ${toDate(endDate)}, ${isCurrent})
    `

    // Créer les 3 trimestres automatiquement
    const year = await db.$queryRaw`
      SELECT id FROM academic_years WHERE name = ${name} ORDER BY created_at DESC LIMIT 1
    ` as { id: string }[]

    if (year[0]) {
      const yid = year[0].id
      const terms = [
        { name: '1er Trimestre', order: 1 },
        { name: '2ème Trimestre', order: 2 },
        { name: '3ème Trimestre', order: 3 },
      ]
      for (const t of terms) {
        await db.$executeRaw`
          INSERT INTO terms (academic_year_id, name, term_order, start_date, end_date)
          VALUES (${yid}, ${t.name}, ${t.order}, ${toDate(startDate)}, ${toDate(endDate)})
        `
      }
    }

    revalidatePath('/admin/academic-years')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

export async function setCurrentYear(yearId: string): Promise<void> {
  const { db } = await getDb()
  await db.$executeRaw`UPDATE academic_years SET is_current = FALSE`
  await db.$executeRaw`UPDATE academic_years SET is_current = TRUE WHERE id = ${yearId}`
}

// ─── Niveaux ──────────────────────────────────────────────────────────────────

export async function getLevels() {
  const { db } = await getDb()
  return db.$queryRaw`
    SELECT * FROM levels ORDER BY level_order ASC
  ` as Promise<any[]>
}

export async function createLevel(formData: FormData): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    const name  = formData.get('name') as string
    const order = parseInt(formData.get('order') as string) || 1

    if (!name) return { success: false, error: 'Le nom est requis.' }

    await db.$executeRaw`
      INSERT INTO levels (name, level_order) VALUES (${name}, ${order})
    `
    revalidatePath('/admin/subjects')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

// ─── Matières ─────────────────────────────────────────────────────────────────

export async function getSubjects() {
  const { db } = await getDb()
  return db.$queryRaw`
    SELECT s.*,
           json_agg(
             json_build_object('level_id', ls.level_id, 'level_name', l.name, 'coefficient', ls.coefficient)
           ) FILTER (WHERE ls.id IS NOT NULL) AS level_assignments
    FROM subjects s
    LEFT JOIN level_subjects ls ON ls.subject_id = s.id
    LEFT JOIN levels l ON l.id = ls.level_id
    GROUP BY s.id
    ORDER BY s.name
  ` as Promise<any[]>
}

export async function createSubject(formData: FormData): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    const name = formData.get('name') as string
    const code = formData.get('code') as string

    if (!name || !code) return { success: false, error: 'Nom et code requis.' }

    await db.$executeRaw`INSERT INTO subjects (name, code) VALUES (${name}, ${code})`
    revalidatePath('/admin/subjects')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

// ─── Classes ──────────────────────────────────────────────────────────────────

export async function getClasses() {
  const { db } = await getDb()
  return db.$queryRaw`
    SELECT c.*, l.name AS level_name, s.name AS stream_name,
           ay.name AS year_name,
           COUNT(DISTINCT e.id)::int AS student_count,
           u.first_name || ' ' || u.last_name AS head_teacher_name
    FROM classes c
    JOIN levels l ON l.id = c.level_id
    LEFT JOIN streams s ON s.id = c.stream_id
    JOIN academic_years ay ON ay.id = c.academic_year_id
    LEFT JOIN enrollments e ON e.class_id = c.id AND e.status = 'ACTIVE'
    LEFT JOIN teachers t ON t.id = c.head_teacher_id
    LEFT JOIN users u ON u.id = t.user_id
    GROUP BY c.id, l.name, l.level_order, s.name, ay.name, u.first_name, u.last_name
    ORDER BY l.level_order, c.name
  ` as Promise<any[]>
}

export async function createClass(formData: FormData): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    const name           = formData.get('name') as string
    const levelId        = formData.get('levelId') as string
    const academicYearId = formData.get('academicYearId') as string
    const maxStudents    = parseInt(formData.get('maxStudents') as string) || 40
    const room           = formData.get('room') as string || null

    if (!name || !levelId || !academicYearId) {
      return { success: false, error: 'Nom, niveau et année scolaire requis.' }
    }

    await db.$executeRaw`
      INSERT INTO classes (name, level_id, academic_year_id, max_students, room)
      VALUES (${name}, ${levelId}, ${academicYearId}, ${maxStudents}, ${room})
    `
    revalidatePath('/admin/classes')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

// ─── Enseignants ──────────────────────────────────────────────────────────────

export async function getTeachers() {
  const { db } = await getDb()
  return db.$queryRaw`
    SELECT t.*, u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.is_active,
           COUNT(DISTINCT tsc.class_id)::int AS class_count
    FROM teachers t
    JOIN users u ON u.id = t.user_id
    LEFT JOIN teacher_subject_classes tsc ON tsc.teacher_id = t.id
    GROUP BY t.id, u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.is_active
    ORDER BY u.last_name, u.first_name
  ` as Promise<any[]>
}

export async function getTeacherById(id: string) {
  const { db } = await getDb()
  const rows: any[] = await db.$queryRaw`
    SELECT t.id, t.user_id, t.employee_id, t.specialty, t.hire_date,
           u.first_name, u.last_name, u.email, u.phone, u.avatar_url,
           u.is_active, u.created_at,
           COUNT(DISTINCT tsc.class_id)::int  AS class_count,
           COUNT(DISTINCT tsc.subject_id)::int AS subject_count,
           json_agg(DISTINCT jsonb_build_object(
             'class_name',   c.name,
             'subject_name', s.name,
             'subject_code', s.code
           )) FILTER (WHERE tsc.id IS NOT NULL) AS assignments
    FROM teachers t
    JOIN users u ON u.id = t.user_id
    LEFT JOIN teacher_subject_classes tsc ON tsc.teacher_id = t.id
    LEFT JOIN classes c ON c.id = tsc.class_id
    LEFT JOIN subjects s ON s.id = tsc.subject_id
    WHERE t.id = ${id}
    GROUP BY t.id, t.user_id, t.employee_id, t.specialty, t.hire_date,
             u.first_name, u.last_name, u.email, u.phone, u.avatar_url,
             u.is_active, u.created_at
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function resetTeacherPassword(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db } = await getDb()
  const userId = formData.get('userId') as string
  if (!userId) return { success: false, error: 'Utilisateur introuvable.' }

  try {
    const tempPassword = nanoid(12)
    const passwordHash = await hash(tempPassword, 12)
    await db.$executeRaw`
      UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${userId}
    `
    return { success: true, data: { tempPassword } }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

export async function createTeacher(formData: FormData): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    const firstName  = formData.get('firstName') as string
    const lastName   = formData.get('lastName') as string
    const email      = formData.get('email') as string
    const phone      = formData.get('phone') as string || null
    const specialty  = formData.get('specialty') as string || null
    const employeeId = formData.get('employeeId') as string || null

    if (!firstName || !lastName || !email) {
      return { success: false, error: 'Prénom, nom et email requis.' }
    }

    const tempPassword = nanoid(12)
    const passwordHash = await hash(tempPassword, 12)

    await db.$executeRaw`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
      VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, ${phone}, 'TEACHER')
    `

    const user = await db.$queryRaw`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    ` as { id: string }[]

    if (!user[0]) return { success: false, error: 'Erreur lors de la création de l\'utilisateur.' }

    await db.$executeRaw`
      INSERT INTO teachers (user_id, employee_id, specialty)
      VALUES (${user[0].id}, ${employeeId}, ${specialty})
    `

    revalidatePath('/admin/teachers')
    return { success: true, data: { tempPassword } }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

// ─── Élèves ───────────────────────────────────────────────────────────────────

export async function getStudents(search?: string, classId?: string) {
  const { db } = await getDb()

  if (classId) {
    return db.$queryRaw`
      SELECT s.*, u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.is_active,
             c.name AS class_name, e.status AS enrollment_status
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
      LEFT JOIN classes c ON c.id = e.class_id
      WHERE e.class_id = ${classId}
        AND (${search ?? ''} = '' OR u.first_name ILIKE ${'%' + (search ?? '') + '%'}
             OR u.last_name ILIKE ${'%' + (search ?? '') + '%'}
             OR s.student_id ILIKE ${'%' + (search ?? '') + '%'})
      ORDER BY u.last_name, u.first_name
    ` as Promise<any[]>
  }

  return db.$queryRaw`
    SELECT s.*, u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.is_active,
           c.name AS class_name, e.status AS enrollment_status
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
    LEFT JOIN classes c ON c.id = e.class_id
    WHERE (${search ?? ''} = '' OR u.first_name ILIKE ${'%' + (search ?? '') + '%'}
           OR u.last_name ILIKE ${'%' + (search ?? '') + '%'}
           OR s.student_id ILIKE ${'%' + (search ?? '') + '%'})
    ORDER BY u.last_name, u.first_name
  ` as Promise<any[]>
}

export async function getStudentById(id: string) {
  const { db } = await getDb()
  const rows: any[] = await db.$queryRaw`
    SELECT s.id, s.user_id, s.student_id AS student_number, s.date_of_birth, s.gender, s.address,
           u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.is_active, u.created_at,
           c.name AS class_name, l.name AS level_name, ay.name AS year_name
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN enrollments e  ON e.student_id = s.id AND e.status = 'ACTIVE'
    LEFT JOIN classes c      ON c.id = e.class_id
    LEFT JOIN levels l       ON l.id = c.level_id
    LEFT JOIN academic_years ay ON ay.is_current = TRUE
    WHERE s.id = ${id}
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function resetStudentPassword(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db } = await getDb()
  const userId = formData.get('userId') as string
  if (!userId) return { success: false, error: 'Utilisateur introuvable.' }
  try {
    const tempPassword = nanoid(12)
    const passwordHash = await hash(tempPassword, 12)
    await db.$executeRaw`UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${userId}`
    return { success: true, data: { tempPassword } }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

export async function getParentById(id: string) {
  const { db } = await getDb()
  const rows: any[] = await db.$queryRaw`
    SELECT p.id, p.user_id,
           u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.is_active, u.created_at,
           json_agg(DISTINCT jsonb_build_object(
             'id',         s.id,
             'first_name', su.first_name,
             'last_name',  su.last_name,
             'class_name', c.name,
             'relation',   ps.relation
           )) FILTER (WHERE ps.id IS NOT NULL) AS children
    FROM parents p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN parent_students ps ON ps.parent_id = p.id
    LEFT JOIN students s         ON s.id = ps.student_id
    LEFT JOIN users su           ON su.id = s.user_id
    LEFT JOIN enrollments e      ON e.student_id = s.id AND e.status = 'ACTIVE'
    LEFT JOIN classes c          ON c.id = e.class_id
    WHERE p.id = ${id}
    GROUP BY p.id, p.user_id, u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.is_active, u.created_at
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function resetParentPassword(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db } = await getDb()
  const userId = formData.get('userId') as string
  if (!userId) return { success: false, error: 'Utilisateur introuvable.' }
  try {
    const tempPassword = nanoid(12)
    const passwordHash = await hash(tempPassword, 12)
    await db.$executeRaw`UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${userId}`
    return { success: true, data: { tempPassword } }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

export async function createStudent(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    const firstName   = formData.get('firstName') as string
    const lastName    = formData.get('lastName') as string
    const email       = formData.get('email') as string
    const dateOfBirth = formData.get('dateOfBirth') as string || null
    const gender      = formData.get('gender') as string || null
    const address     = formData.get('address') as string || null
    const classId     = formData.get('classId') as string || null

    if (!firstName || !lastName || !email) {
      return { success: false, error: 'Prénom, nom et email requis.' }
    }

    const studentNumber = `EL-${Date.now().toString().slice(-6)}`
    const tempPassword  = nanoid(12)
    const passwordHash  = await hash(tempPassword, 12)

    await db.$executeRaw`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, 'STUDENT')
    `

    const user = await db.$queryRaw`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    ` as { id: string }[]

    if (!user[0]) return { success: false, error: 'Erreur lors de la création.' }

    await db.$executeRaw`
      INSERT INTO students (user_id, student_id, date_of_birth, gender, address)
      VALUES (${user[0].id}, ${studentNumber}, ${toDate(dateOfBirth)}, ${gender}, ${address})
    `

    if (classId) {
      const student = await db.$queryRaw`
        SELECT id FROM students WHERE user_id = ${user[0].id} LIMIT 1
      ` as { id: string }[]

      const year = await db.$queryRaw`
        SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1
      ` as { id: string }[]

      if (student[0] && year[0]) {
        await db.$executeRaw`
          INSERT INTO enrollments (student_id, class_id, academic_year_id)
          VALUES (${student[0].id}, ${classId}, ${year[0].id})
          ON CONFLICT (student_id, academic_year_id) DO NOTHING
        `
      }
    }

    revalidatePath('/admin/students')
    return { success: true, data: { studentId: studentNumber, tempPassword } }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

// ─── Parents ──────────────────────────────────────────────────────────────────

export async function getParents() {
  const { db } = await getDb()
  return db.$queryRaw`
    SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.is_active,
           COUNT(DISTINCT ps.student_id)::int AS children_count
    FROM parents p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN parent_students ps ON ps.parent_id = p.id
    GROUP BY p.id, u.first_name, u.last_name, u.email, u.phone, u.is_active
    ORDER BY u.last_name, u.first_name
  ` as Promise<any[]>
}

export async function createParent(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    const firstName = formData.get('firstName') as string
    const lastName  = formData.get('lastName') as string
    const email     = formData.get('email') as string
    const phone     = formData.get('phone') as string || null

    if (!firstName || !lastName || !email) {
      return { success: false, error: 'Prénom, nom et email requis.' }
    }

    const tempPassword = nanoid(12)
    const passwordHash = await hash(tempPassword, 12)

    await db.$executeRaw`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
      VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, ${phone}, 'PARENT')
    `

    const user = await db.$queryRaw`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    ` as { id: string }[]

    if (!user[0]) return { success: false, error: 'Erreur lors de la création.' }

    await db.$executeRaw`INSERT INTO parents (user_id) VALUES (${user[0].id})`

    revalidatePath('/admin/parents')
    return { success: true, data: { tempPassword } }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

// ─── Frais scolaires ──────────────────────────────────────────────────────────

export async function getFeeTypes() {
  const { db } = await getDb()
  return db.$queryRaw`
    SELECT ft.*, COUNT(p.id)::int AS payments_count,
           COALESCE(SUM(CASE WHEN p.status = 'SUCCESS' THEN p.amount ELSE 0 END), 0)::int AS total_collected
    FROM fee_types ft
    LEFT JOIN payments p ON p.fee_type_id = ft.id
    GROUP BY ft.id
    ORDER BY ft.name
  ` as Promise<any[]>
}

export async function createFeeType(formData: FormData): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    const name       = formData.get('name') as string
    const amount     = parseInt(formData.get('amount') as string)
    const isOptional = formData.get('isOptional') === 'on'

    if (!name || isNaN(amount)) return { success: false, error: 'Nom et montant requis.' }

    await db.$executeRaw`
      INSERT INTO fee_types (name, amount, is_optional)
      VALUES (${name}, ${amount}, ${isOptional})
    `
    revalidatePath('/admin/fees')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

// ─── Paramètres école ─────────────────────────────────────────────────────────

export async function getSchoolSettings() {
  const { db } = await getDb()
  const rows = await db.$queryRaw`
    SELECT * FROM school_settings LIMIT 1
  ` as any[]
  return rows[0] ?? {}
}

export async function saveSchoolSettings(formData: FormData): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    const schoolName   = formData.get('school_name') as string
    const address      = formData.get('school_address') as string || null
    const city         = formData.get('school_city') as string || null
    const phone        = formData.get('school_phone') as string || null
    const email        = formData.get('school_email') as string || null
    const directorName = formData.get('school_director') as string || null

    if (!schoolName) return { success: false, error: 'Le nom de l\'établissement est requis.' }

    const existing = await db.$queryRaw`SELECT id FROM school_settings LIMIT 1` as { id: string }[]

    if (existing[0]) {
      await db.$executeRaw`
        UPDATE school_settings
        SET school_name = ${schoolName}, address = ${address}, city = ${city},
            phone = ${phone}, email = ${email}, director_name = ${directorName},
            updated_at = NOW()
        WHERE id = ${existing[0].id}
      `
    } else {
      await db.$executeRaw`
        INSERT INTO school_settings (school_name, address, city, phone, email, director_name)
        VALUES (${schoolName}, ${address}, ${city}, ${phone}, ${email}, ${directorName})
      `
    }

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Erreur lors de la sauvegarde.' }
  }
}

// ─── Notes & Moyennes (admin) ──────────────────────────────────────────────────

export async function getTerms() {
  const { db } = await getDb()
  return db.$queryRaw`
    SELECT t.id, t.name, t.term_order, t.start_date, t.end_date
    FROM terms t
    JOIN academic_years ay ON ay.id = t.academic_year_id
    WHERE ay.is_current = TRUE
    ORDER BY t.term_order
  ` as Promise<any[]>
}

export async function getClassGradesOverview(classId: string, termId: string) {
  const { db } = await getDb()

  // Subjects for this class's level (with coefficients)
  const subjects: any[] = await db.$queryRaw`
    SELECT s.id, s.name, s.code, ls.coefficient
    FROM subjects s
    JOIN level_subjects ls ON ls.subject_id = s.id
    JOIN classes c ON c.level_id = ls.level_id
    WHERE c.id = ${classId}
    ORDER BY s.name
  `

  // All grades for this class + term
  const grades: any[] = await db.$queryRaw`
    SELECT g.student_id, g.subject_id,
           SUM(g.value * g.coefficient) AS weighted_sum,
           SUM(g.coefficient)           AS coeff_sum
    FROM grades g
    JOIN enrollments e ON e.student_id = g.student_id AND e.class_id = ${classId}
    WHERE g.term_id = ${termId}
    AND e.status = 'ACTIVE'
    GROUP BY g.student_id, g.subject_id
  `

  // Students in this class
  const students: any[] = await db.$queryRaw`
    SELECT s.id, s.student_id AS student_number,
           u.first_name, u.last_name
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN users u ON u.id = s.user_id
    WHERE e.class_id = ${classId}
    AND e.status = 'ACTIVE'
    ORDER BY u.last_name, u.first_name
  `

  // Compute averages in JS
  const gradeMap: Record<string, Record<string, { weightedSum: number; coeffSum: number }>> = {}
  for (const g of grades) {
    if (!gradeMap[g.student_id]) gradeMap[g.student_id] = {}
    gradeMap[g.student_id][g.subject_id] = {
      weightedSum: parseFloat(g.weighted_sum),
      coeffSum: parseFloat(g.coeff_sum),
    }
  }

  const rows = students.map(s => {
    const subjectAverages: Record<string, number | null> = {}
    let generalWeightedSum = 0
    let generalCoeffSum = 0

    for (const sub of subjects) {
      const entry = gradeMap[s.id]?.[sub.id]
      if (entry && entry.coeffSum > 0) {
        const avg = entry.weightedSum / entry.coeffSum
        subjectAverages[sub.id] = Math.round(avg * 100) / 100
        generalWeightedSum += avg * parseFloat(sub.coefficient)
        generalCoeffSum += parseFloat(sub.coefficient)
      } else {
        subjectAverages[sub.id] = null
      }
    }

    const generalAverage = generalCoeffSum > 0
      ? Math.round((generalWeightedSum / generalCoeffSum) * 100) / 100
      : null

    return { ...s, subjectAverages, generalAverage }
  })

  // Sort by general average desc
  rows.sort((a, b) => (b.generalAverage ?? -1) - (a.generalAverage ?? -1))

  return { subjects, rows }
}

// ─── Rapport des présences ────────────────────────────────────────────────────

export async function getAttendanceReport(classId: string, termId: string) {
  const { db } = await getDb()
  return db.$queryRaw`
    SELECT
      s.id, s.student_id AS student_number,
      u.first_name, u.last_name,
      COUNT(a.id)::int                                                    AS total_days,
      COUNT(CASE WHEN a.status = 'PRESENT'  THEN 1 END)::int             AS present_count,
      COUNT(CASE WHEN a.status = 'ABSENT'   THEN 1 END)::int             AS absent_count,
      COUNT(CASE WHEN a.status = 'LATE'     THEN 1 END)::int             AS late_count,
      COUNT(CASE WHEN a.status = 'EXCUSED'  THEN 1 END)::int             AS excused_count,
      COUNT(CASE WHEN a.status = 'ABSENT'
                  AND a.justified = FALSE   THEN 1 END)::int             AS unjustified_count
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN attendances a ON a.student_id = s.id AND a.term_id = ${termId}
    WHERE e.class_id = ${classId} AND e.status = 'ACTIVE'
    GROUP BY s.id, s.student_id, u.first_name, u.last_name
    ORDER BY u.last_name, u.first_name
  ` as Promise<any[]>
}

// ─── Paiements ────────────────────────────────────────────────────────────────

export async function getPayments(search = '', status = '') {
  const { db } = await getDb()
  if (search && status) {
    return db.$queryRaw`
      SELECT p.*, ft.name AS fee_name, ft.amount AS fee_amount,
             u.first_name, u.last_name, s.student_id AS student_number
      FROM payments p
      JOIN fee_types ft ON ft.id = p.fee_type_id
      JOIN students s ON s.id = p.student_id
      JOIN users u ON u.id = s.user_id
      WHERE p.status = ${status}
        AND (u.first_name ILIKE ${'%' + search + '%'}
          OR u.last_name  ILIKE ${'%' + search + '%'}
          OR s.student_id ILIKE ${'%' + search + '%'})
      ORDER BY p.created_at DESC
      LIMIT 100
    ` as Promise<any[]>
  }
  if (status) {
    return db.$queryRaw`
      SELECT p.*, ft.name AS fee_name, ft.amount AS fee_amount,
             u.first_name, u.last_name, s.student_id AS student_number
      FROM payments p
      JOIN fee_types ft ON ft.id = p.fee_type_id
      JOIN students s ON s.id = p.student_id
      JOIN users u ON u.id = s.user_id
      WHERE p.status = ${status}
      ORDER BY p.created_at DESC LIMIT 100
    ` as Promise<any[]>
  }
  if (search) {
    return db.$queryRaw`
      SELECT p.*, ft.name AS fee_name, ft.amount AS fee_amount,
             u.first_name, u.last_name, s.student_id AS student_number
      FROM payments p
      JOIN fee_types ft ON ft.id = p.fee_type_id
      JOIN students s ON s.id = p.student_id
      JOIN users u ON u.id = s.user_id
      WHERE u.first_name ILIKE ${'%' + search + '%'}
         OR u.last_name  ILIKE ${'%' + search + '%'}
         OR s.student_id ILIKE ${'%' + search + '%'}
      ORDER BY p.created_at DESC LIMIT 100
    ` as Promise<any[]>
  }
  return db.$queryRaw`
    SELECT p.*, ft.name AS fee_name, ft.amount AS fee_amount,
           u.first_name, u.last_name, s.student_id AS student_number
    FROM payments p
    JOIN fee_types ft ON ft.id = p.fee_type_id
    JOIN students s ON s.id = p.student_id
    JOIN users u ON u.id = s.user_id
    ORDER BY p.created_at DESC LIMIT 100
  ` as Promise<any[]>
}

export async function createPayment(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db } = await getDb()

  const studentId = formData.get('student_id') as string
  const feeTypeId = formData.get('fee_type_id') as string
  const amount    = parseInt(formData.get('amount') as string)
  const dueDate   = (formData.get('due_date') as string) || null

  if (!studentId || !feeTypeId || isNaN(amount)) {
    return { success: false, error: 'Élève, type de frais et montant requis.' }
  }

  try {
    await db.$executeRaw`
      INSERT INTO payments (student_id, fee_type_id, amount, status, due_date)
      VALUES (${studentId}, ${feeTypeId}, ${amount}, 'PENDING', ${toDate(dueDate)})
    `
    revalidatePath('/admin/payments')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

export async function markPaymentPaid(paymentId: string): Promise<void> {
  const { db } = await getDb()
  await db.$executeRaw`
    UPDATE payments
    SET status = 'SUCCESS', paid_at = NOW()
    WHERE id = ${paymentId}
  `
  revalidatePath('/admin/payments')
}

export async function getPaymentStats() {
  const { db } = await getDb()
  const rows: any[] = await db.$queryRaw`
    SELECT
      COUNT(*)::int                                                     AS total_count,
      COALESCE(SUM(amount), 0)::int                                     AS total_amount,
      COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount END), 0)::int AS paid_amount,
      COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount END), 0)::int AS pending_amount,
      COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END)::int               AS paid_count,
      COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int               AS pending_count
    FROM payments
  `
  return rows[0] ?? { total_count: 0, total_amount: 0, paid_amount: 0, pending_amount: 0, paid_count: 0, pending_count: 0 }
}

export async function getStudentsForPayment() {
  const { db } = await getDb()
  return db.$queryRaw`
    SELECT s.id, s.student_id AS student_number, u.first_name, u.last_name,
           c.name AS class_name
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
    LEFT JOIN classes c ON c.id = e.class_id
    ORDER BY u.last_name, u.first_name
  ` as Promise<any[]>
}
