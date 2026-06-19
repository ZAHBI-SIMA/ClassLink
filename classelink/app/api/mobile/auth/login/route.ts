import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { publicPrisma as db } from '@/lib/db/public'
import { getTenantPrisma } from '@/lib/db/tenant'
import { signMobileToken, signMobileRefreshToken } from '@/lib/auth/mobile-jwt'

export async function POST(req: NextRequest) {
  try {
    const { schoolSlug, email, password } = await req.json()

    if (!schoolSlug || !email || !password) {
      return NextResponse.json({ error: 'schoolSlug, email et password sont requis.' }, { status: 400 })
    }

    // 1. Retrouver l'école par son slug
    const school = await db.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true, name: true, schemaName: true, status: true },
    })

    if (!school) {
      return NextResponse.json({ error: 'Établissement introuvable.' }, { status: 404 })
    }

    if (school.status === 'SUSPENDED' || school.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cet établissement n\'est plus actif.' }, { status: 403 })
    }

    // 2. Retrouver l'utilisateur dans le schéma tenant
    const tenantDb = getTenantPrisma(school.schemaName) as any
    const users: any[] = await tenantDb.$queryRaw`
      SELECT id, email, password_hash, first_name, last_name, role, avatar_url, is_active
      FROM users
      WHERE email = ${email}
        AND role IN ('STUDENT', 'PARENT')
      LIMIT 1
    `

    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 })
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Compte désactivé. Contactez l\'administration.' }, { status: 403 })
    }

    // 3. Vérifier le mot de passe
    const passwordOk = user.password_hash
      ? await compare(password, user.password_hash)
      : false

    if (!passwordOk) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 })
    }

    // 4. Générer les tokens
    const payload = {
      userId:     user.id,
      role:       user.role,
      schemaName: school.schemaName,
      schoolId:   school.id,
    }

    const [accessToken, refreshToken] = await Promise.all([
      signMobileToken(payload),
      signMobileRefreshToken({ userId: user.id, schemaName: school.schemaName, schoolId: school.id }),
    ])

    // 5. Mettre à jour last_login_at
    await tenantDb.$executeRaw`
      UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}
    `

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id:        user.id,
        firstName: user.first_name,
        lastName:  user.last_name,
        email:     user.email,
        role:      user.role,
        avatarUrl: user.avatar_url ?? null,
      },
      school: {
        id:   school.id,
        name: school.name,
        slug: schoolSlug,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
