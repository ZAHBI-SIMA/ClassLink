'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { createPlan, updatePlan, deletePlan, togglePlanActive } from '@/actions/super-admin'
import { formatCurrency } from '@/lib/utils'

type Plan = {
  id:           string
  name:         string
  slug:         string
  priceMonthly: number
  priceYearly:  number
  maxStudents:  number
  maxStorageMb: number
  features:     unknown
  isActive:     boolean
}

/* ─── helpers ─────────────────────────────────────────────────── */
function planFeatures(f: unknown): string[] {
  if (Array.isArray(f)) return f.map(String)
  if (typeof f === 'string') {
    try { return JSON.parse(f) } catch { return [f] }
  }
  return []
}

function storageMbLabel(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(0)} Go` : `${mb} Mo`
}

const PLAN_COLORS = [
  { ring: 'ring-blue-500',   bg: 'bg-blue-600',   light: 'bg-blue-50',   text: 'text-blue-700' },
  { ring: 'ring-violet-500', bg: 'bg-violet-600', light: 'bg-violet-50', text: 'text-violet-700' },
  { ring: 'ring-emerald-500',bg: 'bg-emerald-600',light: 'bg-emerald-50',text: 'text-emerald-700' },
  { ring: 'ring-orange-500', bg: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-700' },
]

/* ─── Modal formulaire ────────────────────────────────────────── */
function PlanModal({
  plan,
  onClose,
}: {
  plan?: Plan | null
  onClose: () => void
}) {
  const action      = plan ? updatePlan : createPlan
  const [state, formAction, pending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state, onClose])

  const featuresStr = planFeatures(plan?.features).join('\n')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {plan ? 'Modifier le plan' : 'Créer un plan'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        <form action={formAction} className="p-6 space-y-4">
          {plan && <input type="hidden" name="id" value={plan.id} />}

          {state && !state.success && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom du plan *</label>
              <input name="name" defaultValue={plan?.name} required
                placeholder="ex: Starter"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Slug *</label>
              <input name="slug" defaultValue={plan?.slug} required
                placeholder="ex: starter"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Étudiants max *</label>
              <input name="maxStudents" type="number" defaultValue={plan?.maxStudents ?? 500} required min={1}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prix mensuel (F CFA) *</label>
              <input name="priceMonthly" type="number" defaultValue={plan?.priceMonthly ?? 0} required min={0}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prix annuel (F CFA) *</label>
              <input name="priceYearly" type="number" defaultValue={plan?.priceYearly ?? 0} required min={0}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Stockage (Mo) *</label>
              <input name="maxStorageMb" type="number" defaultValue={plan?.maxStorageMb ?? 1024} required min={100}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fonctionnalités <span className="text-gray-400 font-normal">(une par ligne)</span>
              </label>
              <textarea name="features" rows={5} defaultValue={featuresStr}
                placeholder="Bulletins en ligne&#10;Messagerie parents&#10;Export PDF"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={pending}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {pending ? 'Enregistrement…' : plan ? 'Mettre à jour' : 'Créer le plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Main client component ───────────────────────────────────── */
export function PlansClient({ plans }: { plans: Plan[] }) {
  const [modalOpen, setModalOpen]     = useState(false)
  const [editPlan, setEditPlan]       = useState<Plan | null>(null)
  const [isPending, startTransition]  = useTransition()
  const [actionMsg, setActionMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const openCreate = () => { setEditPlan(null); setModalOpen(true) }
  const openEdit   = (p: Plan) => { setEditPlan(p); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditPlan(null) }

  const handleToggle = (plan: Plan) => {
    startTransition(async () => {
      const res = await togglePlanActive(plan.id, !plan.isActive)
      setActionMsg(res.success
        ? { type: 'ok',  text: `Plan "${plan.name}" ${plan.isActive ? 'désactivé' : 'activé'}.` }
        : { type: 'err', text: res.error ?? 'Erreur' })
      setTimeout(() => setActionMsg(null), 4000)
    })
  }

  const handleDelete = (plan: Plan) => {
    if (!confirm(`Supprimer le plan "${plan.name}" ? Cette action est irréversible.`)) return
    startTransition(async () => {
      const res = await deletePlan(plan.id)
      setActionMsg(res.success
        ? { type: 'ok',  text: `Plan "${plan.name}" supprimé.` }
        : { type: 'err', text: res.error ?? 'Erreur' })
      setTimeout(() => setActionMsg(null), 5000)
    })
  }

  return (
    <>
      {/* Notification flash */}
      {actionMsg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border
          ${actionMsg.type === 'ok'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'}`}>
          {actionMsg.text}
        </div>
      )}

      {/* Bouton créer */}
      <div className="flex justify-end">
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white
                     text-sm font-medium hover:bg-blue-700 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau plan
        </button>
      </div>

      {/* Grille des plans */}
      {plans.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-medium">Aucun plan configuré</p>
          <p className="text-sm mt-1">Créez votre premier plan tarifaire.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {plans.map((plan, i) => {
            const c        = PLAN_COLORS[i % PLAN_COLORS.length]
            const features = planFeatures(plan.features)
            const savings  = plan.priceYearly > 0 && plan.priceMonthly > 0
              ? Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)
              : 0

            return (
              <div key={plan.id}
                className={`relative bg-white rounded-2xl border-2 ${plan.isActive ? c.ring : 'border-gray-200'}
                            flex flex-col transition-shadow hover:shadow-md`}>
                {/* En-tête */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${c.light} flex items-center justify-center`}>
                      <svg className={`w-5 h-5 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'}`}>
                      {plan.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{plan.slug}</p>

                  {/* Prix */}
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(plan.priceMonthly)}
                      </span>
                      <span className="text-xs text-gray-400">/mois</span>
                    </div>
                    {plan.priceYearly > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatCurrency(plan.priceYearly)}/an
                        {savings > 0 && (
                          <span className="ml-1 text-green-600 font-medium">−{savings}%</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Limites */}
                <div className="px-5 pb-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{plan.maxStudents.toLocaleString()} élèves max</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                    <span>{storageMbLabel(plan.maxStorageMb)} stockage</span>
                  </div>
                </div>

                {/* Fonctionnalités */}
                {features.length > 0 && (
                  <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-1.5 flex-1">
                    {features.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="p-4 border-t border-gray-100 flex gap-2">
                  <button onClick={() => openEdit(plan)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs
                               font-medium hover:bg-gray-50 transition">
                    Modifier
                  </button>
                  <button onClick={() => handleToggle(plan)} disabled={isPending}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition
                      ${plan.isActive
                        ? 'border border-orange-300 text-orange-700 hover:bg-orange-50'
                        : 'border border-green-300 text-green-700 hover:bg-green-50'}`}>
                    {plan.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                  <button onClick={() => handleDelete(plan)} disabled={isPending}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs
                               font-medium hover:bg-red-50 transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tableau récapitulatif */}
      {plans.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Comparatif des plans</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Plan', 'Mensuel', 'Annuel', 'Étudiants', 'Stockage', 'Fonctionnalités', 'Statut'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.map(plan => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{plan.name}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(plan.priceMonthly)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(plan.priceYearly)}</td>
                    <td className="px-4 py-3 text-gray-600">{plan.maxStudents.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{storageMbLabel(plan.maxStorageMb)}</td>
                    <td className="px-4 py-3 text-gray-500">{planFeatures(plan.features).length} fonct.</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {plan.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && <PlanModal plan={editPlan} onClose={closeModal} />}
    </>
  )
}
