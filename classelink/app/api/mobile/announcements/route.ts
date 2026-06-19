import { NextRequest, NextResponse } from 'next/server'
import { withMobileAuth } from '@/lib/auth/mobile-guard'

export const GET = withMobileAuth(['STUDENT', 'PARENT'], async (_req, { tenantDb }) => {
  const rows: any[] = await tenantDb.$queryRaw`
    SELECT
      a.id, a.title, a.content, a.type, a.created_at,
      u.first_name || ' ' || u.last_name AS author_name
    FROM announcements a
    JOIN users u ON u.id = a.author_id
    WHERE a.is_published = true
    ORDER BY a.created_at DESC
    LIMIT 50
  `

  return NextResponse.json({
    announcements: rows.map(r => ({
      id:         r.id,
      title:      r.title,
      content:    r.content,
      type:       r.type,
      createdAt:  r.created_at,
      authorName: r.author_name,
    })),
  })
})
