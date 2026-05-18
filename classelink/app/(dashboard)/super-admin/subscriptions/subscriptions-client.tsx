'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { updateSubscription, recordManualPayment } from '@/actions/super-admin'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { PaginatedResult } from '@/types'

type Subscription = {
  id:                 string
  billing:            'MONTHLY' | 'YEARLY'
  status:             string
  currentPeriodStart: string | Date | null
  currentPeriodEnd:   string | Date | null
  cancelAtPeriodEnd:  boolean
  promoCode:          string | null
  discountPercent:    number | null
  school: { id: string; name: string; status: string; adminEmail: string }
  plan:   { id: string; name: string; priceMonthly: number; priceYearly: number }
  payments: { id: string; amount: number; status: string; createdAt: string | Date }[]
}

type Stats = { active: number; pastDue: number; cancelled: number; trialing: number }
type Plan  = { id: string; name: string }

/* ─── Badge abonnement ─────────────────────────────────────────── */
const SUB_STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: 'Actif',        cls: 'bg-green-100 text-green-700 border-green-200' },
  PAST_DUE:  { label: 'Impayé',       cls: 'bg-red-100 text-red-700 border-red-200' },
  CANCELLED: { label: 'Résilié',      cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  TRIALING:  { label: 'Essai',        cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
}

function SubStatusBadge({ status }: { status: string }) {
  const cfg = SUB_STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

/* ─── Modal : modifier abonnement ─────────────────────────────── */
function EditSubModal({ sub, plans, onClose }: { sub: Subscription; plans: Plan[]; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(updateSubscription, null)
  useEffect(() => { if (state?.success) onClose() }, [state, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Modifier l'abonnement</h3>
            <p className="text-xs text-gray-400 mt-0.5">{sub.school.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        <form action={formAction} className="p-6 space-y-4">
          <input type="hidden" name="id" value={sub.id} />

          {state && !state.success && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
            <select name="planId" defaultValue={sub.plan.id}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Facturation</label>
            <select name="billing" defaultValue={sub.billing}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="MONTHLY">Mensuelle</option>
              <option value="YEARLY">Annuelle</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
            <select name="status" defaultValue={sub.status}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ACTIVE">Actif</option>
              <option value="PAST_DUE">Impayé</option>
              <option value="CANCELLED">Résilié</option>
              <option value="TRIALING">Essai</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Remise (%)</label>
              <input name="discountPercent" type="number" min={0} max={100} step={1}
                defaultValue={sub.discountPercent ?? 0}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code promo</label>
              <input name="promoCode" type="text" defaultValue={sub.promoCode ?? ''}
                placeholder="optionnel"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={pending}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {pending ? 'Enregistrement…' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Modal : enregistrer un paiement ─────────────────────────── */
function PaymentModal({ sub, onClose }: { sub: Subscription; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(recordManualPayment, null)
  useEffect(() => { if (state?.success) onClose() }, [state, onClose])

  const suggestedAmount = sub.billing === 'YEARLY' ? sub.plan.priceYearly : sub.plan.priceMonthly

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Enregistrer un paiement</h3>
            <p className="text-xs text-gray-400 mt-0.5">{sub.school.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        <form action={formAction} className="p-6 space-y-4">
          <input type="hidden" name="subscriptionId" value={sub.id} />

          {state && !state.success && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Montant (F CFA) *</label>
            <input name="amount" type="number" min={1} required defaultValue={suggestedAmount}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-400 mt-1">
              Plan {sub.plan.name} · {sub.billing === 'YEARLY' ? 'annuel' : 'mensuel'} → {formatCurrency(suggestedAmount)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mode de paiement</label>
              <select name="provider"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="MANUEL">Manuel / Virement</option>
                <option value="CINETPAY">CinetPay</option>
                <option value="WAVE">Wave</option>
                <option value="ORANGE_MONEY">Orange Money</option>
                <option value="MTN_MONEY">MTN Money</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Référence</label>
              <input name="providerRef" type="text" placeholder="Optionnelle"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={pending}
              className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60">
              {pending ? 'Enregistrement…' : 'Confirmer le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Modal : historique paiements ────────────────────────────── */
function PaymentsHistoryModal({ sub, onClose }: { sub: Subscription; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Historique des paiements</h3>
            <p className="text-xs text-gray-400 mt-0.5">{sub.school.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>
        <div className="p-6">
          {sub.payments.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">Aucun paiement enregistré</p>
          ) : (
            <div className="space-y-2">
              {sub.payments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
                  </div>
                  <StatusBadge status={p.status} size="sm" />
                </div>
              ))}
            </div>
          )}
          <button onClick={onClose}
            className="mt-4 w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Composant principal ──────────────────────────────────────── */
export function SubscriptionsClient({
  result,
  stats,
  plans,
  currentFilters,
}: {
  result:         PaginatedResult<Subscription>
  stats:          Stats
  plans:          Plan[]
  currentFilters: { page?: string; status?: string; planId?: string; search?: string }
}) {
  const [modal, setModal] = useState<{ type: 'edit' | 'pay' | 'history'; sub: Subscription } | null>(null)

  const statCards = [
    { label: 'Actifs',   value: stats.active,    cls: 'text-green-700 bg-green-50 border-green-200' },
    { label: 'Impayés',  value: stats.pastDue,   cls: 'text-red-700 bg-red-50 border-red-200' },
    { label: 'Essais',   value: stats.trialing,  cls: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
    { label: 'Résiliés', value: stats.cancelled, cls: 'text-gray-600 bg-gray-50 border-gray-200' },
  ]

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const merged = { ...currentFilters, ...overrides }
    const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
    return qs ? `?${qs}` : ''
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.cls}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={currentFilters.search}
          placeholder="Rechercher une école…"
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
        />
        <select name="status" defaultValue={currentFilters.status ?? ''}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="PAST_DUE">Impayé</option>
          <option value="TRIALING">Essai</option>
          <option value="CANCELLED">Résilié</option>
        </select>
        <select name="planId" defaultValue={currentFilters.planId ?? ''}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Tous les plans</option>
          {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button type="submit"
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition">
          Filtrer
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {result.data.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">Aucun abonnement trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['École', 'Plan', 'Facturation', 'Statut', 'Période', 'Dernier paiement', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.data.map((sub) => {
                  const lastPayment = sub.payments[0]
                  const isExpiringSoon = sub.currentPeriodEnd
                    && new Date(sub.currentPeriodEnd).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 transition">
                      {/* École */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center
                                          text-blue-700 font-bold text-sm flex-shrink-0">
                            {sub.school.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link href={`/super-admin/schools/${sub.school.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600 transition">
                              {sub.school.name}
                            </Link>
                            <p className="text-xs text-gray-400">{sub.school.adminEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{sub.plan.name}</p>
                        <p className="text-xs text-gray-400">
                          {formatCurrency(sub.billing === 'YEARLY' ? sub.plan.priceYearly : sub.plan.priceMonthly)}
                          /{sub.billing === 'YEARLY' ? 'an' : 'mois'}
                        </p>
                      </td>

                      {/* Facturation */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                          ${sub.billing === 'YEARLY'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'}`}>
                          {sub.billing === 'YEARLY' ? 'Annuelle' : 'Mensuelle'}
                        </span>
                        {sub.discountPercent && sub.discountPercent > 0 ? (
                          <p className="text-xs text-green-600 mt-0.5">−{sub.discountPercent}%</p>
                        ) : null}
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3">
                        <SubStatusBadge status={sub.status} />
                      </td>

                      {/* Période */}
                      <td className="px-4 py-3">
                        {sub.currentPeriodEnd ? (
                          <div>
                            <p className={`text-xs font-medium ${isExpiringSoon ? 'text-orange-600' : 'text-gray-700'}`}>
                              Expire le {formatDate(sub.currentPeriodEnd)}
                            </p>
                            {isExpiringSoon && (
                              <p className="text-xs text-orange-500">⚠ Dans moins de 7 jours</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Dernier paiement */}
                      <td className="px-4 py-3">
                        {lastPayment ? (
                          <div>
                            <p className="text-xs font-medium text-gray-900">{formatCurrency(lastPayment.amount)}</p>
                            <p className="text-xs text-gray-400">{formatDate(lastPayment.createdAt)}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Aucun</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setModal({ type: 'edit', sub })}
                            title="Modifier"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => setModal({ type: 'pay', sub })}
                            title="Enregistrer paiement"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-700 transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </button>
                          <button onClick={() => setModal({ type: 'history', sub })}
                            title="Historique"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {result.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {result.page} sur {result.totalPages} · {result.total} résultats
            </p>
            <div className="flex gap-2">
              {result.page > 1 && (
                <Link href={buildQuery({ page: String(result.page - 1) })}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-50">
                  ← Précédent
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link href={buildQuery({ page: String(result.page + 1) })}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-50">
                  Suivant →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'edit'    && <EditSubModal      sub={modal.sub} plans={plans} onClose={() => setModal(null)} />}
      {modal?.type === 'pay'     && <PaymentModal      sub={modal.sub} onClose={() => setModal(null)} />}
      {modal?.type === 'history' && <PaymentsHistoryModal sub={modal.sub} onClose={() => setModal(null)} />}
    </>
  )
}
