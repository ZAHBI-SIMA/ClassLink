import { NextRequest, NextResponse } from 'next/server'
import { withMobileAuth } from '@/lib/auth/mobile-guard'
import { Prisma } from '@prisma/client'

export const GET = withMobileAuth(['STUDENT', 'PARENT'], async (req, { user, tenantDb }) => {
  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart')

  const weekFilter = weekStart
    ? Prisma.sql`${weekStart}::date`
    : Prisma.sql`date_trunc('week', NOW())::date`

  const menus: any[] = await tenantDb.$queryRaw`
    SELECT id, week_start, day_of_week, meal_type, description, price
    FROM cafeteria_menus
    WHERE week_start = ${weekFilter}
    ORDER BY day_of_week, meal_type
  `

  // Abonnement de l'élève
  const studentSub: any[] = await tenantDb.$queryRawUnsafe(`
    SELECT cs.id, cs.meal_type, cs.status, cs.start_date, cs.amount_paid
    FROM cafeteria_subscriptions cs
    JOIN students s ON s.id = cs.student_id
    WHERE s.user_id = '${user.userId}'
      AND cs.status = 'ACTIVE'
    LIMIT 1
  `)

  return NextResponse.json({
    menus: menus.map(m => ({
      id:         m.id,
      weekStart:  m.week_start,
      dayOfWeek:  m.day_of_week,
      mealType:   m.meal_type,
      description:m.description,
      price:      parseFloat(m.price ?? 0),
    })),
    subscription: studentSub[0] ?? null,
  })
})
