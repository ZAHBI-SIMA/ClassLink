import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/db/tenant'

export async function GET() {
  const session = await auth()
  const user = session?.user as any

  if (!user || !['ADMIN', 'CENSOR', 'ACCOUNTANT'].includes(user.role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const db = getTenantPrisma(user.schemaName) as any
    const classes = await db.$queryRaw`
      SELECT c.id, c.name, l.name AS level_name
      FROM classes c
      JOIN levels l ON l.id = c.level_id
      JOIN academic_years ay ON ay.id = c.academic_year_id
      WHERE ay.is_current = TRUE
      ORDER BY l.level_order, c.name
    `
    return NextResponse.json(classes)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
