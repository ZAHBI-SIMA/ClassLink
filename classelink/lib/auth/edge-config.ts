/**
 * Configuration Auth.js minimale pour le middleware Edge Runtime.
 *
 * ⚠️  Ce fichier NE DOIT PAS importer :
 *   - bcryptjs / bcrypt
 *   - pg / prisma / drivers de base de données
 *   - le module Node.js 'crypto'
 *   - tout autre module Node.js non compatible Edge
 *
 * Son seul rôle : décoder le JWT et peupler request.auth.
 * Les providers (credentials, Google) sont dans lib/auth/config.ts.
 */

import NextAuth from 'next-auth'
import type { Role } from '@/types'

export const { auth } = NextAuth({
  secret: process.env.AUTH_SECRET,

  providers: [], // Aucun provider ici — seulement lecture du JWT

  callbacks: {
    async jwt({ token, user }) {
      // Lors d'une connexion initiale, user est peuplé par le provider
      // (géré dans lib/auth/config.ts). Ici on ne fait que propager les champs.
      if (user) {
        token.id         = user.id!
        token.role       = (user as any).role       as Role
        token.schemaName = (user as any).schemaName as string
        token.firstName  = (user as any).firstName  as string
        token.lastName   = (user as any).lastName   as string
        token.twoFactorEnabled = (user as any).twoFactorEnabled ?? false
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id               = token.id         as string
        session.user.role             = token.role        as Role
        session.user.schemaName       = token.schemaName  as string
        session.user.firstName        = token.firstName   as string
        session.user.lastName         = token.lastName    as string
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean | undefined
      }
      return session
    },
  },

  pages: {
    signIn:        '/login',
    error:         '/login',
    verifyRequest: '/verify-email',
  },

  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
})
