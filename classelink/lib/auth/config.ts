import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { getTenantPrisma } from '@/lib/db/tenant'
import type { Role } from '@/types'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  schemaName: z.string().min(1),
})

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
        schemaName: { label: 'Schema', type: 'text' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password, schemaName } = parsed.data

        try {
          const db = getTenantPrisma(schemaName)
          const user = await db.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              passwordHash: true,
              role: true,
              isActive: true,
              avatarUrl: true,
            },
          })

          if (!user || !user.passwordHash || !user.isActive) return null

          const valid = await compare(password, user.passwordHash)
          if (!valid) return null

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            image: user.avatarUrl ?? undefined,
            role: user.role as Role,
            schemaName,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        } catch {
          return null
        }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.schemaName = (user as any).schemaName
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.schemaName = token.schemaName as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },

  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 jours
})
