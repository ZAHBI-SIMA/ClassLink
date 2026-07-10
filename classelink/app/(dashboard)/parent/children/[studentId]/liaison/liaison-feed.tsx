'use client'

import { useState } from 'react'
import { AuthorizeModal } from '../../../trips/authorize-modal'

interface LiaisonItem {
  id: string
  kind: 'CONVOCATION' | 'SANCTION' | 'SORTIE'
  subtype: string | null
  title: string
  event_date: string
  location: string | null
  status: string | null
  created_at: string
  trip_id?: string
  signed?: boolean
}

const KIND_STYLE: Record<string, { label: string; cls: string; icon: string }> = {
  CONVOCATION: { label: 'Convocation',    cls: 'bg-purple-100 text-purple-800', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  SANCTION:    { label: 'Sanction',        cls: 'bg-red-100 text-red-800',       icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  SORTIE:      { label: 'Sortie scolaire', cls: 'bg-blue-100 text-blue-800',     icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'À signer',   cls: 'bg-orange-100 text-orange-700' },
  AUTHORIZED:{ label: 'Autorisé',   cls: 'bg-green-100 text-green-700' },
  REFUSED:   { label: 'Refusé',     cls: 'bg-gray-200 text-gray-600' },
  CONFIRMED: { label: 'Confirmé',   cls: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Terminé',    cls: 'bg-gray-100 text-gray-600' },
  CANCELLED: { label: 'Annulé',     cls: 'bg-gray-200 text-gray-500' },
}

interface Props {
  items: LiaisonItem[]
  studentId: string
  studentName: string
}

export function LiaisonFeed({ items, studentId, studentName }: Props) {
  const [signing, setSigning] = useState<LiaisonItem | null>(null)

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-gray-700 font-medium">Aucun événement dans le carnet</p>
        <p className="text-sm text-gray-400 mt-1">Convocations, sanctions et sorties apparaîtront ici.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {items.map(item => {
          const style  = KIND_STYLE[item.kind]
          const status = item.status ? STATUS_LABEL[item.status] : null
          const needsSignature = item.kind === 'SORTIE' && item.status === 'PENDING'

          return (
            <div key={`${item.kind}-${item.id}`} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${style.cls}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.cls}`}>{style.label}</span>
                    {status && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(item.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  {item.location && <p className="text-xs text-gray-500 mt-0.5">📍 {item.location}</p>}
                </div>
                {needsSignature && (
                  <button
                    onClick={() => setSigning(item)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                  >
                    Signer
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {signing && signing.trip_id && (
        <AuthorizeModal
          tripId={signing.trip_id}
          studentId={studentId}
          studentName={studentName}
          tripTitle={signing.title}
          onClose={() => setSigning(null)}
        />
      )}
    </>
  )
}
