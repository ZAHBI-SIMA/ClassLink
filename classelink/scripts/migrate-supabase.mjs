/**
 * Migration complète vers Supabase via Management API
 * Usage: node scripts/migrate-supabase.mjs
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import https from 'https'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PROJECT_REF  = process.env.SUPABASE_PROJECT_REF
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

// ─── Exécution SQL via Management API ────────────────────────────────────────
async function sql(query) {
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
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`))
          } else {
            resolve(parsed)
          }
        } catch {
          reject(new Error(`Parse error: ${data}`))
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { reject(new Error('Timeout')); req.destroy() })
    req.write(body)
    req.end()
  })
}

// ─── Schéma public (tables partagées SaaS) ────────────────────────────────────
const PUBLIC_SCHEMA_SQL = `
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

CREATE INDEX IF NOT EXISTS idx_schools_slug   ON schools(slug);
CREATE INDEX IF NOT EXISTS idx_schools_schema ON schools("schemaName");

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

CREATE INDEX IF NOT EXISTS idx_global_audit_school   ON global_audit_logs("schoolId");
CREATE INDEX IF NOT EXISTS idx_global_audit_created  ON global_audit_logs("createdAt" DESC);
`

async function run() {
  console.log('🚀 Migration ClasseLink → Supabase')
  console.log(`   Projet : ${PROJECT_REF}\n`)

  // ── 1. Schéma public ────────────────────────────────────────────────────────
  console.log('📦 [1/3] Application du schéma public...')
  try {
    await sql(PUBLIC_SCHEMA_SQL)
    console.log('✅ Tables publiques créées')
  } catch (err) {
    console.error('❌ Schéma public :', err.message)
    process.exit(1)
  }

  // ── 2. Créer le schéma tenant school_demo ──────────────────────────────────
  console.log('\n📦 [2/3] Création du schéma tenant "school_demo"...')
  try {
    await sql(`CREATE SCHEMA IF NOT EXISTS "school_demo"`)
    console.log('✅ Schéma school_demo créé')
  } catch (err) {
    console.error('❌ Création schéma :', err.message)
    process.exit(1)
  }

  // ── 3. Appliquer tenant-schema.sql dans school_demo ────────────────────────
  console.log('\n📦 [3/3] Application des tables tenant...')
  const tenantSQL = readFileSync(
    join(__dirname, '..', 'prisma', 'tenant-schema.sql'),
    'utf8'
  )
  try {
    await sql(`SET search_path = "school_demo", public;\n${tenantSQL}`)
    console.log('✅ Tables tenant créées dans school_demo')
  } catch (err) {
    console.error('❌ Schéma tenant :', err.message)
    // Tenter instruction par instruction si le bloc entier échoue
    console.log('   → Tentative instruction par instruction...')
    const statements = tenantSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 5)
    let ok = 0, ko = 0
    for (const stmt of statements) {
      try {
        await sql(`SET search_path = "school_demo", public; ${stmt}`)
        ok++
      } catch (e) {
        ko++
        console.warn(`   ⚠ ${stmt.slice(0, 60)}... → ${e.message}`)
      }
    }
    console.log(`   → ${ok} OK, ${ko} erreurs`)
  }

  // ── Résumé ─────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────')
  try {
    const publicTables = await sql(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    )
    const tenantTables = await sql(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'school_demo' ORDER BY tablename`
    )
    console.log(`📋 Tables publiques (${publicTables.length}) :`)
    publicTables.forEach(r => console.log(`   • ${r.tablename}`))
    console.log(`\n📋 Tables tenant school_demo (${tenantTables.length}) :`)
    tenantTables.forEach(r => console.log(`   • ${r.tablename}`))
  } catch (e) {
    console.warn('   (résumé non disponible)')
  }
  console.log('\n🎉 Migration terminée !')
}

run()
