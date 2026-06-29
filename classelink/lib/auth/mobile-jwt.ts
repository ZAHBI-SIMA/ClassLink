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
  type:       'access' | 'refresh'
  iat?:       number
  exp?:       number
}

export async function signMobileToken(payload: Omit<MobileJWTPayload, 'type'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function signMobileRefreshToken(payload: Pick<MobileJWTPayload, 'userId' | 'schemaName' | 'schoolId'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

async function verifyMobileToken(token: string): Promise<MobileJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as MobileJWTPayload
  } catch {
    return null
  }
}

export async function verifyMobileAccessToken(token: string): Promise<MobileJWTPayload | null> {
  const payload = await verifyMobileToken(token)
  if (!payload || payload.type !== 'access') return null
  return payload
}

export async function verifyMobileRefreshToken(token: string): Promise<Pick<MobileJWTPayload, 'userId' | 'schemaName' | 'schoolId'> | null> {
  const payload = await verifyMobileToken(token)
  if (!payload || payload.type !== 'refresh') return null
  return { userId: payload.userId, schemaName: payload.schemaName, schoolId: payload.schoolId }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
