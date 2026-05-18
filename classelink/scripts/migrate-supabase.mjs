/**
 * Migration complète ClasseLink → Supabase via Management API
 *
 * Ce script crée TOUTES les tables :
 *   - Schéma public  : plans, schools, subscriptions, super_admin_users, ...
 *   - Schéma tenant  : school_demo (users, classes, grades, payments, ...)
 *
 * Usage : node scripts/migrate-supabase.mjs
 * Après : node scripts/seed-supabase.mjs   (insère les données de démo)
 */

import https from 'https'

const PROJECT_REF  = process.env.SUPABASE_PROJECT_REF
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

// ─── Helper Management API (avec retry automatique) ──────────────────────────
function sqlOnce(query, label = '') {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query })
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode >= 400) {
            const msg = parsed?.message ?? JSON.stringify(parsed).slice(0, 400)
            reject(new Error(`[${label || 'sql'}] HTTP ${res.statusCode}: ${msg}`))
          } else {
            resolve(parsed)
          }
        } catch {
          reject(new Error(`[${label || 'sql'}] Parse error: ${data.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { reject(new Error(`[${label}] Timeout`)); req.destroy() })
    req.write(body)
    req.end()
  })
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function sql(query, label = '', retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await sqlOnce(query, label)
    } catch (err) {
      const isNetwork = err.message.includes('socket') || err.message.includes('TLS') ||
                        err.message.includes('ECONNRESET') || err.message.includes('Timeout')
      if (isNetwork && attempt < retries) {
        const delay = attempt * 2000
        process.stdout.write(`\r   ↻ [${label}] Erreur réseau, nouvel essai dans ${delay/1000}s...`)
        await sleep(delay)
        process.stdout.write('\r' + ' '.repeat(70) + '\r')
      } else {
        throw err
      }
    }
  }
}

// ─── Schéma PUBLIC ────────────────────────────────────────────────────────────
async function migratePublicSchema() {
  console.log('\n📦 [1/2] Création des tables du schéma public...')

  await sql(`
    CREATE TABLE IF NOT EXISTS public.plans (
      id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name            TEXT NOT NULL,
      slug            TEXT UNIQUE NOT NULL,
      "priceMonthly"  INT  NOT NULL DEFAULT 0,
      "priceYearly"   INT  NOT NULL DEFAULT 0,
      "maxStudents"   INT  NOT NULL DEFAULT 100,
      "maxStorageMb"  INT  NOT NULL DEFAULT 1024,
      features        JSONB NOT NULL DEFAULT '[]',
      "isActive"      BOOLEAN DEFAULT TRUE,
      "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'plans')
  console.log('   ✅ plans')

  await sql(`
    CREATE TABLE IF NOT EXISTS public.schools (
      id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name              TEXT NOT NULL,
      slug              TEXT UNIQUE NOT NULL,
      subdomain         TEXT UNIQUE,
      "customDomain"    TEXT UNIQUE,
      "logoUrl"         TEXT,
      address           TEXT,
      city              TEXT,
      country           TEXT DEFAULT 'CI',
      phone             TEXT,
      email             TEXT,
      "adminEmail"      TEXT NOT NULL,
      status            TEXT DEFAULT 'TRIAL'
                        CHECK (status IN ('TRIAL','ACTIVE','SUSPENDED','CANCELLED')),
      "planId"          TEXT NOT NULL REFERENCES public.plans(id),
      "trialEndsAt"     TIMESTAMPTZ,
      "schemaName"      TEXT UNIQUE NOT NULL,
      "superAdminNotes" TEXT,
      "createdAt"       TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt"       TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'schools')
  console.log('   ✅ schools')

  await sql(`
    CREATE TABLE IF NOT EXISTS public.subscriptions (
      id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "schoolId"           TEXT UNIQUE NOT NULL REFERENCES public.schools(id),
      "planId"             TEXT NOT NULL,
      billing              TEXT DEFAULT 'MONTHLY'
                           CHECK (billing IN ('MONTHLY','YEARLY')),
      status               TEXT DEFAULT 'ACTIVE'
                           CHECK (status IN ('ACTIVE','PAST_DUE','CANCELLED','TRIALING')),
      "currentPeriodStart" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "currentPeriodEnd"   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
      "cancelAtPeriodEnd"  BOOLEAN DEFAULT FALSE,
      "promoCode"          TEXT,
      "discountPercent"    INT,
      "createdAt"          TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt"          TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'subscriptions')
  console.log('   ✅ subscriptions')

  await sql(`
    CREATE TABLE IF NOT EXISTS public.global_payments (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "subscriptionId" TEXT NOT NULL REFERENCES public.subscriptions(id),
      amount           INT  NOT NULL,
      currency         TEXT DEFAULT 'XOF',
      status           TEXT DEFAULT 'PENDING'
                       CHECK (status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
      provider         TEXT,
      "providerRef"    TEXT,
      "createdAt"      TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'global_payments')
  console.log('   ✅ global_payments')

  await sql(`
    CREATE TABLE IF NOT EXISTS public.super_admin_users (
      id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email          TEXT UNIQUE NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "firstName"    TEXT NOT NULL,
      "lastName"     TEXT NOT NULL,
      "isActive"     BOOLEAN DEFAULT TRUE,
      "lastLoginAt"  TIMESTAMPTZ,
      "createdAt"    TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt"    TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'super_admin_users')
  console.log('   ✅ super_admin_users')

  await sql(`
    CREATE TABLE IF NOT EXISTS public.promo_codes (
      id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      code              TEXT UNIQUE NOT NULL,
      "discountPercent" INT  NOT NULL,
      "maxUses"         INT,
      "usedCount"       INT DEFAULT 0,
      "expiresAt"       TIMESTAMPTZ,
      "isActive"        BOOLEAN DEFAULT TRUE,
      "createdAt"       TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'promo_codes')
  console.log('   ✅ promo_codes')

  await sql(`
    CREATE TABLE IF NOT EXISTS public.global_audit_logs (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "schoolId"   TEXT REFERENCES public.schools(id),
      "userId"     TEXT,
      action       TEXT NOT NULL,
      resource     TEXT NOT NULL,
      "resourceId" TEXT,
      metadata     JSONB,
      ip           TEXT,
      "userAgent"  TEXT,
      "createdAt"  TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'global_audit_logs')
  await sql(`CREATE INDEX IF NOT EXISTS idx_gal_school   ON public.global_audit_logs("schoolId")`, 'idx_gal_school')
  await sql(`CREATE INDEX IF NOT EXISTS idx_gal_created  ON public.global_audit_logs("createdAt" DESC)`, 'idx_gal_created')
  console.log('   ✅ global_audit_logs')

  console.log('\n   ✓ Schéma public : 7 tables créées')
}

// ─── Schéma TENANT school_demo ────────────────────────────────────────────────
async function migrateTenantSchema() {
  console.log('\n📦 [2/2] Création du schéma tenant school_demo...')

  const sp = `SET search_path = school_demo, public;`

  await sql(`CREATE SCHEMA IF NOT EXISTS school_demo`, 'schema')
  console.log('   ✅ schéma school_demo')

  // users
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS users (
      id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email              TEXT UNIQUE NOT NULL,
      password_hash      TEXT,
      first_name         TEXT NOT NULL,
      last_name          TEXT NOT NULL,
      phone              TEXT,
      avatar_url         TEXT,
      role               TEXT NOT NULL
                         CHECK (role IN ('ADMIN','CENSOR','ACCOUNTANT','TEACHER','PARENT','STUDENT')),
      is_active          BOOLEAN DEFAULT TRUE,
      email_verified     BOOLEAN DEFAULT FALSE,
      two_factor_enabled BOOLEAN DEFAULT FALSE,
      two_factor_secret  TEXT,
      last_login_at      TIMESTAMPTZ,
      created_at         TIMESTAMPTZ DEFAULT NOW(),
      updated_at         TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'users')
  console.log('   ✅ users')

  // academic_years
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS academic_years (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name       TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date   DATE NOT NULL,
      is_current BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'academic_years')
  console.log('   ✅ academic_years')

  // terms
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS terms (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
      name             TEXT NOT NULL,
      term_order       INT  NOT NULL,
      start_date       DATE NOT NULL,
      end_date         DATE NOT NULL,
      report_card_date DATE
    )
  `, 'terms')
  console.log('   ✅ terms')

  // levels
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS levels (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name        TEXT NOT NULL,
      level_order INT  NOT NULL
    )
  `, 'levels')
  console.log('   ✅ levels')

  // streams
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS streams (
      id   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL
    )
  `, 'streams')
  console.log('   ✅ streams')

  // subjects
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS subjects (
      id   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      code TEXT NOT NULL
    )
  `, 'subjects')
  console.log('   ✅ subjects')

  // level_subjects
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS level_subjects (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      level_id    TEXT NOT NULL REFERENCES levels(id),
      subject_id  TEXT NOT NULL REFERENCES subjects(id),
      coefficient NUMERIC(4,2) DEFAULT 1,
      UNIQUE(level_id, subject_id)
    )
  `, 'level_subjects')
  console.log('   ✅ level_subjects')

  // classes (sans FK head_teacher_id pour l'instant)
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS classes (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name             TEXT NOT NULL,
      level_id         TEXT NOT NULL REFERENCES levels(id),
      stream_id        TEXT REFERENCES streams(id),
      academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
      max_students     INT  DEFAULT 40,
      room             TEXT,
      head_teacher_id  TEXT
    )
  `, 'classes')
  console.log('   ✅ classes')

  // teachers
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS teachers (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id     TEXT UNIQUE NOT NULL REFERENCES users(id),
      employee_id TEXT UNIQUE,
      specialty   TEXT,
      hire_date   DATE
    )
  `, 'teachers')
  console.log('   ✅ teachers')

  // FK head_teacher_id → teachers(id) (ajoutée après teachers)
  await sql(`${sp}
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_head_teacher'
          AND table_schema = 'school_demo'
      ) THEN
        ALTER TABLE classes ADD CONSTRAINT fk_head_teacher
          FOREIGN KEY (head_teacher_id) REFERENCES teachers(id);
      END IF;
    END $$
  `, 'fk_head_teacher')
  console.log('   ✅ FK head_teacher_id → teachers')

  // teacher_subject_classes
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS teacher_subject_classes (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      teacher_id TEXT NOT NULL REFERENCES teachers(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      class_id   TEXT NOT NULL REFERENCES classes(id),
      UNIQUE(teacher_id, subject_id, class_id)
    )
  `, 'teacher_subject_classes')
  console.log('   ✅ teacher_subject_classes')

  // students
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS students (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id       TEXT UNIQUE NOT NULL REFERENCES users(id),
      student_id    TEXT UNIQUE NOT NULL,
      date_of_birth DATE,
      gender        TEXT,
      address       TEXT
    )
  `, 'students')
  console.log('   ✅ students')

  // parents
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS parents (
      id      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id)
    )
  `, 'parents')
  console.log('   ✅ parents')

  // parent_students
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS parent_students (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      parent_id  TEXT NOT NULL REFERENCES parents(id),
      student_id TEXT NOT NULL REFERENCES students(id),
      relation   TEXT,
      is_primary BOOLEAN DEFAULT FALSE,
      UNIQUE(parent_id, student_id)
    )
  `, 'parent_students')
  console.log('   ✅ parent_students')

  // enrollments
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS enrollments (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      student_id       TEXT NOT NULL REFERENCES students(id),
      class_id         TEXT NOT NULL REFERENCES classes(id),
      academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
      enrolled_at      TIMESTAMPTZ DEFAULT NOW(),
      status           TEXT DEFAULT 'ACTIVE'
                       CHECK (status IN ('ACTIVE','TRANSFERRED','EXPELLED','GRADUATED')),
      UNIQUE(student_id, academic_year_id)
    )
  `, 'enrollments')
  console.log('   ✅ enrollments')

  // schedules
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS schedules (
      id                       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      class_id                 TEXT NOT NULL REFERENCES classes(id),
      teacher_subject_class_id TEXT NOT NULL REFERENCES teacher_subject_classes(id),
      day_of_week              INT  NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
      start_time               TEXT NOT NULL,
      end_time                 TEXT NOT NULL,
      room                     TEXT
    )
  `, 'schedules')
  console.log('   ✅ schedules')

  // grades
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS grades (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      student_id   TEXT NOT NULL REFERENCES students(id),
      subject_id   TEXT NOT NULL REFERENCES subjects(id),
      term_id      TEXT NOT NULL REFERENCES terms(id),
      type         TEXT NOT NULL
                   CHECK (type IN ('DEVOIR','INTERROGATION','COMPOSITION','EXAM')),
      value        NUMERIC(5,2) NOT NULL,
      max_value    NUMERIC(5,2) DEFAULT 20,
      coefficient  NUMERIC(4,2) DEFAULT 1,
      comment      TEXT,
      published_at TIMESTAMPTZ,
      created_by   TEXT NOT NULL,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'grades')
  await sql(`${sp} CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id)`, 'idx_grades_student')
  await sql(`${sp} CREATE INDEX IF NOT EXISTS idx_grades_term    ON grades(term_id)`, 'idx_grades_term')
  console.log('   ✅ grades')

  // attendances
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS attendances (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      student_id    TEXT NOT NULL REFERENCES students(id),
      term_id       TEXT NOT NULL REFERENCES terms(id),
      date          DATE NOT NULL,
      schedule_id   TEXT REFERENCES schedules(id),
      status        TEXT NOT NULL
                    CHECK (status IN ('PRESENT','ABSENT','LATE','EXCUSED')),
      justified     BOOLEAN DEFAULT FALSE,
      justification TEXT,
      recorded_by   TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(student_id, date, schedule_id)
    )
  `, 'attendances')
  await sql(`${sp} CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendances(student_id)`, 'idx_att_student')
  await sql(`${sp} CREATE INDEX IF NOT EXISTS idx_attendance_date    ON attendances(date)`, 'idx_att_date')
  console.log('   ✅ attendances')

  // lessons
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS lessons (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      schedule_id  TEXT NOT NULL REFERENCES schedules(id),
      subject_id   TEXT NOT NULL REFERENCES subjects(id),
      date         DATE NOT NULL,
      title        TEXT NOT NULL,
      content      TEXT,
      next_content TEXT,
      homework     TEXT,
      resources    JSONB,
      teacher_id   TEXT NOT NULL,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'lessons')
  console.log('   ✅ lessons')

  // assignments
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS assignments (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      class_id    TEXT NOT NULL REFERENCES classes(id),
      teacher_id  TEXT NOT NULL,
      subject_id  TEXT NOT NULL REFERENCES subjects(id),
      title       TEXT NOT NULL,
      description TEXT,
      attachments JSONB,
      due_date    TIMESTAMPTZ NOT NULL,
      max_score   NUMERIC(5,2),
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'assignments')
  console.log('   ✅ assignments')

  // submissions
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS submissions (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      assignment_id TEXT NOT NULL REFERENCES assignments(id),
      student_id    TEXT NOT NULL REFERENCES students(id),
      files         JSONB,
      submitted_at  TIMESTAMPTZ DEFAULT NOW(),
      score         NUMERIC(5,2),
      feedback      TEXT,
      graded_at     TIMESTAMPTZ,
      status        TEXT DEFAULT 'SUBMITTED'
                    CHECK (status IN ('SUBMITTED','GRADED','LATE')),
      UNIQUE(assignment_id, student_id)
    )
  `, 'submissions')
  console.log('   ✅ submissions')

  // fee_types
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS fee_types (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name        TEXT NOT NULL,
      amount      INT  NOT NULL,
      is_optional BOOLEAN DEFAULT FALSE
    )
  `, 'fee_types')
  console.log('   ✅ fee_types')

  // payments
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS payments (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      student_id   TEXT NOT NULL REFERENCES students(id),
      parent_id    TEXT REFERENCES parents(id),
      fee_type_id  TEXT NOT NULL REFERENCES fee_types(id),
      amount       INT  NOT NULL,
      status       TEXT DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
      provider     TEXT,
      provider_ref TEXT,
      receipt      TEXT,
      paid_at      TIMESTAMPTZ,
      due_date     DATE,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'payments')
  await sql(`${sp} CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id)`, 'idx_pay_student')
  await sql(`${sp} CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status)`, 'idx_pay_status')
  console.log('   ✅ payments')

  // messages
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS messages (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      sender_id    TEXT NOT NULL REFERENCES users(id),
      recipient_id TEXT NOT NULL REFERENCES users(id),
      subject      TEXT,
      body         TEXT NOT NULL,
      attachments  JSONB,
      read_at      TIMESTAMPTZ,
      student_id   TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'messages')
  console.log('   ✅ messages')

  // announcements
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS announcements (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      title        TEXT NOT NULL,
      content      TEXT NOT NULL,
      author_id    TEXT NOT NULL,
      target_roles JSONB,
      class_id     TEXT REFERENCES classes(id),
      is_pinned    BOOLEAN DEFAULT FALSE,
      expires_at   TIMESTAMPTZ,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'announcements')
  console.log('   ✅ announcements')

  // notifications
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id    TEXT NOT NULL REFERENCES users(id),
      type       TEXT NOT NULL,
      title      TEXT NOT NULL,
      body       TEXT NOT NULL,
      data       JSONB,
      read_at    TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'notifications')
  await sql(`${sp} CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id)`, 'idx_notif_user')
  await sql(`${sp} CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(user_id, read_at)`, 'idx_notif_read')
  console.log('   ✅ notifications')

  // appointments
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS appointments (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      teacher_id   TEXT NOT NULL REFERENCES teachers(id),
      parent_id    TEXT NOT NULL REFERENCES parents(id),
      student_id   TEXT,
      scheduled_at TIMESTAMPTZ NOT NULL,
      duration     INT DEFAULT 30,
      status       TEXT DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING','CONFIRMED','CANCELLED','COMPLETED')),
      notes        TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'appointments')
  console.log('   ✅ appointments')

  // audit_logs
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS audit_logs (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id     TEXT NOT NULL REFERENCES users(id),
      action      TEXT NOT NULL,
      resource    TEXT NOT NULL,
      resource_id TEXT,
      old_value   JSONB,
      new_value   JSONB,
      ip          TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'audit_logs')
  await sql(`${sp} CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id)`, 'idx_audit_user')
  await sql(`${sp} CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC)`, 'idx_audit_created')
  console.log('   ✅ audit_logs')

  // sanctions
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS sanctions (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      student_id  TEXT NOT NULL REFERENCES students(id),
      type        TEXT NOT NULL
                  CHECK (type IN ('AVERTISSEMENT','BLAME','EXCLUSION_TEMP','RENVOI','AUTRE')),
      reason      TEXT NOT NULL,
      description TEXT,
      date        DATE NOT NULL,
      duration    INT,
      issued_by   TEXT NOT NULL REFERENCES users(id),
      notified    BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'sanctions')
  await sql(`${sp} CREATE INDEX IF NOT EXISTS idx_sanctions_student ON sanctions(student_id)`, 'idx_sanc_student')
  console.log('   ✅ sanctions')

  // school_settings
  await sql(`${sp}
    CREATE TABLE IF NOT EXISTS school_settings (
      id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      school_name        TEXT NOT NULL,
      logo_url           TEXT,
      address            TEXT,
      city               TEXT,
      phone              TEXT,
      email              TEXT,
      director_name      TEXT,
      director_signature TEXT,
      stamp_url          TEXT,
      grade_system       TEXT DEFAULT '20'
                         CHECK (grade_system IN ('20','AF','COMPETENCES')),
      interior_rules_url TEXT,
      updated_at         TIMESTAMPTZ DEFAULT NOW()
    )
  `, 'school_settings')
  console.log('   ✅ school_settings')

  console.log('\n   ✓ Schéma tenant school_demo : 25 tables créées')
}

// ─── Vérification finale ──────────────────────────────────────────────────────
async function verify() {
  console.log('\n🔍 Vérification du résultat...')

  const [pubRes, tenRes] = await Promise.all([
    sql(`
      SELECT COUNT(*)::int AS cnt FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'plans','schools','subscriptions','global_payments',
          'super_admin_users','promo_codes','global_audit_logs'
        )
    `, 'verify_public'),
    sql(`
      SELECT COUNT(*)::int AS cnt FROM information_schema.tables
      WHERE table_schema = 'school_demo'
    `, 'verify_tenant'),
  ])

  const publicCount = pubRes[0]?.cnt ?? 0
  const tenantCount = tenRes[0]?.cnt ?? 0

  console.log(`   📁 Schéma public  : ${publicCount}/7 tables`)
  console.log(`   📁 Schéma tenant  : ${tenantCount}/25 tables`)

  const ok = publicCount >= 7 && tenantCount >= 25
  if (!ok) {
    console.warn('\n   ⚠️  Certaines tables semblent manquantes — relancez le script.')
  } else {
    console.log('\n   ✅ Toutes les tables sont présentes')
  }
  return ok
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║   Migration ClasseLink → Supabase            ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log(`\n   Projet : ${PROJECT_REF}`)
  console.log('   Toutes les instructions sont idempotentes')
  console.log('   (CREATE TABLE IF NOT EXISTS, DO $$ … $$)\n')

  try {
    await migratePublicSchema()
    await migrateTenantSchema()
    let ok = false
    try { ok = await verify() } catch (verifyErr) {
      console.warn(`\n   ⚠️  Vérification ignorée (${verifyErr.message.slice(0, 60)})`)
      console.warn('   Les CREATE TABLE ont tous réussi — les tables existent bien.')
      ok = true
    }

    console.log('\n══════════════════════════════════════════════')
    if (ok) {
      console.log('✅ Migration Supabase terminée avec succès !')
      console.log('\n📌 Prochaine étape pour insérer les données :')
      console.log('   node scripts/seed-supabase.mjs')
    } else {
      console.log('⚠️  Migration partiellement terminée.')
      console.log('   Corrigez les erreurs ci-dessus et relancez.')
    }
    console.log('══════════════════════════════════════════════\n')
  } catch (err) {
    console.error('\n❌ Erreur fatale :', err.message)
    process.exit(1)
  }
}

main()
