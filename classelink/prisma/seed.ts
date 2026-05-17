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
  const plans = [
    {
      name: 'Gratuit',
      slug: 'gratuit',
      priceMonthly: 0,
      priceYearly: 0,
      maxStudents: 50,
      maxStorageMb: 500,
      features: ['Gestion élèves', 'Bulletins basiques', 'Messagerie'],
    },
    {
      name: 'Starter',
      slug: 'starter',
      priceMonthly: 15000,
      priceYearly: 150000,
      maxStudents: 300,
      maxStorageMb: 5000,
      features: [
        'Tout Gratuit',
        'Paiements en ligne',
        'Emplois du temps',
        'SMS notifications',
      ],
    },
    {
      name: 'Pro',
      slug: 'pro',
      priceMonthly: 40000,
      priceYearly: 400000,
      maxStudents: 1000,
      maxStorageMb: 20000,
      features: [
        'Tout Starter',
        'Multi-campus',
        'Rapports avancés',
        'API access',
        'Support prioritaire',
      ],
    },
    {
      name: 'Entreprise',
      slug: 'entreprise',
      priceMonthly: 100000,
      priceYearly: 1000000,
      maxStudents: -1,
      maxStorageMb: -1,
      features: [
        'Tout Pro',
        'Élèves illimités',
        'Stockage illimité',
        'SLA garanti',
        'Onboarding dédié',
        'Formation incluse',
      ],
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
