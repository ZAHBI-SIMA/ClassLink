'use client'

import { useState } from 'react'
import { BookingModal } from './booking-modal'

interface Resource {
  id: string
  name: string
  type: string
  capacity?: number | null
  location?: string | null
  description?: string | null
  active_bookings_today?: number
}

interface Booking {
  id: string
  title: string
  resource_name: string
  resource_type: string
  start_time: string
  end_time: string
  purpose?: string | null
  booked_by_name: string
  status: string
}

interface Props {
  resources: Resource[]
  bookings: Booking[]
}

const TYPE_LABEL: Record<string, string> = {
  ROOM:      'Salle',
  EQUIPMENT: 'Équipement',
  VEHICLE:   'Véhicule',
  OTHER:     'Autre',
}

const TYPE_COLOR: Record<string, string> = {
  ROOM:      'bg-blue-50 text-blue-700 border-blue-100',
  EQUIPMENT: 'bg-purple-50 text-purple-700 border-purple-100',
  VEHICLE:   'bg-orange-50 text-orange-700 border-orange-100',
  OTHER:     'bg-gray-50 text-gray-600 border-gray-100',
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function ResourcesClient({ resources, bookings }: Props) {
  const [selected, setSelected] = useState<Resource | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('ALL')

  const filtered = typeFilter === 'ALL'
    ? resources
    : resources.filter(r => r.type === typeFilter)

  // Timeline : 07h → 19h
  const DAY_START = 7 * 60
  const DAY_END   = 19 * 60
  const DAY_SPAN  = DAY_END - DAY_START
  const hours     = Array.from({ length: 13 }, (_, i) => i + 7)

  return (
    <>
      {/* ── Filtres ──────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['ALL', 'ROOM', 'EQUIPMENT', 'VEHICLE', 'OTHER'].map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
              typeFilter === type
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {type === 'ALL' ? 'Toutes' : TYPE_LABEL[type] ?? type}
          </button>
        ))}
      </div>

      {/* ── Grille des ressources ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">
          Aucune ressource disponible pour ce filtre.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {filtered.map(r => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mb-1.5 ${TYPE_COLOR[r.type] ?? 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                    {TYPE_LABEL[r.type] ?? r.type}
                  </span>
                  <p className="font-semibold text-gray-900 text-sm leading-snug">{r.name}</p>
                  {r.location && (
                    <p className="text-xs text-gray-400 mt-0.5">{r.location}</p>
                  )}
                </div>
                {r.capacity != null && r.capacity > 0 && (
                  <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
                    {r.capacity} pl.
                  </span>
                )}
              </div>

              {r.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{r.description}</p>
              )}

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {r.active_bookings_today
                    ? `${r.active_bookings_today} rés. auj.`
                    : 'Disponible auj.'}
                </span>
                <button
                  onClick={() => setSelected(r)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700
                             bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                >
                  Réserver
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Timeline d'aujourd'hui ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Planning d&apos;aujourd&apos;hui
        </h2>

        {bookings.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            Aucune réservation pour aujourd&apos;hui.
          </p>
        ) : (
          <div className="overflow-x-auto">
            {/* Règle horaire */}
            <div className="relative" style={{ minWidth: 640 }}>
              <div className="flex border-b border-gray-100 mb-3">
                {hours.map(h => (
                  <div
                    key={h}
                    className="text-[10px] text-gray-400 font-medium"
                    style={{ width: `${100 / hours.length}%` }}
                  >
                    {String(h).padStart(2, '0')}h
                  </div>
                ))}
              </div>

              {/* Barres de réservation */}
              <div className="relative" style={{ height: bookings.length * 44 + 8 }}>
                {bookings.map((b, idx) => {
                  const start = Math.max(timeToMinutes(b.start_time), DAY_START)
                  const end   = Math.min(timeToMinutes(b.end_time),   DAY_END)
                  const left  = ((start - DAY_START) / DAY_SPAN) * 100
                  const width = Math.max(((end - start) / DAY_SPAN) * 100, 2)

                  return (
                    <div
                      key={b.id}
                      className="absolute rounded-lg px-2 py-1 overflow-hidden"
                      style={{
                        left:   `${left}%`,
                        width:  `${width}%`,
                        top:    idx * 44 + 4,
                        height: 36,
                        background: b.status === 'CONFIRMED' ? '#eff6ff' : '#f9fafb',
                        borderLeft: `3px solid ${b.status === 'CONFIRMED' ? '#2563eb' : '#9ca3af'}`,
                      }}
                    >
                      <p className="text-[10px] font-semibold text-gray-800 truncate leading-tight">
                        {b.resource_name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {b.title} · {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Légende liste */}
        {bookings.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4">
            {bookings.map(b => (
              <div key={b.id} className="flex items-center justify-between text-xs text-gray-600 gap-2">
                <span className="font-medium text-gray-800 truncate">{b.resource_name}</span>
                <span className="truncate">{b.title}</span>
                <span className="whitespace-nowrap text-gray-400 shrink-0">
                  {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                </span>
                <span className="whitespace-nowrap shrink-0">{b.booked_by_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────── */}
      {selected && (
        <BookingModal
          resource={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
