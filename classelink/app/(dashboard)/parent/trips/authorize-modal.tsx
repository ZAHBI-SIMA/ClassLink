'use client'

import { useState, useTransition } from 'react'
import { authorizeTrip, } from '@/actions/trips'
import { getParentSubscriptionStatus } from '@/actions/parent'
import { SignaturePad } from '@/components/ui/signature-pad'
import { PaySubscriptionButton } from '@/components/ui/pay-subscription-button'

interface Props {
  tripId: string
  studentId: string
  studentName: string
  tripTitle: string
  onClose: () => void
}

export function AuthorizeModal({ tripId, studentId, studentName, tripTitle, onClose }: Props) {
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showSignature, setShowSignature] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [locked, setLocked] = useState<{ childrenCount: number; amountDue: number } | null>(null)

  function submit(authorized: boolean, signatureData?: string) {
    setError(null)
    startTransition(async () => {
      const result = await authorizeTrip(tripId, studentId, authorized, notes || undefined, signatureData)
      if (!result.success) {
        setError(result.error ?? 'Une erreur est survenue.')
      } else {
        onClose()
      }
    })
  }

  // La signature (autorisation) nécessite l'abonnement MyClassLink actif —
  // le refus, lui, reste toujours accessible gratuitement.
  async function handleAuthorizeClick() {
    setCheckingPayment(true)
    const status = await getParentSubscriptionStatus()
    setCheckingPayment(false)
    if (status.success && status.data && !status.data.paid) {
      setLocked({ childrenCount: status.data.childrenCount, amountDue: status.data.amountDue })
      return
    }
    setShowSignature(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Autorisation de sortie</h2>
            <p className="text-sm text-gray-500 mt-0.5">{tripTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700">
          <span className="font-medium">Élève :</span> {studentName}
        </div>

        {!locked && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes / commentaires <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Ajouter un commentaire..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {locked ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center space-y-3">
            <p className="text-sm font-semibold text-gray-900">Abonnement MyClassLink requis</p>
            <p className="text-xs text-gray-600">
              La signature numérique des autorisations de sortie nécessite un abonnement actif
              ({locked.childrenCount} enfant{locked.childrenCount > 1 ? 's' : ''} × 2 000 FCFA ={' '}
              <strong>{locked.amountDue.toLocaleString('fr-FR')} FCFA/an</strong>).
            </p>
            <PaySubscriptionButton label="Payer et débloquer" />
            <button
              onClick={() => setLocked(null)}
              className="block mx-auto text-xs text-gray-400 hover:text-gray-600"
            >
              Retour
            </button>
          </div>
        ) : showSignature ? (
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signez pour confirmer votre autorisation
            </label>
            <SignaturePad
              disabled={isPending}
              onCancel={() => setShowSignature(false)}
              onSave={dataUrl => submit(true, dataUrl)}
            />
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => submit(false)}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 text-sm font-medium rounded-lg transition disabled:opacity-50"
            >
              Refuser
            </button>
            <button
              onClick={handleAuthorizeClick}
              disabled={isPending || checkingPayment}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
            >
              {checkingPayment ? 'Vérification…' : 'Autoriser'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
