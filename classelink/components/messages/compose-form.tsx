'use client'

import { useActionState } from 'react'
import { sendMessage } from '@/actions/messages'
import type { ActionResult } from '@/types'

interface Contact {
  id: string
  first_name: string
  last_name: string
  role: string
}

interface ComposeFormProps {
  contacts: Contact[]
  defaultRecipientId?: string
  defaultSubject?: string
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administration',
  CENSOR: 'Censeur',
  TEACHER: 'Enseignant',
  PARENT: 'Parent',
  STUDENT: 'Élève',
}

export function ComposeForm({ contacts, defaultRecipientId, defaultSubject }: ComposeFormProps) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    sendMessage,
    null
  )

  if (state?.success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-green-800 font-semibold">Message envoyé avec succès !</p>
      </div>
    )
  }

  const byRole: Record<string, Contact[]> = {}
  for (const c of contacts) {
    if (!byRole[c.role]) byRole[c.role] = []
    byRole[c.role].push(c)
  }

  return (
    <form action={action} className="space-y-4">
      {state && !state.success && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Destinataire</label>
        <select
          name="recipient_id"
          defaultValue={defaultRecipientId ?? ''}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sélectionner un destinataire…</option>
          {Object.entries(byRole).map(([role, list]) => (
            <optgroup key={role} label={ROLE_LABELS[role] ?? role}>
              {list.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
        <input
          type="text"
          name="subject"
          defaultValue={defaultSubject ?? ''}
          required
          placeholder="Sujet du message"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          name="body"
          required
          rows={8}
          placeholder="Rédigez votre message…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition"
      >
        {isPending ? 'Envoi en cours…' : 'Envoyer le message'}
      </button>
    </form>
  )
}
