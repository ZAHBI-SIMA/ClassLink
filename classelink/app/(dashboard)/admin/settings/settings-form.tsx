'use client'

import { useActionState } from 'react'
import { saveSchoolSettings } from '@/actions/settings'
import type { ActionResult } from '@/types'

interface Props {
  settings: any
  subscription: any
}

export function SettingsForm({ settings, subscription }: Props) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    saveSchoolSettings,
    null
  )

  const planLabel: Record<string, string> = {
    starter:      'Starter',
    basic:        'Basic',
    professional: 'Professionnel',
    enterprise:   'Entreprise',
  }

  return (
    <div className="space-y-6">
      {/* Feedback global */}
      {state && !state.success && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Paramètres enregistrés avec succès.
        </div>
      )}

      <form action={action} className="space-y-6">
        {/* ── Informations générales ─────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Informations générales</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l&apos;établissement <span className="text-red-500">*</span>
              </label>
              <input
                name="school_name"
                defaultValue={settings.school_name ?? ''}
                placeholder="Lycée Moderne de Bouaké"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                name="address"
                defaultValue={settings.address ?? ''}
                placeholder="Rue des Écoles, Cocody, Abidjan"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  name="phone"
                  defaultValue={settings.phone ?? ''}
                  placeholder="+225 27 00 00 00 00"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={settings.email ?? ''}
                  placeholder="contact@lycee.ci"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
              <input
                name="website"
                defaultValue={settings.website ?? ''}
                placeholder="https://www.lycee-moderne.ci"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* ── Direction ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Direction</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du directeur / principal
              </label>
              <input
                name="principal_name"
                defaultValue={settings.principal_name ?? ''}
                placeholder="M. Konan Beugré"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d&apos;établissement
              </label>
              <select
                name="school_type"
                defaultValue={settings.school_type ?? ''}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">— Sélectionner —</option>
                <option value="primaire">Primaire</option>
                <option value="college">Collège</option>
                <option value="lycee">Lycée</option>
                <option value="mixte">Mixte (Collège + Lycée)</option>
                <option value="technique">Technique &amp; Professionnel</option>
                <option value="superieur">Supérieur</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Devise / Motto
              </label>
              <input
                name="motto"
                defaultValue={settings.motto ?? ''}
                placeholder="Savoir, Savoir-faire, Savoir-être"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* ── Notifications ─────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Notifications</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="sms_enabled"
                defaultChecked={settings.sms_enabled ?? false}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Activer les notifications SMS</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="email_enabled"
                defaultChecked={settings.email_enabled ?? true}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Activer les notifications email</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clé API SMS (Africa&apos;s Talking)
              </label>
              <input
                name="sms_api_key"
                type="password"
                defaultValue={settings.sms_api_key ?? ''}
                placeholder="••••••••••••••••"
                autoComplete="off"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Laissez vide pour conserver la clé existante.
              </p>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                     text-white text-sm font-semibold rounded-xl transition"
        >
          {pending ? 'Enregistrement…' : 'Enregistrer les paramètres'}
        </button>
      </form>

      {/* ── Carte abonnement ────────────────────────────────────────── */}
      {subscription && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Informations du compte</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div>
              <dt className="text-gray-500">Plan actuel</dt>
              <dd className="font-medium text-gray-900 mt-0.5">
                {planLabel[subscription.plan_slug] ?? subscription.plan_name ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Statut</dt>
              <dd className="mt-0.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  subscription.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : subscription.status === 'TRIAL'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {subscription.status === 'ACTIVE'  ? 'Actif'
                   : subscription.status === 'TRIAL' ? 'Période d\'essai'
                   : subscription.status}
                </span>
              </dd>
            </div>
            {subscription.max_students != null && (
              <div>
                <dt className="text-gray-500">Limite élèves</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{subscription.max_students}</dd>
              </div>
            )}
            {subscription.max_teachers != null && (
              <div>
                <dt className="text-gray-500">Limite enseignants</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{subscription.max_teachers}</dd>
              </div>
            )}
            {subscription.current_period_end && (
              <div>
                <dt className="text-gray-500">Renouvellement</dt>
                <dd className="font-medium text-gray-900 mt-0.5">
                  {new Date(subscription.current_period_end).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </div>
  )
}
