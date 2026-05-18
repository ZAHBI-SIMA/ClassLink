/**
 * Seed complet ClasseLink → Supabase via Management API
 * Insère: plans, super admin, école démo, données tenant school_demo
 *
 * Usage: node scripts/seed-supabase.mjs
 */

import https from 'https'
import { createHash } from 'crypto'

const PROJECT_REF  = process.env.SUPABASE_PROJECT_REF
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

// ─── Exécution SQL via Management API (avec retry) ───────────────────────────
function sqlOnce(query) {
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
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed).slice(0, 300)}`))
          } else {
            resolve(parsed)
          }
        } catch {
          reject(new Error(`Parse error: ${data.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { reject(new Error('Timeout')); req.destroy() })
    req.write(body)
    req.end()
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function sql(query, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await sqlOnce(query)
    } catch (err) {
      const isNetwork = err.message.includes('socket') || err.message.includes('TLS') ||
                        err.message.includes('ECONNRESET') || err.message.includes('Timeout')
      if (isNetwork && attempt < retries) {
        const delay = attempt * 2000
        process.stdout.write(`\r   ↻ Erreur réseau, nouvel essai dans ${delay/1000}s...`)
        await sleep(delay)
        process.stdout.write('\r' + ' '.repeat(60) + '\r')
      } else {
        throw err
      }
    }
  }
}

// Hashes bcrypt pré-calculés (cost 12) — évite d'avoir à activer pgcrypto côté tenant
// admin@2024! / Parent@2024! / Eleve@2024! / Admin@ClasseLink2024!
const HASH = {
  ADMIN:      '$2b$12$OQq9.xybNj81jQ55IfrX0ue0blbljKWBGuzfc4yTRKkHwALLMUFEO',
  PARENT:     '$2b$12$RPKpzvoNliOUf/CTTXkYOeezXHXGqOvyIV8jxIsNcUrPAPXC8LtAu',
  ELEVE:      '$2b$12$8yXFo4vm/oMJje4W5CEThu8EOqsgdLXqonUcAO2VGOkeqO5gY2YKa',
  SUPERADMIN: '$2b$12$86LswYL.8rrsnKZBTyrJz.jItv6GJUIKyRzIvWvEiNDPeHAjAwloa',
}

// ─── Nettoyage préalable (idempotent) ────────────────────────────────────────
async function cleanup() {
  console.log('🧹 Nettoyage des données existantes...')

  // Vider tenant school_demo (dans l'ordre inverse des dépendances)
  const sp = `SET search_path = school_demo, public;`
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
    try { await sql(`${sp} DELETE FROM ${t} WHERE TRUE`) } catch { /* table vide ou n'existe pas */ }
  }
  console.log('   ✅ Tenant school_demo vidé')

  // Vider public
  await sql(`DELETE FROM public.global_payments WHERE TRUE`)
  await sql(`DELETE FROM public.subscriptions WHERE TRUE`)
  await sql(`DELETE FROM public.schools WHERE TRUE`)
  await sql(`DELETE FROM public.super_admin_users WHERE TRUE`)
  await sql(`DELETE FROM public.plans WHERE TRUE`)
  console.log('   ✅ Tables publiques vidées')
}

// ─── Seed Plans ───────────────────────────────────────────────────────────────
async function seedPlans() {
  console.log('\n📦 Création des plans tarifaires...')

  const plans = [
    {
      id: 'plan_gratuit',
      name: 'Gratuit',
      slug: 'gratuit',
      priceMonthly: 0,
      priceYearly: 0,
      maxStudents: 50,
      maxStorageMb: 500,
      features: ['Gestion élèves', 'Bulletins basiques', 'Messagerie interne'],
    },
    {
      id: 'plan_starter',
      name: 'Starter',
      slug: 'starter',
      priceMonthly: 15000,
      priceYearly: 150000,
      maxStudents: 300,
      maxStorageMb: 5000,
      features: ['Tout Gratuit', 'Paiements en ligne', 'Emplois du temps', 'SMS notifications'],
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      slug: 'pro',
      priceMonthly: 40000,
      priceYearly: 400000,
      maxStudents: 1000,
      maxStorageMb: 20000,
      features: ['Tout Starter', 'Multi-campus', 'Rapports avancés', 'API access', 'Support prioritaire'],
    },
    {
      id: 'plan_entreprise',
      name: 'Entreprise',
      slug: 'entreprise',
      priceMonthly: 100000,
      priceYearly: 1000000,
      maxStudents: -1,
      maxStorageMb: -1,
      features: ['Tout Pro', 'Élèves illimités', 'Stockage illimité', 'SLA garanti', 'Onboarding dédié'],
    },
  ]

  for (const plan of plans) {
    await sql(`
      INSERT INTO public.plans (id, name, slug, "priceMonthly", "priceYearly", "maxStudents", "maxStorageMb", features, "isActive")
      VALUES (
        '${plan.id}',
        '${plan.name}',
        '${plan.slug}',
        ${plan.priceMonthly},
        ${plan.priceYearly},
        ${plan.maxStudents},
        ${plan.maxStorageMb},
        '${JSON.stringify(plan.features)}'::jsonb,
        TRUE
      )
    `)
    console.log(`   ✅ Plan "${plan.name}" créé`)
  }

  return plans
}

// ─── Seed Super Admin ─────────────────────────────────────────────────────────
async function seedSuperAdmin() {
  console.log('\n👤 Création du Super Admin...')

  const email    = 'admin@classelink.ci'
  const password = 'Admin@ClasseLink2024!'

  await sql(`
    INSERT INTO public.super_admin_users (id, email, "passwordHash", "firstName", "lastName", "isActive")
    VALUES (
      'super_admin_1',
      '${email}',
      '${HASH.SUPERADMIN}',
      'Super',
      'Admin',
      TRUE
    )
  `)

  console.log(`   ✅ Super Admin créé`)
  console.log(`   📧 Email    : ${email}`)
  console.log(`   🔑 Password : ${password}`)
}

// ─── Seed École Démo ──────────────────────────────────────────────────────────
async function seedDemoSchool() {
  console.log('\n🏫 Création de l\'école démo...')

  // Créer l'école
  await sql(`
    INSERT INTO public.schools (
      id, name, slug, subdomain, "logoUrl", address, city, country,
      phone, email, "adminEmail", status, "planId", "trialEndsAt", "schemaName"
    ) VALUES (
      'school_demo_id',
      'Lycée Classique d''Abidjan',
      'lycee-classique-abidjan',
      'demo',
      NULL,
      'Rue des Jardins, Cocody',
      'Abidjan',
      'CI',
      '+225 07 07 07 07 07',
      'contact@lycee-classique.ci',
      'admin@lycee-classique.ci',
      'ACTIVE',
      'plan_pro',
      NOW() + INTERVAL '365 days',
      'school_demo'
    )
  `)

  // Créer la souscription
  await sql(`
    INSERT INTO public.subscriptions (
      id, "schoolId", "planId", billing, status,
      "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd"
    ) VALUES (
      'sub_demo_1',
      'school_demo_id',
      'plan_pro',
      'YEARLY',
      'ACTIVE',
      NOW(),
      NOW() + INTERVAL '365 days',
      FALSE
    )
  `)

  console.log('   ✅ École démo créée (school_demo)')
}

// ─── Seed données Tenant school_demo ─────────────────────────────────────────
async function seedTenantData() {
  console.log('\n📚 Initialisation des données tenant (school_demo)...')

  const sp = `SET search_path = school_demo, public;`

  // 1. Utilisateurs
  console.log('   → Utilisateurs...')
  await sql(`${sp}
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified)
    VALUES
      ('u_admin_1',     'admin@lycee-classique.ci',      '${HASH.ADMIN}',  'Kouamé',       'N''Guessan',  '+225 07 11 11 11 11', 'ADMIN',     TRUE, TRUE),
      ('u_censor_1',    'censeur@lycee-classique.ci',    '${HASH.ADMIN}',  'Aminata',      'Coulibaly',   '+225 07 22 22 22 22', 'CENSOR',    TRUE, TRUE),
      ('u_acct_1',      'comptable@lycee-classique.ci',  '${HASH.ADMIN}',  'Ibrahim',      'Traoré',      '+225 07 33 33 33 33', 'ACCOUNTANT',TRUE, TRUE),
      ('u_teacher_1',   'prof.math@lycee-classique.ci',  '${HASH.ADMIN}',  'Jean-Baptiste','Koné',        '+225 07 44 44 44 44', 'TEACHER',   TRUE, TRUE),
      ('u_teacher_2',   'prof.fr@lycee-classique.ci',    '${HASH.ADMIN}',  'Marie',        'Bamba',       '+225 07 55 55 55 55', 'TEACHER',   TRUE, TRUE),
      ('u_teacher_3',   'prof.svt@lycee-classique.ci',   '${HASH.ADMIN}',  'Paul',         'Ouattara',    '+225 07 66 66 66 66', 'TEACHER',   TRUE, TRUE),
      ('u_parent_1',    'parent1@gmail.com',             '${HASH.PARENT}', 'Fatou',        'Diallo',      '+225 07 77 77 77 77', 'PARENT',    TRUE, TRUE),
      ('u_parent_2',    'parent2@gmail.com',             '${HASH.PARENT}', 'Seydou',       'Konaté',      '+225 07 88 88 88 88', 'PARENT',    TRUE, TRUE),
      ('u_student_1',   'eleve1@lycee-classique.ci',     '${HASH.ELEVE}',  'Awa',          'Diallo',      NULL,                  'STUDENT',   TRUE, TRUE),
      ('u_student_2',   'eleve2@lycee-classique.ci',     '${HASH.ELEVE}',  'Moussa',       'Konaté',      NULL,                  'STUDENT',   TRUE, TRUE),
      ('u_student_3',   'eleve3@lycee-classique.ci',     '${HASH.ELEVE}',  'Aïcha',        'Traoré',      NULL,                  'STUDENT',   TRUE, TRUE),
      ('u_student_4',   'eleve4@lycee-classique.ci',     '${HASH.ELEVE}',  'Kofi',         'Mensah',      NULL,                  'STUDENT',   TRUE, TRUE)
    ON CONFLICT (email) DO NOTHING
  `)

  // 2. Paramètres école
  console.log('   → Paramètres école...')
  await sql(`${sp}
    INSERT INTO school_settings (id, school_name, address, city, phone, email, director_name, grade_system)
    VALUES ('settings_demo', 'Lycée Classique d''Abidjan', 'Rue des Jardins, Cocody', 'Abidjan',
            '+225 07 07 07 07 07', 'contact@lycee-classique.ci', 'M. Koffi ASSOUMOU', '20')
    ON CONFLICT (id) DO UPDATE SET school_name = EXCLUDED.school_name
  `)

  // 3. Année scolaire + trimestres
  console.log('   → Année scolaire et trimestres...')
  await sql(`${sp}
    INSERT INTO academic_years (id, name, start_date, end_date, is_current)
    VALUES ('ay_2024', '2024-2025', '2024-10-01', '2025-07-31', TRUE)
    ON CONFLICT (id) DO NOTHING
  `)
  await sql(`${sp}
    INSERT INTO terms (id, academic_year_id, name, term_order, start_date, end_date, report_card_date)
    VALUES
      ('term_1','ay_2024','1er Trimestre',  1,'2024-10-01','2024-12-20','2025-01-10'),
      ('term_2','ay_2024','2ème Trimestre', 2,'2025-01-06','2025-03-28','2025-04-10'),
      ('term_3','ay_2024','3ème Trimestre', 3,'2025-04-14','2025-07-04','2025-07-15')
    ON CONFLICT (id) DO NOTHING
  `)

  // 4. Niveaux et classes
  console.log('   → Niveaux et classes...')
  await sql(`${sp}
    INSERT INTO levels (id, name, level_order)
    VALUES ('lvl_sec','Seconde',1),('lvl_pre','Première',2),('lvl_ter','Terminale',3)
    ON CONFLICT (id) DO NOTHING
  `)
  await sql(`${sp}
    INSERT INTO classes (id, name, level_id, academic_year_id, max_students, room)
    VALUES
      ('cls_2a','2nde A','lvl_sec','ay_2024',45,'Salle 101'),
      ('cls_2b','2nde B','lvl_sec','ay_2024',45,'Salle 102'),
      ('cls_1a','1ère A','lvl_pre','ay_2024',40,'Salle 201'),
      ('cls_ta','Terminale A','lvl_ter','ay_2024',38,'Salle 301')
    ON CONFLICT (id) DO NOTHING
  `)

  // 5. Matières
  console.log('   → Matières...')
  await sql(`${sp}
    INSERT INTO subjects (id, name, code)
    VALUES ('sub_math','Mathématiques','MATH'),('sub_fr','Français','FR'),('sub_svt','SVT','SVT'),
           ('sub_hist','Histoire-Géo','HG'),('sub_ang','Anglais','ANG'),('sub_phys','Physique-Chimie','PC')
    ON CONFLICT (id) DO NOTHING
  `)
  await sql(`${sp}
    INSERT INTO level_subjects (level_id, subject_id, coefficient)
    VALUES
      ('lvl_sec','sub_math',5),('lvl_sec','sub_fr',4),('lvl_sec','sub_svt',3),
      ('lvl_sec','sub_hist',3),('lvl_sec','sub_ang',3),('lvl_sec','sub_phys',4),
      ('lvl_ter','sub_math',6),('lvl_ter','sub_fr',4),('lvl_ter','sub_phys',5)
    ON CONFLICT (level_id, subject_id) DO NOTHING
  `)

  // 6. Enseignants
  console.log('   → Enseignants...')
  await sql(`${sp}
    INSERT INTO teachers (id, user_id, employee_id, specialty, hire_date)
    VALUES
      ('t_1','u_teacher_1','EMP-001','Mathématiques','2018-10-01'),
      ('t_2','u_teacher_2','EMP-002','Français','2019-10-01'),
      ('t_3','u_teacher_3','EMP-003','SVT','2020-10-01')
    ON CONFLICT (id) DO NOTHING
  `)

  // 7. Attribution enseignant-matière-classe
  console.log('   → Attributions...')
  await sql(`${sp}
    INSERT INTO teacher_subject_classes (id, teacher_id, subject_id, class_id)
    VALUES
      ('tsc_1','t_1','sub_math','cls_2a'),
      ('tsc_2','t_2','sub_fr','cls_2a'),
      ('tsc_3','t_3','sub_svt','cls_2a'),
      ('tsc_4','t_1','sub_math','cls_ta'),
      ('tsc_5','t_2','sub_fr','cls_ta')
    ON CONFLICT (teacher_id, subject_id, class_id) DO NOTHING
  `)

  // 8. Élèves + parents
  console.log('   → Élèves et parents...')
  await sql(`${sp}
    INSERT INTO students (id, user_id, student_id, date_of_birth, gender)
    VALUES
      ('stu_1','u_student_1','STU-001','2008-03-15','F'),
      ('stu_2','u_student_2','STU-002','2008-07-22','M'),
      ('stu_3','u_student_3','STU-003','2007-11-05','F'),
      ('stu_4','u_student_4','STU-004','2006-04-18','M')
    ON CONFLICT (id) DO NOTHING
  `)
  await sql(`${sp}
    INSERT INTO parents (id, user_id)
    VALUES ('par_1','u_parent_1'),('par_2','u_parent_2')
    ON CONFLICT (id) DO NOTHING
  `)

  // 9. Inscriptions (enrollments)
  console.log('   → Inscriptions...')
  await sql(`${sp}
    INSERT INTO enrollments (id, student_id, class_id, academic_year_id, status)
    VALUES
      ('enr_1','stu_1','cls_2a','ay_2024','ACTIVE'),
      ('enr_2','stu_2','cls_2a','ay_2024','ACTIVE'),
      ('enr_3','stu_3','cls_2b','ay_2024','ACTIVE'),
      ('enr_4','stu_4','cls_ta','ay_2024','ACTIVE')
    ON CONFLICT (student_id, academic_year_id) DO NOTHING
  `)

  // 10. Liens parent-élève
  console.log('   → Liens parents-élèves...')
  await sql(`${sp}
    INSERT INTO parent_students (id, parent_id, student_id, relation, is_primary)
    VALUES
      ('ps_1','par_1','stu_1','Mère',TRUE),
      ('ps_2','par_1','stu_2','Mère',TRUE),
      ('ps_3','par_2','stu_3','Père',TRUE),
      ('ps_4','par_2','stu_4','Père',TRUE)
    ON CONFLICT (parent_id, student_id) DO NOTHING
  `)

  // 11. Emploi du temps
  console.log('   → Emploi du temps...')
  await sql(`${sp}
    INSERT INTO schedules (id, class_id, teacher_subject_class_id, day_of_week, start_time, end_time, room)
    VALUES
      ('sch_1','cls_2a','tsc_1',1,'08:00','10:00','Salle 101'),
      ('sch_2','cls_2a','tsc_2',1,'10:15','12:15','Salle 101'),
      ('sch_3','cls_2a','tsc_3',2,'08:00','10:00','Salle 101'),
      ('sch_4','cls_2a','tsc_1',3,'14:00','16:00','Salle 101'),
      ('sch_5','cls_ta','tsc_4',1,'14:00','16:00','Salle 301'),
      ('sch_6','cls_ta','tsc_5',2,'10:15','12:15','Salle 301')
    ON CONFLICT (id) DO NOTHING
  `)

  // 12. Frais et paiements
  console.log('   → Frais et paiements...')
  await sql(`${sp}
    INSERT INTO fee_types (id, name, amount, is_optional)
    VALUES
      ('ft_ins','Frais d''inscription',25000,FALSE),
      ('ft_sco_sec','Scolarité Seconde',120000,FALSE),
      ('ft_sco_ter','Scolarité Terminale',150000,FALSE),
      ('ft_transp','Transport scolaire',60000,TRUE)
    ON CONFLICT (id) DO NOTHING
  `)
  await sql(`${sp}
    INSERT INTO payments (id, student_id, parent_id, fee_type_id, amount, status, paid_at, due_date)
    VALUES
      ('pay_1','stu_1','par_1','ft_ins',    25000,'SUCCESS','2024-10-05','2024-10-15'),
      ('pay_2','stu_1','par_1','ft_sco_sec',120000,'SUCCESS','2024-10-05','2024-10-31'),
      ('pay_3','stu_2','par_1','ft_ins',    25000,'SUCCESS','2024-10-06','2024-10-15'),
      ('pay_4','stu_2','par_1','ft_sco_sec',120000,'PENDING',NULL,'2024-10-31'),
      ('pay_5','stu_3','par_2','ft_ins',    25000,'SUCCESS','2024-10-07','2024-10-15'),
      ('pay_6','stu_4','par_2','ft_ins',    25000,'SUCCESS','2024-10-07','2024-10-15'),
      ('pay_7','stu_4','par_2','ft_sco_ter',150000,'SUCCESS','2024-10-08','2024-10-31')
    ON CONFLICT (id) DO NOTHING
  `)

  // 13. Notes
  console.log('   → Notes...')
  await sql(`${sp}
    INSERT INTO grades (id, student_id, subject_id, term_id, type, value, max_value, coefficient, created_by, published_at)
    VALUES
      ('gr_1','stu_1','sub_math','term_1','COMPOSITION',14.5,20,5,'u_teacher_1',NOW()),
      ('gr_2','stu_1','sub_fr',  'term_1','COMPOSITION',12.0,20,4,'u_teacher_2',NOW()),
      ('gr_3','stu_1','sub_svt', 'term_1','COMPOSITION',16.0,20,3,'u_teacher_3',NOW()),
      ('gr_4','stu_2','sub_math','term_1','COMPOSITION',10.0,20,5,'u_teacher_1',NOW()),
      ('gr_5','stu_2','sub_fr',  'term_1','COMPOSITION',13.5,20,4,'u_teacher_2',NOW()),
      ('gr_6','stu_4','sub_math','term_1','COMPOSITION',17.0,20,6,'u_teacher_1',NOW()),
      ('gr_7','stu_4','sub_fr',  'term_1','COMPOSITION',14.0,20,4,'u_teacher_2',NOW())
    ON CONFLICT (id) DO NOTHING
  `)

  // 14. Présences
  console.log('   → Présences...')
  await sql(`${sp}
    INSERT INTO attendances (id, student_id, term_id, date, schedule_id, status, justified, recorded_by)
    VALUES
      ('att_1','stu_2','term_1','2024-10-15','sch_1','ABSENT',FALSE,'u_teacher_1'),
      ('att_2','stu_2','term_1','2024-11-05','sch_2','LATE',  FALSE,'u_teacher_2'),
      ('att_3','stu_3','term_1','2024-10-22',NULL,   'ABSENT',TRUE, 'u_censor_1')
    ON CONFLICT (student_id, date, schedule_id) DO NOTHING
  `)

  // 15. Devoirs
  console.log('   → Devoirs...')
  await sql(`${sp}
    INSERT INTO assignments (id, class_id, teacher_id, subject_id, title, description, due_date, max_score)
    VALUES
      ('asgn_1','cls_2a','t_1','sub_math','Devoir maison - Fonctions','Exercices sur les fonctions du 2nd degré','2024-11-15',20),
      ('asgn_2','cls_2a','t_2','sub_fr',  'Résumé de texte','Résumer le texte de Senghor page 45','2024-11-20',20)
    ON CONFLICT (id) DO NOTHING
  `)

  // 16. Annonces
  console.log('   → Annonces...')
  await sql(`${sp}
    INSERT INTO announcements (id, title, content, author_id, target_roles, expires_at)
    VALUES
      ('ann_1','Bienvenue pour l''année 2024-2025',
       'Nous souhaitons la bienvenue à tous pour cette nouvelle année scolaire !',
       'u_admin_1','["TEACHER","PARENT","STUDENT"]','2025-10-31'),
      ('ann_2','Réunion parents-professeurs',
       'Réunion le 15 novembre 2024 à 16h dans la grande salle.',
       'u_admin_1','["PARENT"]','2024-11-20')
    ON CONFLICT (id) DO NOTHING
  `)

  console.log('   ✅ Données tenant créées avec succès')
}

// ─── Résumé final ─────────────────────────────────────────────────────────────
async function printSummary() {
  console.log('\n─────────────────────────────────────────────')
  console.log('📋 Résumé de la base Supabase :')

  try {
    const publicTables = await sql(`
      SELECT tablename, (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = t.tablename)::int AS col_count
      FROM pg_tables t WHERE schemaname = 'public' ORDER BY tablename
    `)
    const tenantTables = await sql(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'school_demo' ORDER BY tablename
    `)

    console.log(`\n📁 Schéma public (${publicTables.length} tables) :`)
    publicTables.forEach(r => console.log(`   • ${r.tablename}`))

    console.log(`\n📁 Schéma tenant school_demo (${tenantTables.length} tables) :`)
    tenantTables.forEach(r => console.log(`   • ${r.tablename}`))
  } catch {
    console.log('   (résumé non disponible)')
  }

  console.log('\n🔑 Comptes créés :')
  console.log('   Super Admin  : admin@classelink.ci / Admin@ClasseLink2024!')
  console.log('   Admin école  : admin@lycee-classique.ci / Admin@2024!')
  console.log('   Censeur      : censeur@lycee-classique.ci / Admin@2024!')
  console.log('   Comptable    : comptable@lycee-classique.ci / Admin@2024!')
  console.log('   Prof Math    : prof.math@lycee-classique.ci / Admin@2024!')
  console.log('   Prof Français: prof.francais@lycee-classique.ci / Admin@2024!')
  console.log('   Parent 1     : parent1@gmail.com / Parent@2024!')
  console.log('   Parent 2     : parent2@gmail.com / Parent@2024!')

  console.log('\n🎉 Seed Supabase terminé !')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log('🚀 Seed ClasseLink → Supabase')
  console.log(`   Projet : ${PROJECT_REF}\n`)

  try {
    await cleanup()
    await seedPlans()
    await seedSuperAdmin()
    await seedDemoSchool()
    await seedTenantData()
    await printSummary()
  } catch (err) {
    console.error('\n❌ Erreur :', err.message)
    process.exit(1)
  }
}

run()
