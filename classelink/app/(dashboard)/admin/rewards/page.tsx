import { getRewards, createReward, deleteReward } from '@/actions/rewards'
import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { PageHeader } from '@/components/ui/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Récompenses — MyClassLink' }

const TYPE_CFG: Record<string, { label: string; cls: string }> = {
  FELICITATIONS:   { label: 'Félicitations',     cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  ENCOURAGEMENTS:  { label: 'Encouragements',    cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  TABLEAU_HONNEUR: { label: 'Tableau d\'honneur', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  PRIX:            { label: 'Prix',              cls: 'bg-green-100 text-green-800 border-green-200' },
  MENTION:         { label: 'Mention',           cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  AUTRE:           { label: 'Autre',             cls: 'bg-gray-100 text-gray-700 border-gray-200' },
}

const REWARD_TYPES = [
  { value: 'FELICITATIONS',   label: 'Félicitations' },
  { value: 'ENCOURAGEMENTS',  label: 'Encouragements' },
  { value: 'TABLEAU_HONNEUR', label: 'Tableau d\'honneur' },
  { value: 'PRIX',            label: 'Prix' },
  { value: 'MENTION',         label: 'Mention' },
  { value: 'AUTRE',           label: 'Autre' },
]

function formatDate(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function RewardsPage() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any

  const [rewards, students, terms] = await Promise.all([
    getRewards(),
    db.$queryRaw`
      SELECT s.id, u.first_name, u.last_name
      FROM students s
      JOIN users u ON u.id = s.user_id
      ORDER BY u.last_name, u.first_name
    ` as Promise<any[]>,
    db.$queryRaw`
      SELECT id, name FROM terms ORDER BY term_order ASC
    ` as Promise<any[]>,
  ])

  async function createAction(formData: FormData) {
    'use server'
    const studentId   = formData.get('student_id')   as string
    const type        = formData.get('type')          as string
    const title       = formData.get('title')         as string
    const description = formData.get('description')   as string ?? ''
    const date        = formData.get('date')          as string
    const termId      = formData.get('term_id')       as string | undefined

    await createReward(studentId, type, title, description, date, termId || undefined)
  }

  return (
    <div>
      <PageHeader
        title="Récompenses"
        description="Gérer les récompenses et distinctions des élèves"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de création */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Nouvelle récompense</h3>
            <form action={createAction} className="space-y-4">
              {/* Élève */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Élève *</label>
                <select
                  name="student_id"
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choisir un élève…</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.last_name} {s.first_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                <select
                  name="type"
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choisir un type…</option>
                  {REWARD_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Titre */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Ex : 1er prix de mathématiques"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description (optionnel)</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Détails supplémentaires…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                <input
                  name="date"
                  type="date"
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Trimestre (optionnel) */}
              {terms.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Trimestre (optionnel)</label>
                  <select
                    name="term_id"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Aucun</option>
                    {terms.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                Enregistrer la récompense
              </button>
            </form>
          </div>
        </div>

        {/* Liste des récompenses */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                Liste des récompenses{' '}
                <span className="text-gray-400 font-normal">({rewards.length})</span>
              </h3>
            </div>

            {rewards.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-12">
                Aucune récompense enregistrée.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {rewards.map((r: any) => {
                  const cfg = TYPE_CFG[r.type] ?? TYPE_CFG.AUTRE
                  return (
                    <div key={r.id} className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {r.student_last_name} {r.student_first_name}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 font-medium">{r.title}</p>
                        {r.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{formatDate(r.date)}</span>
                          {r.term_name && <span>· {r.term_name}</span>}
                          <span>· Par {r.issuer_first_name} {r.issuer_last_name}</span>
                        </div>
                      </div>
                      <form
                        action={async () => {
                          'use server'
                          await deleteReward(r.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition flex-shrink-0"
                        >
                          Supprimer
                        </button>
                      </form>
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
