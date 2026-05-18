'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import {
  enable2FAAction,
  disable2FAAction,
  generate2FASetupAction,
} from '@/actions/auth'

interface Props {
  twoFactorEnabled: boolean
}

export function SecurityClient({ twoFactorEnabled }: Props) {
  // ── Setup (activation) ──────────────────────────────────────────────────────
  const [setupData, setSetupData] = useState<{
    secret: string
    qrCodeUrl: string
    otpAuthUri: string
  } | null>(null)
  const [isGenerating, startGenerate] = useTransition()

  const [enableState, enableAction, isEnabling] = useActionState(enable2FAAction, null)
  const [disableState, disableAction, isDisabling] = useActionState(disable2FAAction, null)

  const [enabled, setEnabled] = useState(twoFactorEnabled)

  useEffect(() => {
    if (enableState?.success) { setEnabled(true); setSetupData(null) }
  }, [enableState])

  useEffect(() => {
    if (disableState?.success) setEnabled(false)
  }, [disableState])

  function startSetup() {
    startGenerate(async () => {
      const res = await generate2FASetupAction()
      if (res.success && res.data) setSetupData(res.data)
    })
  }

  if (enabled) {
    return (
      <div className="space-y-6">
        {/* Statut activé */}
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Authentification à deux facteurs activée</p>
            <p className="text-xs text-green-700">Votre compte est protégé par une application authenticator.</p>
          </div>
        </div>

        {/* Désactiver */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Désactiver la 2FA</h3>
          <p className="text-xs text-gray-500 mb-4">
            Entrez un code de votre application authenticator pour confirmer la désactivation.
          </p>
          <form action={disableAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code authenticator</label>
              <input
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono
                           focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            {disableState && !disableState.success && (
              <p className="text-xs text-red-600">{disableState.error}</p>
            )}
            <button
              type="submit"
              disabled={isDisabling}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white
                         text-sm font-medium rounded-lg transition"
            >
              {isDisabling ? 'Désactivation...' : 'Désactiver la 2FA'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (setupData) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">Configuration de l'authenticator</h3>
          <ol className="text-xs text-blue-700 space-y-2 list-decimal list-inside mb-4">
            <li>Installez <strong>Google Authenticator</strong> ou <strong>Authy</strong> sur votre téléphone.</li>
            <li>Scannez le QR code ci-dessous avec votre application.</li>
            <li>Entrez le code à 6 chiffres affiché par l'application pour confirmer.</li>
          </ol>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={setupData.qrCodeUrl}
            alt="QR Code 2FA"
            className="w-44 h-44 rounded-xl border border-gray-200"
          />
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Ou entrez ce code manuellement :</p>
            <code className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-lg text-gray-800 select-all">
              {setupData.secret}
            </code>
          </div>
        </div>

        {/* Formulaire de confirmation */}
        <form action={enableAction} className="space-y-4">
          <input type="hidden" name="secret" value={setupData.secret} />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Code de confirmation (6 chiffres)
            </label>
            <input
              name="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              autoFocus
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {enableState && !enableState.success && (
            <p className="text-xs text-red-600">{enableState.error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isEnabling}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white
                         text-sm font-medium rounded-lg transition"
            >
              {isEnabling ? 'Activation...' : 'Activer la 2FA'}
            </button>
            <button
              type="button"
              onClick={() => setSetupData(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statut désactivé */}
      <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-yellow-800">2FA non activée</p>
          <p className="text-xs text-yellow-700">
            Sécurisez votre compte avec une application authenticator.
          </p>
        </div>
      </div>

      <button
        onClick={startSetup}
        disabled={isGenerating}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white
                   text-sm font-semibold rounded-xl transition flex items-center gap-2"
      >
        {isGenerating ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Génération...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Configurer l&apos;authentification à deux facteurs
          </>
        )}
      </button>
    </div>
  )
}
