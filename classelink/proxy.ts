import { auth } from '@/lib/auth/edge-config'
import { NextRequest, NextResponse } from 'next/server'

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
  '/enroll',
]

// Routes réservées au Super Admin
const SUPER_ADMIN_PATHS = ['/super-admin']

// Redirection par rôle
const ROLE_DEFAULT_PATHS: Record<string, string> = {
  SUPER_ADMIN: '/super-admin',
  ADMIN:       '/admin',
  CENSOR:      '/admin',
  ACCOUNTANT:  '/admin',
  TEACHER:     '/teacher',
  STUDENT:     '/student',
  PARENT:      '/parent',
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

function isSuperAdminPath(pathname: string): boolean {
  return SUPER_ADMIN_PATHS.some(p => pathname.startsWith(p))
}

export default auth(function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''
  const session = (request as any).auth

  // Laisser passer les routes publiques
  if (isPublicPath(pathname)) {
    // Si déjà connecté et tente d'accéder au login, rediriger vers le dashboard
    if (pathname === '/login' && session?.user) {
      const role = session.user.role as string
      const dest = ROLE_DEFAULT_PATHS[role] ?? '/admin'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  // Pas connecté → login
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(pathname))
    return NextResponse.redirect(loginUrl)
  }

  // 2FA obligatoire : si activé et cookie de vérification absent → /two-factor
  if (session.user.twoFactorEnabled && pathname !== '/two-factor') {
    const twoFaVerified = request.cookies.get('2fa_verified')?.value
    if (!twoFaVerified || !twoFaVerified.startsWith(session.user.id)) {
      return NextResponse.redirect(new URL('/two-factor', request.url))
    }
  }

  // Super Admin : uniquement /super-admin
  if (isSuperAdminPath(pathname)) {
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Racine → rediriger vers le dashboard du rôle
  if (pathname === '/') {
    const role = session.user.role as string
    const dest = ROLE_DEFAULT_PATHS[role] ?? '/admin'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  const response = NextResponse.next()
  response.headers.set('x-hostname', hostname)
  return response
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
