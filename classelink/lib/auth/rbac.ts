import type { Role } from '@/types'
import { ForbiddenError, UnauthorizedError } from '@/lib/errors'
import { auth } from './config'

// ─── Table des permissions ───────────────────────────────────────────────────
const PERMISSIONS: Record<string, Record<string, Role[]>> = {
  SCHOOL: {
    READ: ['SUPER_ADMIN'],
    CREATE: ['SUPER_ADMIN'],
    UPDATE: ['SUPER_ADMIN'],
    DELETE: ['SUPER_ADMIN'],
  },
  USER: {
    READ: ['ADMIN', 'CENSOR'],
    CREATE: ['ADMIN'],
    UPDATE: ['ADMIN'],
    DELETE: ['ADMIN'],
  },
  GRADE: {
    READ: ['ADMIN', 'CENSOR', 'TEACHER', 'PARENT', 'STUDENT'],
    CREATE: ['ADMIN', 'TEACHER'],
    UPDATE: ['ADMIN', 'TEACHER'],
    DELETE: ['ADMIN'],
    PUBLISH: ['ADMIN', 'TEACHER'],
  },
  ATTENDANCE: {
    READ: ['ADMIN', 'CENSOR', 'TEACHER', 'PARENT', 'STUDENT'],
    CREATE: ['ADMIN', 'CENSOR', 'TEACHER'],
    UPDATE: ['ADMIN', 'CENSOR', 'TEACHER'],
    JUSTIFY: ['ADMIN', 'CENSOR', 'PARENT'],
  },
  PAYMENT: {
    READ: ['ADMIN', 'ACCOUNTANT', 'PARENT'],
    CREATE: ['ADMIN', 'ACCOUNTANT', 'PARENT'],
    UPDATE: ['ADMIN', 'ACCOUNTANT'],
    DELETE: ['ADMIN'],
    REFUND: ['ADMIN', 'ACCOUNTANT'],
  },
  REPORT_CARD: {
    READ: ['ADMIN', 'CENSOR', 'TEACHER', 'PARENT', 'STUDENT'],
    CREATE: ['ADMIN'],
    SEND: ['ADMIN'],
    SIGN: ['ADMIN'],
  },
  ASSIGNMENT: {
    READ: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'],
    CREATE: ['ADMIN', 'TEACHER'],
    UPDATE: ['ADMIN', 'TEACHER'],
    DELETE: ['ADMIN', 'TEACHER'],
    SUBMIT: ['STUDENT'],
    GRADE: ['ADMIN', 'TEACHER'],
  },
  LESSON: {
    READ: ['ADMIN', 'CENSOR', 'TEACHER', 'PARENT', 'STUDENT'],
    CREATE: ['ADMIN', 'TEACHER'],
    UPDATE: ['ADMIN', 'TEACHER'],
    DELETE: ['ADMIN'],
  },
  MESSAGE: {
    READ: ['ADMIN', 'CENSOR', 'TEACHER', 'PARENT', 'STUDENT'],
    CREATE: ['ADMIN', 'CENSOR', 'TEACHER', 'PARENT'],
    DELETE: ['ADMIN'],
  },
  ANNOUNCEMENT: {
    READ: ['ADMIN', 'CENSOR', 'TEACHER', 'PARENT', 'STUDENT'],
    CREATE: ['ADMIN', 'CENSOR', 'TEACHER'],
    UPDATE: ['ADMIN', 'CENSOR'],
    DELETE: ['ADMIN'],
  },
  SCHEDULE: {
    READ: ['ADMIN', 'CENSOR', 'TEACHER', 'PARENT', 'STUDENT'],
    CREATE: ['ADMIN'],
    UPDATE: ['ADMIN', 'CENSOR'],
    DELETE: ['ADMIN'],
  },
  FINANCE_REPORT: {
    READ: ['ADMIN', 'ACCOUNTANT'],
    EXPORT: ['ADMIN', 'ACCOUNTANT'],
  },
}

export function can(role: Role, resource: string, action: string): boolean {
  return PERMISSIONS[resource]?.[action]?.includes(role) ?? false
}

// Wrapper Server Action avec vérification auth + permission
export function withPermission<TArgs extends unknown[], TReturn>(
  resource: string,
  action: string,
  handler: (
    ctx: { userId: string; schemaName: string; role: Role },
    ...args: TArgs
  ) => Promise<TReturn>
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const session = await auth()

    if (!session?.user) throw new UnauthorizedError()
    if (!can(session.user.role as Role, resource, action)) throw new ForbiddenError()

    return handler(
      {
        userId: session.user.id!,
        schemaName: session.user.schemaName as string,
        role: session.user.role as Role,
      },
      ...args
    )
  }
}

// Récupérer la session ou lever une erreur
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new UnauthorizedError()
  return session
}

// Récupérer la session ou lever une erreur + vérifier le rôle
export async function requireRole(...roles: Role[]) {
  const session = await requireAuth()
  if (!roles.includes(session.user.role as Role)) throw new ForbiddenError()
  return session
}
