/**
 * Applique le schéma SQL complet à tous les tenants existants.
 * Utilise CREATE TABLE IF NOT EXISTS — sûr à exécuter plusieurs fois.
 *
 * Usage :
 *   node scripts/migrate-tenants.mjs
 *
 * Nécessite la variable d'environnement DATABASE_URL dans .env
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Pool } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

// Charger .env manuellement
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
try {
  const dotenv = await import('dotenv')
  dotenv.config({ path: join(__dirname, '..', '.env') })
  dotenv.config({ path: join(__dirname, '..', '.env.local') })
} catch {
  // dotenv optionnel
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL manquant dans .env')
  process.exit(1)
}

const sqlPath = join(__dirname, '..', 'prisma', 'tenant-schema.sql')
const sql = readFileSync(sqlPath, 'utf-8')

const pool = new Pool({ connectionString: DATABASE_URL })

async function main() {
  const client = await pool.connect()
  try {
    // Récupérer tous les schémas tenant (format school_xxx)
    const { rows: schemas } = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name LIKE 'school_%'
      ORDER BY schema_name
    `)

    if (schemas.length === 0) {
      console.log('ℹ️  Aucun schéma tenant trouvé (préfixe school_*).')
      return
    }

    console.log(`🔍  ${schemas.length} schéma(s) trouvé(s) : ${schemas.map(r => r.schema_name).join(', ')}`)
    console.log('⏳  Application du schéma SQL...\n')

    for (const { schema_name } of schemas) {
      try {
        await client.query(`SET search_path = "${schema_name}", public`)
        await client.query(sql)
        console.log(`  ✅  ${schema_name} — OK`)
      } catch (err) {
        console.error(`  ❌  ${schema_name} — Erreur :`, err.message)
      }
    }

    console.log('\n🎉  Migration terminée.')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error('Erreur fatale :', err)
  process.exit(1)
})
