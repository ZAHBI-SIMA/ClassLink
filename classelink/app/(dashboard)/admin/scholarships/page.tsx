import {
  getScholarships,
  createScholarship,
  updateScholarshipStatus,
  deleteScholarship,
} from '@/actions/scholarships'
import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { PageHeader } from '@/components/ui/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Bourses — MyClassLink' }

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: 'Active',    cls: 'bg-green-100 text-green-800 border-green-200' },
  SUSPENDED: { label: 'Suspendue', cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  EXPIRED:   { label: 'Expirée',   cls: 'bg-gray-100 text-gray-700 border-gray-200' },
}

const SCHOLARSHIP_TYPES = [
  { value: 'MERITE',       label: 'Mérite' },
  { value: 'SOCIAL',       label: 'Social' },
  { value: 'ATHLETIQUE',   label: 'Athlétique' },
  { value: 'ARTISTIQUE',   label: 'Artistique' },
  { value: 'GOUVERNEMENT', label: 'Gouvernement' },
  { value: 'AUTRE',        label: 'Autre' },
]

function formatAmount(amount: number | null, percentage: number | null): string {
  if (amount !== null && amount > 0) {
    return `${Number(amount).toLocaleString('fr-FR')} FCFA`
  }
  if (percentage !== null && percentage > 0) {
    return `${percentage}%`
  }
  return '—'
}

export default async function ScholarshipsPage() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any

  const [scholarships, students, academicYears] = await Promise.all([
    getScholarships(),
    db.$queryRaw`
      SELECT s.id, u.first_name, u.last_name
      FROM students s
      JOIN users u ON u.id = s.user_id
      ORDER BY u.last_name, u.first_name
    ` as Promise<any[]>,
    db.$queryRaw`
      SELECT id, name FROM academic_years ORDER BY start_date DESC
    ` as Promise<any[]>,
  ])

  const totalActive = scholarships.filter((s: any) => s.status === 'ACTIVE').length
  const totalAmount = scholarships
    .filter((s: any) => s.status === 'ACTIVE' && s.amount)
    .reduce((acc: number, s: any) => acc + Number(s.amount), 0)

  async function createAction(formData: FormData) {
    'use server'
    const studentId      = formData.get('student_id')       as string
    const type           = formData.get('type')             as string
    const label          = formData.get('label')            as string
    const amountStr      = formData.get('amount')           as string
    const percentageStr  = formData.get('percentage')       as string
    const reason         = formData.get('reason')           as string
    const academicYearId = formData.get('academic_year_id') as string

    const amount     = amountStr     ? parseFloat(amountStr)     : null
    const percentage = percentageStr ? parseFloat(percentageStr) : null

    await createScholarship(studentId, type, label, amount, percentage, reason, academicYearId)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bourses & Aides"
        description="Gérer les bourses et aides financières accordées aux élèves"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-700">{totalActive}</p>
          <p className="text-xs font-medium text-green-600 mt-0.5">Bourses actives</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-700">
            {totalAmount > 0 ? `${totalAmount.toLocaleString('fr-FR')} FCFA` : '—'}
          </p>
          <p className="text-xs font-medium text-blue-600 mt-0.5">Montant total actif</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de création */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Nouvelle bourse</h3>
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
                  {SCHOLARSHIP_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Libellé */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Libellé *</label>
                <input
                  name="label"
                  type="text"
                  required
                  placeholder="Ex : Bourse d'excellence 2024"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Montant */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Montant (FCFA)</label>
                <input
                  name="amount"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="Ex : 50000"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Pourcentage */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pourcentage (%)</label>
                <input
                  name="percentage"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="Ex : 50"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Remplir montant OU pourcentage</p>
              </div>

              {/* Motif */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motif</label>
                <textarea
                  name="reason"
                  rows={2}
                  placeholder="Justificatif de la bourse…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Année scolaire */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Année scolaire *</label>
                <select
                  name="academic_year_id"
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choisir une année…</option>
                  {academicYears.map((ay: any) => (
                    <option key={ay.id} value={ay.id}>{ay.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                Créer la bourse
              </button>
            </form>
          </div>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                Liste des bourses{' '}
                <span className="text-gray-400 font-normal">({scholarships.length})</span>
              </h3>
            </div>

            {scholarships.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-12">
                Aucune bourse enregistrée.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {scholarships.map((sc: any) => {
                  const statusCfg = STATUS_CFG[sc.status] ?? STATUS_CFG.ACTIVE
                  const nextStatus = sc.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
                  const nextLabel  = sc.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'

                  return (
                    <div key={sc.id} className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {sc.student_last_name} {sc.student_first_name}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusCfg.cls}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 font-medium">{sc.label}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="font-medium">{formatAmount(sc.amount, sc.percentage)}</span>
                          <span>· {sc.type}</span>
                          <span>· {sc.academic_year_name}</span>
                        </div>
                        {sc.reason && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{sc.reason}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {sc.status !== 'EXPIRED' && (
                          <form
                            action={async () => {
                              'use server'
                              await updateScholarshipStatus(sc.id, nextStatus)
                            }}
                          >
                            <button
                              type="submit"
                              className={`text-xs px-2 py-1 rounded border transition ${
                                sc.status === 'ACTIVE'
                                  ? 'border-yellow-200 text-yellow-700 hover:bg-yellow-50'
                                  : 'border-green-200 text-green-700 hover:bg-green-50'
                              }`}
                            >
                              {nextLabel}
                            </button>
                          </form>
                        )}
                        <form
                          action={async () => {
                            'use server'
                            await deleteScholarship(sc.id)
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
