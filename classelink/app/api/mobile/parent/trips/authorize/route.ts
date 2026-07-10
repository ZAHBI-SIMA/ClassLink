import { NextRequest, NextResponse } from 'next/server'
import { withMobileAuth } from '@/lib/auth/mobile-guard'

export const POST = withMobileAuth(['PARENT'], async (req: NextRequest, { user, tenantDb }) => {
  const body = await req.json().catch(() => null)
  const tripId        = body?.tripId as string | undefined
  const studentId      = body?.studentId as string | undefined
  const authorized     = body?.authorized as boolean | undefined
  const notes          = (body?.notes as string | undefined) ?? null
  const signatureData  = body?.signatureData as string | undefined

  if (!tripId || !studentId || typeof authorized !== 'boolean') {
    return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 })
  }
  if (authorized && !signatureData) {
    return NextResponse.json({ error: 'Une signature est requise pour autoriser la sortie.' }, { status: 400 })
  }

  const check: any[] = await tenantDb.$queryRaw`
    SELECT ps.id FROM parent_students ps
    JOIN parents p ON p.id = ps.parent_id
    WHERE p.user_id = ${user.userId} AND ps.student_id = ${studentId}
    LIMIT 1
  `
  if (!check[0]) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })
  }

  const newStatus = authorized ? 'AUTHORIZED' : 'REFUSED'

  const affected: number = await tenantDb.$executeRaw`
    UPDATE trip_authorizations
    SET status         = ${newStatus},
        signed_at      = NOW(),
        notes          = ${notes},
        signature_data = ${authorized ? signatureData : null},
        updated_at     = NOW()
    WHERE trip_id    = ${tripId}
      AND student_id = ${studentId}
  `
  if (affected === 0) {
    return NextResponse.json({ error: 'Autorisation introuvable pour cet élève et cette sortie.' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
})
