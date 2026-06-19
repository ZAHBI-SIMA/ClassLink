import { NextRequest, NextResponse } from 'next/server'
import { withMobileAuth } from '@/lib/auth/mobile-guard'

export const POST = withMobileAuth(['STUDENT', 'PARENT'], async (req, { user, tenantDb }) => {
  try {
    const { token, platform } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token FCM requis.' }, { status: 400 })

    await tenantDb.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id         BIGSERIAL PRIMARY KEY,
        user_id    TEXT        NOT NULL,
        token      TEXT        NOT NULL,
        platform   TEXT        NOT NULL DEFAULT 'android',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, token)
      )
    `)

    const safeUserId   = user.userId.replace(/'/g, "''")
    const safeToken    = (token as string).replace(/'/g, "''")
    const safePlatform = ((platform as string) ?? 'android').replace(/'/g, "''")

    await tenantDb.$executeRawUnsafe(`
      INSERT INTO device_tokens (user_id, token, platform, updated_at)
      VALUES ('${safeUserId}', '${safeToken}', '${safePlatform}', NOW())
      ON CONFLICT (user_id, token) DO UPDATE
        SET platform = EXCLUDED.platform, updated_at = NOW()
    `)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement du token.' }, { status: 500 })
  }
})
