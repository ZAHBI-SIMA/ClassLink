import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getSchemaFromHostname } from '@/lib/db/tenant'

// Routes publiques (pas besoin d'auth)
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/two-factor',
  '/api/auth',
  '/api/webhooks',
  '/_next',
  '/favicon.ico',
  '/icons',
  '/manifest.json',
  '/sw.js',
]

// Routes réservées au Super Admin (schéma public, pas de tenant)
const SUPER_ADMIN_PATHS = ['/super-admin']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

function isSuperAdminPath(pathname: string): boolean {
  return SUPER_ADMIN_PATHS.some(p => pathname.startsWith(p))
}

export default auth(async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''
  const session = (request as any).auth

  // Laisser passer les chemins publics
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Rediriger vers login si non authentifié
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Routes Super Admin : pas de résolution tenant
  if (isSuperAdminPath(pathname)) {
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Résoudre le schéma tenant depuis le hostname
  const schemaName = await getSchemaFromHostname(hostname)

  if (!schemaName) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Injecter le schéma dans les headers pour les Server Components
  const response = NextResponse.next()
  response.headers.set('x-tenant-schema', schemaName)
  response.headers.set('x-hostname', hostname)

  return response
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
