'use client'

import { useActionState, useTransition } from 'react'
import { saveAlertRule, runAlertCheck } from '@/actions/alerts'
import type { ActionResult } from '@/types'

const RULE_META: Record<string, { title: string; unit: string; description: string }> = {
  ABSENCE_THRESHOLD: {
    title: 'Seuil d\'absences',
    unit: 'absences',
    description: 'Déclenche une alerte quand un élève dépasse ce nombre d\'absences non justifiées sur le trimestre.',
  },
  PAYMENT_OVERDUE: {
    title: 'Paiements en retard',
    unit: 'jours',
    description: 'Déclenche une alerte pour les paiements en attente depuis plus de X jours après la date d\'échéance.',
  },
  GRADE_DROP: {
    title: 'Chute de notes',
    unit: 'points',
    description: 'Déclenche une alerte quand la moyenne d\'un élève chute de plus de X points entre deux trimestres.',
  },
  LATE_THRESHOLD: {
    title: 'Seuil de retards',
    unit: 'retards',
    description: 'Déclenche une alerte quand un élève accumule ce nombre de retards sur le trimestre.',
  },
}

interface AlertRule {
  id?: string
  type: string
  threshold: number
  notify_sms: boolean
  notify_email: boolean
  is_active: boolean
}

interface Props {
  rules: AlertRule[]
}

function RuleCard({ rule, ruleType }: { rule?: AlertRule; ruleType: string }) {
  const meta = RULE_META[ruleType]
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(saveAlertRule, null)

  const defaults = {
    threshold:    rule?.threshold    ?? 5,
    notify_sms:   rule?.notify_sms   ?? false,
    notify_email: rule?.notify_email ?? true,
    is_active:    rule?.is_active    ?? false,
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{meta.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 pr-4">{meta.description}</p>
        </div>
        <span className={`flex-shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
          defaults.is_active
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-gray-100 text-gray-500 border-gray-200'
        }`}>
          {defaults.is_active ? 'Actif' : 'Inactif'}
        </span>
      </div>

      {state && !state.success && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
          Règle sauvegardée.
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="type" value={ruleType} />

        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Seuil</label>
          <input
            name="threshold"
            type="number"
            min="1"
            defaultValue={defaults.threshold}
            className="w-20 px-2.5 py-1.5 rounded-lg border border-gray-300 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-500">{meta.unit}</span>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="notify_email"
              defaultChecked={defaults.notify_email}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-700">Notifier par email</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="notify_sms"
              defaultChecked={defaults.notify_sms}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-700">Notifier par SMS</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={defaults.is_active}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-700">Activer la règle</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {pending ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </form>
    </div>
  )
}

function RunCheckButton() {
  const [isPending, startTransition] = useTransition()

  async function handleClick() {
    startTransition(async () => {
      await runAlertCheck()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white
                 text-sm font-medium hover:bg-orange-600 disabled:opacity-60 transition"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {isPending ? 'Vérification…' : 'Vérifier maintenant'}
    </button>
  )
}

export function AlertsClient({ rules }: Props) {
  const RULE_TYPES = ['ABSENCE_THRESHOLD', 'PAYMENT_OVERDUE', 'GRADE_DROP', 'LATE_THRESHOLD']

  return (
    <>
      <div className="flex justify-end">
        <RunCheckButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RULE_TYPES.map(ruleType => {
          const rule = rules.find(r => r.type === ruleType)
          return <RuleCard key={ruleType} rule={rule} ruleType={ruleType} />
        })}
      </div>
    </>
  )
}
