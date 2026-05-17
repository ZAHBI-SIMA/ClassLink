import { PrismaClient } from '@prisma/client'
import { publicPrisma } from './public'
import { TenantError } from '@/lib/errors'

const tenantClients = new Map<string, PrismaClient>()

export function getTenantPrisma(schemaName: string): PrismaClient {
  if (!schemaName) throw new TenantError()

  if (tenantClients.has(schemaName)) {
    return tenantClients.get(schemaName)!
  }

  const url = new URL(process.env.DATABASE_URL!)
  url.searchParams.set('schema', schemaName)

  const client = new PrismaClient({
    datasourceUrl: url.toString(),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  } as any)

  tenantClients.set(schemaName, client)
  return client
}

export async function getSchemaFromHostname(hostname: string): Promise<string | null> {
  // Supprimer le port si présent (localhost:3000)
  const host = hostname.split(':')[0]

  // En développement, utiliser une école de test
  if (process.env.NODE_ENV === 'development' && host === 'localhost') {
    return process.env.DEV_SCHOOL_SCHEMA ?? null
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'classelink.ci'

  // Sous-domaine : lycee-moderne.classelink.ci → subdomain = "lycee-moderne"
  const isSubdomain = host.endsWith(`.${appDomain}`)
  const subdomain = isSubdomain ? host.replace(`.${appDomain}`, '') : null

  const school = await publicPrisma.school.findFirst({
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
  await publicPrisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)
}

export async function dropTenantSchema(schemaName: string): Promise<void> {
  // Retirer le client du cache avant de supprimer le schéma
  const client = tenantClients.get(schemaName)
  if (client) {
    await client.$disconnect()
    tenantClients.delete(schemaName)
  }
  await publicPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
}
