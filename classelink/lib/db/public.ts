import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  publicPrisma: PrismaClient | undefined
}

function createPublicClient(): PrismaClient {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter } as any)
}

export const publicPrisma = globalForPrisma.publicPrisma ?? createPublicClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.publicPrisma = publicPrisma
}
