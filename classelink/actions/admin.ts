'use server'

import { requireRole } from '@/lib/auth/rbac'
import { getTenantPrisma } from '@/lib/db/tenant'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import type { ActionResult } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
      VALUES (${name}, ${startDate}::date, ${endDate}::date, ${isCurrent})
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
          VALUES (${yid}, ${t.name}, ${t.order}, ${startDate}::date, ${endDate}::date)
        `
      }
    }

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Erreur lors de la création.' }
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
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Erreur lors de la création.' }
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
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Erreur lors de la création.' }
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
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Erreur lors de la création.' }
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

    return { success: true, data: { tempPassword } }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Erreur lors de la création.' }
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

export async function createStudent(formData: FormData): Promise<ActionResult> {
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
      VALUES (${user[0].id}, ${studentNumber}, ${dateOfBirth ? dateOfBirth + '::date' : null}, ${gender}, ${address})
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

    return { success: true, data: { studentId: studentNumber, tempPassword } }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Erreur lors de la création.' }
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

export async function createParent(formData: FormData): Promise<ActionResult> {
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

    return { success: true, data: { tempPassword } }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Erreur lors de la création.' }
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
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Erreur lors de la création.' }
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
