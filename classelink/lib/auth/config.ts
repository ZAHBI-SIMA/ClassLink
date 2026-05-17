import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { getTenantPrisma } from '@/lib/db/tenant'
import { publicPrisma } from '@/lib/db/public'
import type { Role } from '@/types'
// Sentinel pour identifier le Super Admin (pas de schéma tenant)
export const SUPER_ADMIN_SCHEMA = '__super_admin__'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  schemaName: z.string(),
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

        // ── Connexion Super Admin (schéma public) ──────────────────────────
        if (schemaName === SUPER_ADMIN_SCHEMA || schemaName === '') {
          try {
            const db = publicPrisma as any
            const admin = await db.superAdminUser.findUnique({
              where: { email },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                passwordHash: true,
                isActive: true,
              },
            })

            if (!admin || !admin.isActive) return null

            const valid = await compare(password, admin.passwordHash)
            if (!valid) return null

            // Mettre à jour la date de dernière connexion
            await db.superAdminUser.update({
              where: { id: admin.id },
              data: { lastLoginAt: new Date() },
            })

            return {
              id: admin.id,
              email: admin.email,
              name: `${admin.firstName} ${admin.lastName}`,
              role: 'SUPER_ADMIN' as Role,
              schemaName: SUPER_ADMIN_SCHEMA,
              firstName: admin.firstName,
              lastName: admin.lastName,
            }
          } catch {
            return null
          }
        }

        // ── Connexion utilisateur école (schéma tenant) ────────────────────
        try {
          const db = getTenantPrisma(schemaName) as any
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
        token.id = user.id!
        token.role = user.role
        token.schemaName = user.schemaName
        token.firstName = user.firstName
        token.lastName = user.lastName
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.schemaName = token.schemaName
        session.user.firstName = token.firstName
        session.user.lastName = token.lastName
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },

  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
})
