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

  /* ── 2FA activée ───────────────────────────────────────────────────────── */
  if (enabled) {
    return (
      <div className="space-y-5">
        {/* Statut activé */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
          <div className="w-11 h-11 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-green-800">2FA activée</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                Actif
              </span>
            </div>
            <p className="text-xs text-green-700">Votre compte est protégé par une application authenticator.</p>
          </div>
        </div>

        {/* Désactiver */}
        <div className="border border-red-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 bg-red-50 border-b border-red-100">
            <h3 className="text-sm font-semibold text-red-800">Désactiver la 2FA</h3>
            <p className="text-xs text-red-600 mt-0.5">
              Entrez un code de votre application authenticator pour confirmer la désactivation.
            </p>
          </div>
          <div className="p-5">
            <form action={disableAction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Code authenticator</label>
                <input
                  name="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123 456"
                  className="w-full max-w-xs px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono tracking-widest
                             focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-gray-50 transition"
                />
              </div>
              {disableState && !disableState.success && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {disableState.error}
                </div>
              )}
              <button
                type="submit"
                disabled={isDisabling}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700
                           disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold
                           rounded-xl transition shadow-sm shadow-red-200"
              >
                {isDisabling ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Désactivation...
                  </>
                ) : 'Désactiver la 2FA'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  /* ── Configuration en cours ────────────────────────────────────────────── */
  if (setupData) {
    return (
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-blue-800">Configuration de l'authenticator</h3>
          </div>
          <ol className="space-y-2">
            {[
              <>Installez <strong>Google Authenticator</strong> ou <strong>Authy</strong> sur votre téléphone.</>,
              'Scannez le QR code ci-dessous avec votre application.',
              'Entrez le code à 6 chiffres affiché par l\'application pour confirmer.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-blue-700">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={setupData.qrCodeUrl}
            alt="QR Code 2FA"
            className="w-48 h-48 rounded-xl border-4 border-white shadow-md"
          />
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Ou entrez ce code manuellement :</p>
            <code className="text-sm font-mono bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-800 select-all shadow-sm tracking-widest">
              {setupData.secret}
            </code>
          </div>
        </div>

        {/* Formulaire de confirmation */}
        <form action={enableAction} className="space-y-4">
          <input type="hidden" name="secret" value={setupData.secret} />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Code de confirmation (6 chiffres)
            </label>
            <input
              name="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123 456"
              autoFocus
              className="w-full max-w-xs px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono tracking-widest
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
            />
          </div>
          {enableState && !enableState.success && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {enableState.error}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isEnabling}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700
                         disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold
                         rounded-xl transition shadow-sm shadow-blue-200"
            >
              {isEnabling ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Activation...
                </>
              ) : 'Activer la 2FA'}
            </button>
            <button
              type="button"
              onClick={() => setSetupData(null)}
              className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-xl transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    )
  }

  /* ── 2FA non activée ───────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* Statut désactivé */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
        <div className="w-11 h-11 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-amber-800">2FA non activée</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              Inactif
            </span>
          </div>
          <p className="text-xs text-amber-700">
            Sécurisez votre compte avec une application authenticator.
          </p>
        </div>
      </div>

      <button
        onClick={startSetup}
        disabled={isGenerating}
        className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600
                   hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed
                   text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-200
                   hover:shadow-lg hover:shadow-blue-300 hover:-translate-y-0.5"
      >
        {isGenerating ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Génération en cours...
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
