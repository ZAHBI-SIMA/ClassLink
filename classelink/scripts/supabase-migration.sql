-- =============================================================================
-- ClasseLink — Migration complète Supabase
-- Coller ce fichier dans : Supabase Dashboard → SQL Editor → Run
-- =============================================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- PARTIE 1 : SCHÉMA PUBLIC (tables SaaS partagées)
-- =============================================================================

-- ─── Plans tarifaires ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  "priceMonthly"  INT NOT NULL DEFAULT 0,
  "priceYearly"   INT NOT NULL DEFAULT 0,
  "maxStudents"   INT NOT NULL DEFAULT 100,
  "maxStorageMb"  INT NOT NULL DEFAULT 1024,
  features        JSONB NOT NULL DEFAULT '[]',
  "isActive"      BOOLEAN DEFAULT TRUE,
  "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Écoles (Tenants) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schools (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name               TEXT NOT NULL,
  slug               TEXT UNIQUE NOT NULL,
  subdomain          TEXT UNIQUE,
  "customDomain"     TEXT UNIQUE,
  "logoUrl"          TEXT,
  address            TEXT,
  city               TEXT,
  country            TEXT DEFAULT 'CI',
  phone              TEXT,
  email              TEXT,
  "adminEmail"       TEXT NOT NULL,
  status             TEXT DEFAULT 'TRIAL' CHECK (status IN ('TRIAL','ACTIVE','SUSPENDED','CANCELLED')),
  "planId"           TEXT NOT NULL REFERENCES plans(id),
  "trialEndsAt"      TIMESTAMPTZ,
  "schemaName"       TEXT UNIQUE NOT NULL,
  "superAdminNotes"  TEXT,
  "createdAt"        TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schools_slug   ON schools(slug);
CREATE INDEX IF NOT EXISTS idx_schools_schema ON schools("schemaName");

-- ─── Abonnements ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId"           TEXT UNIQUE NOT NULL REFERENCES schools(id),
  "planId"             TEXT NOT NULL,
  billing              TEXT DEFAULT 'MONTHLY' CHECK (billing IN ('MONTHLY','YEARLY')),
  status               TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAST_DUE','CANCELLED','TRIALING')),
  "currentPeriodStart" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "currentPeriodEnd"   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  "cancelAtPeriodEnd"  BOOLEAN DEFAULT FALSE,
  "promoCode"          TEXT,
  "discountPercent"    INT,
  "createdAt"          TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Paiements SaaS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS global_payments (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "subscriptionId" TEXT NOT NULL REFERENCES subscriptions(id),
  amount           INT NOT NULL,
  currency         TEXT DEFAULT 'XOF',
  status           TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
  provider         TEXT,
  "providerRef"    TEXT,
  "createdAt"      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Super Admins ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS super_admin_users (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email           TEXT UNIQUE NOT NULL,
  "passwordHash"  TEXT NOT NULL,
  "firstName"     TEXT NOT NULL,
  "lastName"      TEXT NOT NULL,
  "isActive"      BOOLEAN DEFAULT TRUE,
  "lastLoginAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Codes promo ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code              TEXT UNIQUE NOT NULL,
  "discountPercent" INT NOT NULL,
  "maxUses"         INT,
  "usedCount"       INT DEFAULT 0,
  "expiresAt"       TIMESTAMPTZ,
  "isActive"        BOOLEAN DEFAULT TRUE,
  "createdAt"       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit log global ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS global_audit_logs (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId"   TEXT REFERENCES schools(id),
  "userId"     TEXT,
  action       TEXT NOT NULL,
  resource     TEXT NOT NULL,
  "resourceId" TEXT,
  metadata     JSONB,
  ip           TEXT,
  "userAgent"  TEXT,
  "createdAt"  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_audit_school   ON global_audit_logs("schoolId");
CREATE INDEX IF NOT EXISTS idx_global_audit_created  ON global_audit_logs("createdAt" DESC);


-- =============================================================================
-- PARTIE 2 : SCHÉMA TENANT school_demo
-- (Répéter ce bloc pour chaque école avec un nom de schéma différent)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS "school_demo";
SET search_path = "school_demo", public;

-- ─── Utilisateurs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  phone            TEXT,
  avatar_url       TEXT,
  role             TEXT NOT NULL CHECK (role IN ('ADMIN','CENSOR','ACCOUNTANT','TEACHER','PARENT','STUDENT')),
  is_active        BOOLEAN DEFAULT TRUE,
  email_verified   BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret  TEXT,
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Années scolaires ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_years (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_current  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Trimestres ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS terms (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
  name             TEXT NOT NULL,
  term_order       INT NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  report_card_date DATE
);

-- ─── Niveaux ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS levels (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         TEXT NOT NULL,
  level_order  INT NOT NULL
);

-- ─── Filières ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS streams (
  id   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL
);

-- ─── Matières ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  code TEXT NOT NULL
);

-- ─── Coefficients matière par niveau ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS level_subjects (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  level_id    TEXT NOT NULL REFERENCES levels(id),
  subject_id  TEXT NOT NULL REFERENCES subjects(id),
  coefficient NUMERIC(4,2) DEFAULT 1,
  UNIQUE(level_id, subject_id)
);

-- ─── Classes ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name             TEXT NOT NULL,
  level_id         TEXT NOT NULL REFERENCES levels(id),
  stream_id        TEXT REFERENCES streams(id),
  academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
  max_students     INT DEFAULT 40,
  room             TEXT,
  head_teacher_id  TEXT
);

-- ─── Enseignants ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT UNIQUE NOT NULL REFERENCES users(id),
  employee_id TEXT UNIQUE,
  specialty   TEXT,
  hire_date   DATE
);

ALTER TABLE classes DROP CONSTRAINT IF EXISTS fk_head_teacher;
ALTER TABLE classes ADD CONSTRAINT fk_head_teacher
  FOREIGN KEY (head_teacher_id) REFERENCES teachers(id);

-- ─── Attribution enseignant-matière-classe ───────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_subject_classes (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  teacher_id  TEXT NOT NULL REFERENCES teachers(id),
  subject_id  TEXT NOT NULL REFERENCES subjects(id),
  class_id    TEXT NOT NULL REFERENCES classes(id),
  UNIQUE(teacher_id, subject_id, class_id)
);

-- ─── Élèves ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id       TEXT UNIQUE NOT NULL REFERENCES users(id),
  student_id    TEXT UNIQUE NOT NULL,
  date_of_birth DATE,
  gender        TEXT,
  address       TEXT
);

-- ─── Parents ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parents (
  id      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id)
);

-- ─── Liaison parent-élève ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parent_students (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  parent_id  TEXT NOT NULL REFERENCES parents(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  relation   TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  UNIQUE(parent_id, student_id)
);

-- ─── Inscriptions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id       TEXT NOT NULL REFERENCES students(id),
  class_id         TEXT NOT NULL REFERENCES classes(id),
  academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
  enrolled_at      TIMESTAMPTZ DEFAULT NOW(),
  status           TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','TRANSFERRED','EXPELLED','GRADUATED')),
  UNIQUE(student_id, academic_year_id)
);

-- ─── Emploi du temps ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedules (
  id                        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  class_id                  TEXT NOT NULL REFERENCES classes(id),
  teacher_subject_class_id  TEXT NOT NULL REFERENCES teacher_subject_classes(id),
  day_of_week               INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
  start_time                TEXT NOT NULL,
  end_time                  TEXT NOT NULL,
  room                      TEXT
);

-- ─── Notes ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grades (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id   TEXT NOT NULL REFERENCES students(id),
  subject_id   TEXT NOT NULL REFERENCES subjects(id),
  term_id      TEXT NOT NULL REFERENCES terms(id),
  type         TEXT NOT NULL CHECK (type IN ('DEVOIR','INTERROGATION','COMPOSITION','EXAM')),
  value        NUMERIC(5,2) NOT NULL,
  max_value    NUMERIC(5,2) DEFAULT 20,
  coefficient  NUMERIC(4,2) DEFAULT 1,
  comment      TEXT,
  published_at TIMESTAMPTZ,
  created_by   TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_term    ON grades(term_id);

-- ─── Présences ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendances (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id    TEXT NOT NULL REFERENCES students(id),
  term_id       TEXT NOT NULL REFERENCES terms(id),
  date          DATE NOT NULL,
  schedule_id   TEXT REFERENCES schedules(id),
  status        TEXT NOT NULL CHECK (status IN ('PRESENT','ABSENT','LATE','EXCUSED')),
  justified     BOOLEAN DEFAULT FALSE,
  justification TEXT,
  recorded_by   TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date, schedule_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date    ON attendances(date);

-- ─── Cahier de texte ─────────────────────────────────────────────────────────
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
);

-- ─── Devoirs ─────────────────────────────────────────────────────────────────
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
);

-- ─── Rendus de devoirs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  assignment_id TEXT NOT NULL REFERENCES assignments(id),
  student_id    TEXT NOT NULL REFERENCES students(id),
  files         JSONB,
  submitted_at  TIMESTAMPTZ DEFAULT NOW(),
  score         NUMERIC(5,2),
  feedback      TEXT,
  graded_at     TIMESTAMPTZ,
  status        TEXT DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','GRADED','LATE')),
  UNIQUE(assignment_id, student_id)
);

-- ─── Types de frais ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_types (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  amount      INT NOT NULL,
  is_optional BOOLEAN DEFAULT FALSE
);

-- ─── Paiements ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id   TEXT NOT NULL REFERENCES students(id),
  parent_id    TEXT REFERENCES parents(id),
  fee_type_id  TEXT NOT NULL REFERENCES fee_types(id),
  amount       INT NOT NULL,
  status       TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
  provider     TEXT,
  provider_ref TEXT,
  receipt      TEXT,
  paid_at      TIMESTAMPTZ,
  due_date     DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status);

-- ─── Messagerie ──────────────────────────────────────────────────────────────
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
);

-- ─── Annonces ────────────────────────────────────────────────────────────────
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
);

-- ─── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id),
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read_at);

-- ─── Rendez-vous ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  teacher_id   TEXT NOT NULL REFERENCES teachers(id),
  parent_id    TEXT NOT NULL REFERENCES parents(id),
  student_id   TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration     INT DEFAULT 30,
  status       TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','CANCELLED','COMPLETED')),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit log tenant ────────────────────────────────────────────────────────
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
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ─── Sanctions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sanctions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id  TEXT NOT NULL REFERENCES students(id),
  type        TEXT NOT NULL CHECK (type IN ('AVERTISSEMENT','BLAME','EXCLUSION_TEMP','RENVOI','AUTRE')),
  reason      TEXT NOT NULL,
  description TEXT,
  date        DATE NOT NULL,
  duration    INT,
  issued_by   TEXT NOT NULL REFERENCES users(id),
  notified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sanctions_student ON sanctions(student_id);

-- ─── Paramètres de l'école ───────────────────────────────────────────────────
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
  grade_system       TEXT DEFAULT '20' CHECK (grade_system IN ('20','AF','COMPETENCES')),
  interior_rules_url TEXT,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Réinitialiser le search_path
SET search_path = public;

-- =============================================================================
-- FIN DE LA MIGRATION
-- Résultat attendu :
--   Schéma public  : 7 tables (plans, schools, subscriptions, ...)
--   Schéma tenant  : 25 tables (users, students, grades, ...)
-- =============================================================================
