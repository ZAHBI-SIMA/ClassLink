import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken, extractBearerToken, MobileJWTPayload } from './mobile-jwt'
import { getTenantPrisma } from '@/lib/db/tenant'

export type MobileRouteContext = {
  user:       MobileJWTPayload
  tenantDb:   any
  schoolId:   string
  schemaName: string
}

type Handler = (req: NextRequest, ctx: MobileRouteContext) => Promise<NextResponse>

export function withMobileAuth(
  roles: string[],
  handler: Handler
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const token = extractBearerToken(req.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Token d\'accès manquant.' }, { status: 401 })
    }

    const payload = await verifyMobileToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide ou expiré.' }, { status: 401 })
    }

    if (roles.length > 0 && !roles.includes(payload.role)) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })
    }

    const tenantDb = getTenantPrisma(payload.schemaName) as any

    return handler(req, {
      user:       payload,
      tenantDb,
      schoolId:   payload.schoolId,
      schemaName: payload.schemaName,
    })
  }
}
