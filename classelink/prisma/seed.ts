import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hash } from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Démarrage du seed...')

  // ── Plans tarifaires ─────────────────────────────────────────────────────
  // Forfaits annuels (facturation à l'établissement) : accès complet à la plateforme,
  // sans palier de fonctionnalités ni limite d'effectif. Le prix dépend uniquement
  // du type d'établissement. Les parents règlent en plus 2 000 FCFA/an/enfant (voir PARENT_FEE_PER_CHILD).
  const plans = [
    {
      name: 'École primaire',
      slug: 'primaire',
      priceMonthly: 0,
      priceYearly: 30000,
      maxStudents: -1,
      maxStorageMb: 20000,
      features: ['Accès complet à la plateforme', 'Élèves illimités', 'Support standard'],
    },
    {
      name: 'Collège ou lycée',
      slug: 'college-lycee',
      priceMonthly: 0,
      priceYearly: 50000,
      maxStudents: -1,
      maxStorageMb: 20000,
      features: ['Accès complet à la plateforme', 'Élèves illimités', 'Support standard'],
    },
    {
      name: 'Groupe scolaire',
      slug: 'groupe-scolaire',
      priceMonthly: 0,
      priceYearly: 70000,
      maxStudents: -1,
      maxStorageMb: 20000,
      features: ['Accès complet à la plateforme', 'Primaire + Collège/Lycée réunis', 'Élèves illimités', 'Support prioritaire'],
    },
  ]

  for (const plan of plans) {
    await (db as any).plan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    })
    console.log(`  ✅ Plan "${plan.name}" créé`)
  }

  // ── Super Administrateur ─────────────────────────────────────────────────
  const adminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'admin@classelink.ci'
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD ?? 'Admin@ClasseLink2024!'

  const passwordHash = await hash(adminPassword, 12)

  await (db as any).superAdminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
    },
  })

  console.log(`  ✅ Super Admin créé : ${adminEmail}`)
  console.log(`  🔑 Mot de passe    : ${adminPassword}`)
  console.log('')
  console.log('🎉 Seed terminé avec succès !')
}

main()
  .catch(e => {
    console.error('❌ Erreur seed :', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
    await pool.end()
  })
