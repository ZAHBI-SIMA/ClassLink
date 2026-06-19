import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken, signMobileToken, extractBearerToken } from '@/lib/auth/mobile-jwt'
import { getTenantPrisma } from '@/lib/db/tenant'

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Refresh token manquant.' }, { status: 401 })
    }

    const payload = await verifyMobileToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Refresh token invalide ou expiré.' }, { status: 401 })
    }

    // Vérifier que l'utilisateur existe toujours
    const tenantDb = getTenantPrisma(payload.schemaName) as any
    const users: any[] = await tenantDb.$queryRaw`
      SELECT id, role, is_active FROM users WHERE id = ${payload.userId} LIMIT 1
    `
    if (!users[0] || !users[0].is_active) {
      return NextResponse.json({ error: 'Utilisateur introuvable ou désactivé.' }, { status: 401 })
    }

    const newAccessToken = await signMobileToken({
      userId:     payload.userId,
      role:       users[0].role,
      schemaName: payload.schemaName,
      schoolId:   payload.schoolId,
    })

    return NextResponse.json({ accessToken: newAccessToken })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
