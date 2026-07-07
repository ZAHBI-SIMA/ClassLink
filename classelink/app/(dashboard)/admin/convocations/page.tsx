import {
  getConvocations,
  createConvocation,
  updateConvocationStatus,
  deleteConvocation,
} from '@/actions/convocations'
import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { PageHeader } from '@/components/ui/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Convocations — MyClassLink' }

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'En attente',  cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  CONFIRMED: { label: 'Confirmée',  cls: 'bg-green-100 text-green-800 border-green-200' },
  COMPLETED: { label: 'Terminée',   cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  CANCELLED: { label: 'Annulée',    cls: 'bg-red-100 text-red-700 border-red-200' },
}

const TYPE_CFG: Record<string, { label: string; cls: string }> = {
  DISCIPLINAIRE: { label: 'Disciplinaire', cls: 'bg-red-100 text-red-700 border-red-200' },
  ACADEMIQUE:    { label: 'Académique',    cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  ADMINISTRATIF: { label: 'Administratif', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  AUTRE:         { label: 'Autre',         cls: 'bg-gray-100 text-gray-700 border-gray-200' },
}

const CONVOCATION_TYPES = [
  { value: 'DISCIPLINAIRE', label: 'Disciplinaire' },
  { value: 'ACADEMIQUE',    label: 'Académique' },
  { value: 'ADMINISTRATIF', label: 'Administratif' },
  { value: 'AUTRE',         label: 'Autre' },
]

function formatDateTime(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function ConvocationsPage() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any

  const [convocations, students, parents] = await Promise.all([
    getConvocations(),
    db.$queryRaw`
      SELECT s.id, u.first_name, u.last_name
      FROM students s
      JOIN users u ON u.id = s.user_id
      ORDER BY u.last_name, u.first_name
    ` as Promise<any[]>,
    db.$queryRaw`
      SELECT p.id, u.first_name, u.last_name
      FROM parents p
      JOIN users u ON u.id = p.user_id
      ORDER BY u.last_name, u.first_name
    ` as Promise<any[]>,
  ])

  const total     = convocations.length
  const pending   = convocations.filter((c: any) => c.status === 'PENDING').length
  const confirmed = convocations.filter((c: any) => c.status === 'CONFIRMED').length
  const completed = convocations.filter((c: any) => c.status === 'COMPLETED').length

  async function createAction(formData: FormData) {
    'use server'
    const studentId   = formData.get('student_id')   as string
    const parentId    = formData.get('parent_id')    as string | null
    const type        = formData.get('type')          as string
    const reason      = formData.get('reason')        as string
    const scheduledAt = formData.get('scheduled_at')  as string
    const location    = formData.get('location')      as string

    await createConvocation(studentId, parentId || null, type, reason, scheduledAt, location)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Convocations"
        description="Gérer les convocations des élèves et parents"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',      value: total,     cls: 'bg-gray-50 border-gray-200 text-gray-700' },
          { label: 'En attente', value: pending,   cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Confirmées', value: confirmed, cls: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Terminées',  value: completed, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl border p-4 ${stat.cls}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de création */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Nouvelle convocation</h3>
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

              {/* Parent (optionnel) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Parent (optionnel)</label>
                <select
                  name="parent_id"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Aucun</option>
                  {parents.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.last_name} {p.first_name}
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
                  {CONVOCATION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Motif */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motif *</label>
                <textarea
                  name="reason"
                  rows={3}
                  required
                  placeholder="Motif de la convocation…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Date & heure */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date et heure *</label>
                <input
                  name="scheduled_at"
                  type="datetime-local"
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Lieu */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lieu *</label>
                <input
                  name="location"
                  type="text"
                  required
                  placeholder="Ex : Bureau du censeur"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                Créer la convocation
              </button>
            </form>
          </div>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                Liste des convocations{' '}
                <span className="text-gray-400 font-normal">({convocations.length})</span>
              </h3>
            </div>

            {convocations.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-12">
                Aucune convocation enregistrée.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {convocations.map((c: any) => {
                  const statusCfg = STATUS_CFG[c.status] ?? STATUS_CFG.PENDING
                  const typeCfg   = TYPE_CFG[c.type]     ?? TYPE_CFG.AUTRE
                  return (
                    <div key={c.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-gray-900 text-sm">
                              {c.student_last_name} {c.student_first_name}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeCfg.cls}`}>
                              {typeCfg.label}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusCfg.cls}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{c.reason}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span>{formatDateTime(c.scheduled_at)}</span>
                            {c.location && <span>· {c.location}</span>}
                            {c.parent_last_name && (
                              <span>· Parent: {c.parent_last_name} {c.parent_first_name}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                          {c.status === 'PENDING' && (
                            <form
                              action={async () => {
                                'use server'
                                await updateConvocationStatus(c.id, 'CONFIRMED')
                              }}
                            >
                              <button
                                type="submit"
                                className="text-xs px-2 py-1 rounded border border-green-200 text-green-700 hover:bg-green-50 transition"
                              >
                                Confirmer
                              </button>
                            </form>
                          )}
                          {c.status === 'CONFIRMED' && (
                            <form
                              action={async () => {
                                'use server'
                                await updateConvocationStatus(c.id, 'COMPLETED')
                              }}
                            >
                              <button
                                type="submit"
                                className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 transition"
                              >
                                Terminer
                              </button>
                            </form>
                          )}
                          {(c.status === 'PENDING' || c.status === 'CONFIRMED') && (
                            <form
                              action={async () => {
                                'use server'
                                await updateConvocationStatus(c.id, 'CANCELLED')
                              }}
                            >
                              <button
                                type="submit"
                                className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition"
                              >
                                Annuler
                              </button>
                            </form>
                          )}
                          <form
                            action={async () => {
                              'use server'
                              await deleteConvocation(c.id)
                            }}
                          >
                            <button
                              type="submit"
                              className="text-xs px-2 py-1 rounded border border-gray-200 text-red-500 hover:bg-red-50 transition"
                            >
                              Supprimer
                            </button>
                          </form>
                        </div>
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
