import { SignJWT, jwtVerify } from 'jose'

function getSecret(): Uint8Array {
  const s = process.env.MOBILE_JWT_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('MOBILE_JWT_SECRET ou NEXTAUTH_SECRET doit être défini.')
  return new TextEncoder().encode(s)
}

export interface MobileJWTPayload {
  userId:     string
  role:       string
  schemaName: string
  schoolId:   string
  iat?:       number
  exp?:       number
}

export async function signMobileToken(payload: MobileJWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function signMobileRefreshToken(payload: Pick<MobileJWTPayload, 'userId' | 'schemaName' | 'schoolId'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifyMobileToken(token: string): Promise<MobileJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as MobileJWTPayload
  } catch {
    return null
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
