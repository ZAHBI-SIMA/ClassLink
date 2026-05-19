'use client'

import { useState } from 'react'
import { AuthorizeModal } from './authorize-modal'

type Filter = 'all' | 'pending' | 'authorized'

interface Props {
  trips: any[]
}

function statusBadge(status: string) {
  switch (status) {
    case 'AUTHORIZED': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Autorisée</span>
    case 'REFUSED':    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Refusée</span>
    case 'PENDING':    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">En attente</span>
    default:           return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{status}</span>
  }
}

export function TripsClient({ trips }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [modal, setModal] = useState<any | null>(null)

  const filtered = trips.filter(t => {
    if (filter === 'pending')    return t.authorization_status === 'PENDING' || !t.authorization_status
    if (filter === 'authorized') return t.authorization_status === 'AUTHORIZED'
    return true
  })

  return (
    <div className="space-y-5">
      {/* Filtres */}
      <div className="flex gap-2">
        {([['all', 'Toutes'], ['pending', 'À autoriser'], ['authorized', 'Autorisées']] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
              filter === key
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cartes */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl bg-white">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          <p className="text-sm text-gray-500">Aucune sortie dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((trip: any) => (
            <div key={`${trip.id}-${trip.student_id}`} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{trip.title}</h3>
                    {statusBadge(trip.authorization_status ?? 'PENDING')}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {trip.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {trip.trip_date ? new Date(trip.trip_date).toLocaleDateString('fr-FR') : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {trip.student_first_name} {trip.student_last_name}
                    </span>
                  </div>
                  {trip.description && (
                    <p className="text-xs text-gray-400 line-clamp-2">{trip.description}</p>
                  )}
                </div>

                {(trip.authorization_status === 'PENDING' || !trip.authorization_status) && (
                  <button
                    onClick={() => setModal(trip)}
                    className="flex-shrink-0 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
                  >
                    Répondre
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <AuthorizeModal
          tripId={modal.id}
          studentId={modal.student_id}
          studentName={`${modal.student_first_name} ${modal.student_last_name}`}
          tripTitle={modal.title}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
