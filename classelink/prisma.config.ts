import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

export default defineConfig({
  // @ts-expect-error earlyAccess is a valid Prisma 7 driver-adapter option
  earlyAccess: true,
  schema: path.join(import.meta.dirname, 'prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrate: {
    async adapter(env: Record<string, string | undefined>) {
      const pool = new Pool({
        connectionString: env.DATABASE_URL,
      })
      return new PrismaPg(pool)
    },
  },
})
