import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  publicPrisma: PrismaClient | undefined
}

export const publicPrisma =
  globalForPrisma.publicPrisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  } as any)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.publicPrisma = publicPrisma
}
