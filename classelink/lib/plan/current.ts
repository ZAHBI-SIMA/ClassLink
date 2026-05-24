import 'server-only'
import { cache } from 'react'
import { publicPrisma } from '@/lib/db/public'

export interface SchoolPlanInfo {
  schoolId: string
  schoolName: string
  status: string          // SchoolStatus
  planSlug: string | null
  planName: string | null
  maxStudents: number | null
}

/**
 * Récupère le forfait et le statut de l'école à partir de son schemaName.
 * Mis en cache pour la durée de la requête (React cache).
 */
export const getSchoolPlanBySchema = cache(
  async (schemaName: string): Promise<SchoolPlanInfo | null> => {
    if (!schemaName || schemaName === '__super_admin__') return null
    const db = publicPrisma as any
    const school = await db.school.findUnique({
      where: { schemaName },
      select: {
        id: true,
        name: true,
        status: true,
        plan: { select: { slug: true, name: true, maxStudents: true } },
      },
    })
    if (!school) return null
    return {
      schoolId: school.id,
      schoolName: school.name,
      status: school.status,
      planSlug: school.plan?.slug ?? null,
      planName: school.plan?.name ?? null,
      maxStudents: school.plan?.maxStudents ?? null,
    }
  }
)
