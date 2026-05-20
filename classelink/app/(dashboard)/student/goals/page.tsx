import { getMyGoals, createGoal, updateGoalProgress, deleteGoal } from '@/actions/student-gamification'
import { PageHeader } from '@/components/ui/page-header'
import { requireRole } from '@/lib/auth/rbac'
import { getTenantPrisma } from '@/lib/db/tenant'

async function createGoalAction(formData: FormData) {
  'use server'
  const title = formData.get('title') as string
  const subjectId = formData.get('subjectId') as string
  const targetValue = parseFloat(formData.get('targetValue') as string)
  const unit = formData.get('unit') as string
  const deadline = formData.get('deadline') as string
  await createGoal(title, subjectId, targetValue, unit, deadline)
}

async function updateGoalAction(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const currentValue = parseFloat(formData.get('currentValue') as string)
  await updateGoalProgress(id, currentValue)
}

export const metadata = { title: 'Objectifs académiques' }

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: 'En cours',  cls: 'bg-blue-100 text-blue-700' },
  ACHIEVED:  { label: 'Atteint !', cls: 'bg-green-100 text-green-700' },
  ABANDONED: { label: 'Abandonné', cls: 'bg-gray-100 text-gray-500' },
}

async function getSubjects() {
  try {
    const session = await requireRole('STUDENT')
    const db = getTenantPrisma(session.user.schemaName) as any
    return db.$queryRaw`SELECT id, name FROM subjects ORDER BY name` as Promise<any[]>
  } catch {
    return []
  }
}

export default async function GoalsPage() {
  const [goals, subjects] = await Promise.all([
    getMyGoals(),
    getSubjects(),
  ])

  const activeGoals = goals.filter((g: any) => g.status === 'ACTIVE')
  const otherGoals = goals.filter((g: any) => g.status !== 'ACTIVE')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Objectifs académiques"
        description="Fixez-vous des objectifs et suivez votre progression. Gagnez 50 XP à chaque objectif atteint !"
      />

      {/* Create goal form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Nouvel objectif</h3>
        <form action={createGoalAction} className="space-y-3">
          <input
            name="title" required placeholder="Ex: Atteindre 15/20 en Maths"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Matière (optionnel)</label>
              <select
                name="subjectId"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Toutes matières</option>
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Unité</label>
              <input
                name="unit" defaultValue="points" placeholder="points, livres..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Valeur cible</label>
              <input
                name="targetValue" type="number" required min={1} step="0.1"
                placeholder="15"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date limite</label>
              <input
                name="deadline" type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <button type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm
                       font-medium rounded-lg transition">
            Créer l&apos;objectif
          </button>
        </form>
      </div>

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">En cours ({activeGoals.length})</h3>
          {activeGoals.map((g: any) => {
            const target = parseFloat(g.target_value)
            const current = parseFloat(g.current_value ?? '0')
            const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
            return (
              <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{g.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {g.subject_name && (
                        <span className="text-xs text-gray-500">{g.subject_name}</span>
                      )}
                      {g.deadline && (
                        <span className="text-xs text-gray-400">
                          📅 {new Date(g.deadline + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0
                    ${STATUS_BADGE[g.status]?.cls ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_BADGE[g.status]?.label ?? g.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{current} / {target} {g.unit}</span>
                    <span className="font-bold text-purple-600">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-purple-500' : 'bg-blue-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Update progress */}
                <form action={updateGoalAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={g.id} />
                  <input
                    type="number" name="currentValue" step="0.1" min={0}
                    defaultValue={current}
                    placeholder="Valeur actuelle"
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button type="submit"
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700
                               text-xs font-medium rounded-lg transition">
                    Mettre à jour
                  </button>
                  <form action={deleteGoal.bind(null, g.id) as any}>
                    <button type="submit"
                      className="p-1.5 text-gray-300 hover:text-red-500 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </form>
                </form>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed/abandoned goals */}
      {otherGoals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400">Historique</h3>
          {otherGoals.map((g: any) => (
            <div key={g.id}
              className={`rounded-xl border px-4 py-3 flex items-center gap-3
                ${g.status === 'ACHIEVED' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
              <span className="text-lg">{g.status === 'ACHIEVED' ? '🏆' : '❌'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${g.status === 'ACHIEVED' ? 'text-green-800' : 'text-gray-500 line-through'}`}>
                  {g.title}
                </p>
                {g.subject_name && (
                  <p className="text-xs text-gray-400">{g.subject_name}</p>
                )}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[g.status]?.cls}`}>
                {STATUS_BADGE[g.status]?.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {goals.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-gray-700 font-medium">Aucun objectif</p>
          <p className="text-sm text-gray-400 mt-1">Fixez-vous des objectifs pour progresser !</p>
        </div>
      )}
    </div>
  )
}
