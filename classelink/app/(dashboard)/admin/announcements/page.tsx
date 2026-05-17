import { getAnnouncementsAdmin } from '@/actions/announcements'
import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { CreateAnnouncementForm } from './create-form'
import { AnnouncementActions } from './announcement-actions'

export const metadata = { title: 'Annonces' }

async function getClasses(schemaName: string) {
  const db = getTenantPrisma(schemaName) as any
  return db.$queryRaw`SELECT id, name FROM classes ORDER BY name` as Promise<any[]>
}

const ROLE_LABELS: Record<string, string> = {
  TEACHER: 'Enseignants',
  PARENT: 'Parents',
  STUDENT: 'Élèves',
  ADMIN: 'Administration',
}

export default async function AnnouncementsPage() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const [announcements, classes] = await Promise.all([
    getAnnouncementsAdmin(),
    getClasses(session.user.schemaName),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Annonces</h1>
        <p className="text-sm text-gray-500 mt-1">Gérez les annonces diffusées à la communauté scolaire.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3 flex-shrink-0">
          <CreateAnnouncementForm classes={classes} />
        </div>

        <div className="lg:w-2/3">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Toutes les annonces
                <span className="ml-2 text-sm font-normal text-gray-400">({announcements.length})</span>
              </h2>
            </div>

            {announcements.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                Aucune annonce pour le moment.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {announcements.map((a: any) => {
                  const isExpired = a.expires_at && new Date(a.expires_at) < new Date()
                  const roles: string[] = Array.isArray(a.target_roles) ? a.target_roles : []

                  return (
                    <div key={a.id} className={`p-5 ${isExpired ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {a.is_pinned && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                Épinglé
                              </span>
                            )}
                            {isExpired && (
                              <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                Expiré
                              </span>
                            )}
                            {roles.map(r => (
                              <span key={r} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {ROLE_LABELS[r] ?? r}
                              </span>
                            ))}
                          </div>

                          <h3 className="text-sm font-semibold text-gray-900">{a.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.content}</p>

                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span>
                              {a.author_first_name} {a.author_last_name}
                            </span>
                            <span>·</span>
                            <span>
                              {new Date(a.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })}
                            </span>
                            {a.expires_at && (
                              <>
                                <span>·</span>
                                <span>Expire le {new Date(a.expires_at).toLocaleDateString('fr-FR')}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <AnnouncementActions id={a.id} isPinned={!!a.is_pinned} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
