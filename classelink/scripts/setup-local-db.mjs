/**
 * Initialisation de la base PostgreSQL locale pour le développement
 * Crée les tables public + schéma school_demo + données de seed
 *
 * Usage: node scripts/setup-local-db.mjs
 */

import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createHash } from 'crypto'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

const { Pool } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:RepensTOI@localhost:5432/classelink'

const HASH = {
  ADMIN:      '$2b$12$OQq9.xybNj81jQ55IfrX0ue0blbljKWBGuzfc4yTRKkHwALLMUFEO',
  PARENT:     '$2b$12$RPKpzvoNliOUf/CTTXkYOeezXHXGqOvyIV8jxIsNcUrPAPXC8LtAu',
  ELEVE:      '$2b$12$8yXFo4vm/oMJje4W5CEThu8EOqsgdLXqonUcAO2VGOkeqO5gY2YKa',
  SUPERADMIN: '$2b$12$86LswYL.8rrsnKZBTyrJz.jItv6GJUIKyRzIvWvEiNDPeHAjAwloa',
}

const pool = new Pool({ connectionString: DATABASE_URL })

async function run(query, values) {
  const client = await pool.connect()
  try {
    return await client.query(query, values)
  } finally {
    client.release()
  }
}

// ─── Schéma public ────────────────────────────────────────────────────────────
const PUBLIC_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
`

async function setupPublicSchema() {
  console.log('\n📦 [1/3] Création du schéma public...')
  await run(PUBLIC_SQL)
  console.log('   ✅ Tables publiques créées')
}

async function setupTenantSchema() {
  console.log('\n📦 [2/3] Création du schéma tenant school_demo...')
  await run(`CREATE SCHEMA IF NOT EXISTS "school_demo"`)

  const tenantSQL = readFileSync(
    join(__dirname, '..', 'prisma', 'tenant-schema.sql'),
    'utf8'
  )

  // Filtrer les lignes problématiques
  const filtered = tenantSQL
    .split('\n')
    .filter(line => !line.includes('ALTER TABLE parent_students ALTER COLUMN relation DROP NOT NULL'))
    .join('\n')

  const client = await pool.connect()
  try {
    await client.query(`SET search_path = "school_demo", public`)
    await client.query(filtered)
    console.log('   ✅ Tables tenant créées dans school_demo')
  } finally {
    client.release()
  }
}

async function seedData() {
  console.log('\n📦 [3/3] Seed des données...')

  // Nettoyage
  const client = await pool.connect()
  try {
    await client.query(`SET search_path = school_demo, public`)
    const tenantTables = [
      'audit_logs','sanctions','notifications','appointments',
      'submissions','assignments','lessons',
      'attendances','grades',
      'messages','announcements',
      'payments','fee_types',
      'enrollments','parent_students',
      'parents','students',
      'teacher_subject_classes','schedules',
      'teachers',
      'level_subjects','subjects',
      'classes','levels','streams',
      'terms','academic_years',
      'school_settings','users',
    ]
    for (const t of tenantTables) {
      try { await client.query(`DELETE FROM ${t}`) } catch {}
    }
    await client.release()
  } catch { client.release() }

  await run(`DELETE FROM global_payments`)
  await run(`DELETE FROM subscriptions`)
  await run(`DELETE FROM schools`)
  await run(`DELETE FROM super_admin_users`)
  await run(`DELETE FROM plans`)

  // Plans
  const plans = [
    ['plan_gratuit','Gratuit','gratuit',0,0,50,500,JSON.stringify(['Gestion élèves','Bulletins basiques','Messagerie'])],
    ['plan_starter','Starter','starter',15000,150000,300,5000,JSON.stringify(['Tout Gratuit','Paiements en ligne','Emplois du temps'])],
    ['plan_pro','Pro','pro',40000,400000,1000,20000,JSON.stringify(['Tout Starter','Multi-campus','Rapports avancés'])],
    ['plan_entreprise','Entreprise','entreprise',100000,1000000,-1,-1,JSON.stringify(['Tout Pro','Élèves illimités'])],
  ]
  for (const [id,name,slug,pm,py,ms,mb,feat] of plans) {
    await run(`INSERT INTO plans (id,name,slug,"priceMonthly","priceYearly","maxStudents","maxStorageMb",features,"updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) ON CONFLICT (slug) DO NOTHING`,
      [id,name,slug,pm,py,ms,mb,feat])
  }
  console.log('   ✅ Plans créés')

  // Super Admin
  await run(`INSERT INTO super_admin_users (id,email,"passwordHash","firstName","lastName","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW()) ON CONFLICT (email) DO NOTHING`,
    ['super_admin_1','admin@classelink.ci',HASH.SUPERADMIN,'Super','Admin'])
  console.log('   ✅ Super Admin créé')

  // École démo
  await run(`INSERT INTO schools (id,name,slug,subdomain,"adminEmail",status,"planId","schemaName","trialEndsAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()+INTERVAL '365 days',NOW()) ON CONFLICT (slug) DO NOTHING`,
    ['school_demo_id','Lycée Classique d\'Abidjan','lycee-classique-abidjan','demo','admin@lycee-classique.ci','ACTIVE','plan_pro','school_demo'])
  await run(`INSERT INTO subscriptions (id,"schoolId","planId",billing,status,"currentPeriodStart","currentPeriodEnd","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW()+INTERVAL '365 days',NOW()) ON CONFLICT ("schoolId") DO NOTHING`,
    ['sub_demo_1','school_demo_id','plan_pro','YEARLY','ACTIVE'])
  console.log('   ✅ École démo créée')

  // Données tenant
  const tc = await pool.connect()
  try {
    await tc.query(`SET search_path = school_demo, public`)

    await tc.query(`INSERT INTO users (id,email,password_hash,first_name,last_name,phone,role,is_active,email_verified) VALUES
      ('u_admin_1','admin@lycee-classique.ci',$1,'Kouamé','N''Guessan','+225 07 11 11 11 11','ADMIN',TRUE,TRUE),
      ('u_censor_1','censeur@lycee-classique.ci',$1,'Aminata','Coulibaly','+225 07 22 22 22 22','CENSOR',TRUE,TRUE),
      ('u_acct_1','comptable@lycee-classique.ci',$1,'Ibrahim','Traoré','+225 07 33 33 33 33','ACCOUNTANT',TRUE,TRUE),
      ('u_teacher_1','prof.math@lycee-classique.ci',$1,'Jean-Baptiste','Koné','+225 07 44 44 44 44','TEACHER',TRUE,TRUE),
      ('u_teacher_2','prof.fr@lycee-classique.ci',$1,'Marie','Bamba','+225 07 55 55 55 55','TEACHER',TRUE,TRUE),
      ('u_teacher_3','prof.svt@lycee-classique.ci',$1,'Paul','Ouattara','+225 07 66 66 66 66','TEACHER',TRUE,TRUE),
      ('u_parent_1','parent1@gmail.com',$2,'Fatou','Diallo','+225 07 77 77 77 77','PARENT',TRUE,TRUE),
      ('u_parent_2','parent2@gmail.com',$2,'Seydou','Konaté','+225 07 88 88 88 88','PARENT',TRUE,TRUE),
      ('u_student_1','eleve1@lycee-classique.ci',$3,'Awa','Diallo',NULL,'STUDENT',TRUE,TRUE),
      ('u_student_2','eleve2@lycee-classique.ci',$3,'Moussa','Konaté',NULL,'STUDENT',TRUE,TRUE),
      ('u_student_3','eleve3@lycee-classique.ci',$3,'Aïcha','Traoré',NULL,'STUDENT',TRUE,TRUE),
      ('u_student_4','eleve4@lycee-classique.ci',$3,'Kofi','Mensah',NULL,'STUDENT',TRUE,TRUE)
      ON CONFLICT (email) DO NOTHING`, [HASH.ADMIN, HASH.PARENT, HASH.ELEVE])

    await tc.query(`INSERT INTO school_settings (id,school_name,address,city,phone,email,director_name,grade_system) VALUES ('settings_demo','Lycée Classique d''Abidjan','Rue des Jardins, Cocody','Abidjan','+225 07 07 07 07 07','contact@lycee-classique.ci','M. Koffi ASSOUMOU','20') ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO academic_years (id,name,start_date,end_date,is_current) VALUES ('ay_2024','2024-2025','2024-10-01','2025-07-31',TRUE) ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO terms (id,academic_year_id,name,term_order,start_date,end_date) VALUES ('term_1','ay_2024','1er Trimestre',1,'2024-10-01','2024-12-20'),('term_2','ay_2024','2ème Trimestre',2,'2025-01-06','2025-03-28'),('term_3','ay_2024','3ème Trimestre',3,'2025-04-14','2025-07-04') ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO levels (id,name,level_order) VALUES ('lvl_sec','Seconde',1),('lvl_pre','Première',2),('lvl_ter','Terminale',3) ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO classes (id,name,level_id,academic_year_id,max_students,room) VALUES ('cls_2a','2nde A','lvl_sec','ay_2024',45,'Salle 101'),('cls_2b','2nde B','lvl_sec','ay_2024',45,'Salle 102'),('cls_1a','1ère A','lvl_pre','ay_2024',40,'Salle 201'),('cls_ta','Terminale A','lvl_ter','ay_2024',38,'Salle 301') ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO subjects (id,name,code) VALUES ('sub_math','Mathématiques','MATH'),('sub_fr','Français','FR'),('sub_svt','SVT','SVT'),('sub_hist','Histoire-Géo','HG'),('sub_ang','Anglais','ANG'),('sub_phys','Physique-Chimie','PC') ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO level_subjects (level_id,subject_id,coefficient) VALUES ('lvl_sec','sub_math',5),('lvl_sec','sub_fr',4),('lvl_sec','sub_svt',3),('lvl_sec','sub_hist',3),('lvl_sec','sub_ang',3),('lvl_ter','sub_math',6),('lvl_ter','sub_fr',4) ON CONFLICT (level_id,subject_id) DO NOTHING`)
    await tc.query(`INSERT INTO teachers (id,user_id,employee_id,specialty,hire_date) VALUES ('t_1','u_teacher_1','EMP-001','Mathématiques','2018-10-01'),('t_2','u_teacher_2','EMP-002','Français','2019-10-01'),('t_3','u_teacher_3','EMP-003','SVT','2020-10-01') ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO teacher_subject_classes (id,teacher_id,subject_id,class_id) VALUES ('tsc_1','t_1','sub_math','cls_2a'),('tsc_2','t_2','sub_fr','cls_2a'),('tsc_3','t_3','sub_svt','cls_2a'),('tsc_4','t_1','sub_math','cls_ta'),('tsc_5','t_2','sub_fr','cls_ta') ON CONFLICT (teacher_id,subject_id,class_id) DO NOTHING`)
    await tc.query(`INSERT INTO students (id,user_id,student_id,date_of_birth,gender) VALUES ('stu_1','u_student_1','STU-001','2008-03-15','F'),('stu_2','u_student_2','STU-002','2008-07-22','M'),('stu_3','u_student_3','STU-003','2007-11-05','F'),('stu_4','u_student_4','STU-004','2006-04-18','M') ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO parents (id,user_id) VALUES ('par_1','u_parent_1'),('par_2','u_parent_2') ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO enrollments (id,student_id,class_id,academic_year_id,status) VALUES ('enr_1','stu_1','cls_2a','ay_2024','ACTIVE'),('enr_2','stu_2','cls_2a','ay_2024','ACTIVE'),('enr_3','stu_3','cls_2b','ay_2024','ACTIVE'),('enr_4','stu_4','cls_ta','ay_2024','ACTIVE') ON CONFLICT (student_id,academic_year_id) DO NOTHING`)
    await tc.query(`INSERT INTO parent_students (id,parent_id,student_id,relation,is_primary) VALUES ('ps_1','par_1','stu_1','Mère',TRUE),('ps_2','par_1','stu_2','Mère',TRUE),('ps_3','par_2','stu_3','Père',TRUE),('ps_4','par_2','stu_4','Père',TRUE) ON CONFLICT (parent_id,student_id) DO NOTHING`)
    await tc.query(`INSERT INTO schedules (id,class_id,teacher_subject_class_id,day_of_week,start_time,end_time,room) VALUES ('sch_1','cls_2a','tsc_1',1,'08:00','10:00','Salle 101'),('sch_2','cls_2a','tsc_2',1,'10:15','12:15','Salle 101'),('sch_3','cls_2a','tsc_3',2,'08:00','10:00','Salle 101'),('sch_4','cls_2a','tsc_1',3,'14:00','16:00','Salle 101'),('sch_5','cls_ta','tsc_4',1,'14:00','16:00','Salle 301'),('sch_6','cls_ta','tsc_5',2,'10:15','12:15','Salle 301') ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO fee_types (id,name,amount,is_optional) VALUES ('ft_ins','Frais d''inscription',25000,FALSE),('ft_sco_sec','Scolarité Seconde',120000,FALSE),('ft_sco_ter','Scolarité Terminale',150000,FALSE),('ft_transp','Transport scolaire',60000,TRUE) ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO payments (id,student_id,parent_id,fee_type_id,amount,status,paid_at,due_date) VALUES ('pay_1','stu_1','par_1','ft_ins',25000,'SUCCESS','2024-10-05','2024-10-15'),('pay_2','stu_1','par_1','ft_sco_sec',120000,'SUCCESS','2024-10-05','2024-10-31'),('pay_3','stu_2','par_1','ft_ins',25000,'SUCCESS','2024-10-06','2024-10-15'),('pay_4','stu_2','par_1','ft_sco_sec',120000,'PENDING',NULL,'2024-10-31'),('pay_5','stu_3','par_2','ft_ins',25000,'SUCCESS','2024-10-07','2024-10-15'),('pay_6','stu_4','par_2','ft_ins',25000,'SUCCESS','2024-10-07','2024-10-15'),('pay_7','stu_4','par_2','ft_sco_ter',150000,'SUCCESS','2024-10-08','2024-10-31') ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO grades (id,student_id,subject_id,term_id,type,value,max_value,coefficient,created_by,published_at) VALUES ('gr_1','stu_1','sub_math','term_1','COMPOSITION',14.5,20,5,'u_teacher_1',NOW()),('gr_2','stu_1','sub_fr','term_1','COMPOSITION',12.0,20,4,'u_teacher_2',NOW()),('gr_3','stu_1','sub_svt','term_1','COMPOSITION',16.0,20,3,'u_teacher_3',NOW()),('gr_4','stu_2','sub_math','term_1','COMPOSITION',10.0,20,5,'u_teacher_1',NOW()),('gr_5','stu_2','sub_fr','term_1','COMPOSITION',13.5,20,4,'u_teacher_2',NOW()),('gr_6','stu_4','sub_math','term_1','COMPOSITION',17.0,20,6,'u_teacher_1',NOW()),('gr_7','stu_4','sub_fr','term_1','COMPOSITION',14.0,20,4,'u_teacher_2',NOW()) ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO attendances (id,student_id,term_id,date,schedule_id,status,justified,recorded_by) VALUES ('att_1','stu_2','term_1','2024-10-15','sch_1','ABSENT',FALSE,'u_teacher_1'),('att_2','stu_2','term_1','2024-11-05','sch_2','LATE',FALSE,'u_teacher_2'),('att_3','stu_3','term_1','2024-10-22',NULL,'ABSENT',TRUE,'u_censor_1') ON CONFLICT (student_id,date,schedule_id) DO NOTHING`)
    await tc.query(`INSERT INTO announcements (id,title,content,author_id,target_roles,expires_at) VALUES ('ann_1','Bienvenue 2024-2025','Bienvenue à tous pour cette nouvelle année !','u_admin_1','["TEACHER","PARENT","STUDENT"]','2025-10-31'),('ann_2','Réunion parents-professeurs','Réunion le 15/11/2024 à 16h','u_admin_1','["PARENT"]','2024-11-20') ON CONFLICT (id) DO NOTHING`)
    await tc.query(`INSERT INTO assignments (id,class_id,teacher_id,subject_id,title,description,due_date,max_score) VALUES ('asgn_1','cls_2a','t_1','sub_math','Devoir maison - Fonctions','Exercices sur les fonctions du 2nd degré','2024-11-15',20),('asgn_2','cls_2a','t_2','sub_fr','Résumé de texte','Résumer le texte de Senghor page 45','2024-11-20',20) ON CONFLICT (id) DO NOTHING`)

    console.log('   ✅ Données tenant créées')
  } finally {
    tc.release()
  }
}

async function main() {
  console.log('🚀 Initialisation de la base PostgreSQL locale')
  console.log(`   URL : ${DATABASE_URL.replace(/:([^@]+)@/, ':***@')}\n`)

  try {
    await setupPublicSchema()
    await setupTenantSchema()
    await seedData()

    console.log('\n🔑 Comptes disponibles :')
    console.log('   Super Admin  : admin@classelink.ci / Admin@ClasseLink2024!')
    console.log('   Admin école  : admin@lycee-classique.ci / Admin@2024!')
    console.log('   Censeur      : censeur@lycee-classique.ci / Admin@2024!')
    console.log('   Comptable    : comptable@lycee-classique.ci / Admin@2024!')
    console.log('   Prof Math    : prof.math@lycee-classique.ci / Admin@2024!')
    console.log('   Parent 1     : parent1@gmail.com / Parent@2024!')
    console.log('\n🎉 Base locale prête !')
  } catch (err) {
    console.error('\n❌ Erreur :', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
