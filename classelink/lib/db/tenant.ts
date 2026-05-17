import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { publicPrisma } from './public'
import { TenantError } from '@/lib/errors'

const tenantClients = new Map<string, PrismaClient>()

export function getTenantPrisma(schemaName: string): PrismaClient {
  if (!schemaName) throw new TenantError()

  if (tenantClients.has(schemaName)) {
    return tenantClients.get(schemaName)!
  }

  // Définir le search_path PostgreSQL pour isoler le schéma tenant
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Chaque connexion pointe sur le schéma du tenant
    options: `-c search_path="${schemaName}",public`,
  })

  const adapter = new PrismaPg(pool)
  const client = new PrismaClient({ adapter } as any)

  tenantClients.set(schemaName, client)
  return client
}

export async function getSchemaFromHostname(hostname: string): Promise<string | null> {
  const host = hostname.split(':')[0]

  if (process.env.NODE_ENV === 'development' && host === 'localhost') {
    return process.env.DEV_SCHOOL_SCHEMA ?? null
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'classelink.ci'
  const isSubdomain = host.endsWith(`.${appDomain}`)
  const subdomain = isSubdomain ? host.replace(`.${appDomain}`, '') : null

  const school = await (publicPrisma as any).school.findFirst({
    where: {
      OR: [
        ...(subdomain ? [{ subdomain }] : []),
        { customDomain: host },
      ],
      status: { in: ['TRIAL', 'ACTIVE'] },
    },
    select: { schemaName: true },
  })

  return school?.schemaName ?? null
}

export async function createTenantSchema(schemaName: string): Promise<void> {
  await (publicPrisma as any).$executeRawUnsafe(
    `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`
  )
}

export async function dropTenantSchema(schemaName: string): Promise<void> {
  const client = tenantClients.get(schemaName)
  if (client) {
    await client.$disconnect()
    tenantClients.delete(schemaName)
  }
  await (publicPrisma as any).$executeRawUnsafe(
    `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`
  )
}
