import { getAgendaEvents, deleteAgendaEvent } from '@/actions/agenda'
import { getSubjects } from '@/actions/admin'
import { requireRole } from '@/lib/auth/rbac'
import { getTenantPrisma } from '@/lib/db/tenant'
import { PageHeader } from '@/components/ui/page-header'
import { AgendaForm } from './agenda-form'

export const metadata = { title: 'Agenda scolaire' }

interface Props {
  searchParams: Promise<{ month?: string }>
}

const EVENT_STYLE: Record<string, { label: string; cls: string }> = {
  EXAM:     { label: 'Examen',     cls: 'bg-red-100 text-red-800' },
  HOLIDAY:  { label: 'Vacances',   cls: 'bg-green-100 text-green-800' },
  MEETING:  { label: 'Réunion',    cls: 'bg-purple-100 text-purple-800' },
  ACTIVITY: { label: 'Activité',   cls: 'bg-blue-100 text-blue-800' },
  DEADLINE: { label: 'Échéance',   cls: 'bg-orange-100 text-orange-800' },
  GENERAL:  { label: 'Général',    cls: 'bg-gray-100 text-gray-700' },
}

function currentMonth() { return new Date().toISOString().slice(0, 7) }
function prevMonth(m: string) { const d = new Date(m + '-01'); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7) }
function nextMonth(m: string) { const d = new Date(m + '-01'); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 7) }

async function getClasses() {
  try {
    const session = await requireRole('ADMIN', 'CENSOR')
    const db = getTenantPrisma(session.user.schemaName) as any
    return db.$queryRaw`
      SELECT c.id, c.name FROM classes c
      JOIN academic_years ay ON ay.id = c.academic_year_id AND ay.is_current = TRUE
      ORDER BY c.name
    ` as Promise<any[]>
  } catch { return [] }
}

export default async function AgendaPage({ searchParams }: Props) {
  const { month: rawMonth } = await searchParams
  const month = rawMonth ?? currentMonth()

  const [events, classes, subjects] = await Promise.all([
    getAgendaEvents(month),
    getClasses(),
    getSubjects(),
  ])

  const monthLabel = new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const byDate: Record<string, any[]> = {}
  for (const ev of events) {
    const key = String(ev.start_date).slice(0, 10)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(ev)
  }
  const sortedDates = Object.keys(byDate).sort()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda scolaire"
        description="Gérez les événements scolaires visibles par tous les parents et élèves."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Nouvel événement</h3>
          <AgendaForm classes={classes} subjects={subjects as any} />
        </div>

        {/* Calendar view */}
        <div className="lg:col-span-2 space-y-4">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <a href={`/admin/agenda?month=${prevMonth(month)}`}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              ← Précédent
            </a>
            <h2 className="text-base font-semibold text-gray-900 capitalize">{monthLabel}</h2>
            <a href={`/admin/agenda?month=${nextMonth(month)}`}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Suivant →
            </a>
          </div>

          {sortedDates.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <p className="text-gray-400 text-sm">Aucun événement ce mois</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedDates.map(date => {
                const dayEvents = byDate[date]
                const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })
                return (
                  <div key={date}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 capitalize">
                      {dayLabel}
                    </p>
                    <div className="space-y-1.5">
                      {dayEvents.map((ev: any) => {
                        const style = EVENT_STYLE[ev.event_type] ?? EVENT_STYLE.GENERAL
                        return (
                          <div key={ev.id}
                            className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-start gap-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${style.cls}`}>
                              {style.label}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                                {(ev.start_time || ev.end_time) && (
                                  <span>{ev.start_time}{ev.end_time ? ` – ${ev.end_time}` : ''}</span>
                                )}
                                {ev.class_name && <span>· {ev.class_name}</span>}
                                {ev.all_classes && <span>· Toutes les classes</span>}
                                {ev.subject_name && <span>· {ev.subject_name}</span>}
                                {ev.room && <span>· {ev.room}</span>}
                                {ev.exam_id && <span>· Coeff. {parseFloat(ev.coefficient)} · /{parseFloat(ev.max_value)}</span>}
                              </div>
                              {ev.description && (
                                <p className="text-xs text-gray-500 mt-1">{ev.description}</p>
                              )}
                            </div>
                            <form action={deleteAgendaEvent.bind(null, ev.id) as any} className="flex-shrink-0">
                              <button type="submit"
                                className="p-1 text-gray-300 hover:text-red-500 transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </form>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
