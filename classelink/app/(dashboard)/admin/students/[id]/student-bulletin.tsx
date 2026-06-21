'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BulletinView } from '@/components/bulletin/bulletin-view'

export interface TermBulletin {
  termId: string
  termName: string
  termOrder: number
  data: any | null
  error: string | null
}

export function StudentBulletin({
  studentId,
  bulletins,
}: {
  studentId: string
  bulletins: TermBulletin[]
}) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (bulletins.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-1">Bulletin</h2>
        <p className="text-sm text-gray-400 italic">
          Aucun trimestre configuré pour l&apos;année en cours.
        </p>
      </div>
    )
  }

  const active = bulletins[activeIdx]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* En-tête + onglets trimestres */}
      <div className="flex items-center justify-between gap-3 flex-wrap px-5 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-base font-bold text-gray-900">Bulletin par trimestre</h2>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {bulletins.map((b, i) => (
            <button
              key={b.termId}
              onClick={() => setActiveIdx(i)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                i === activeIdx
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {b.termName}
            </button>
          ))}
        </div>
      </div>

      {/* Actions trimestre actif */}
      <div className="flex items-center justify-end gap-2 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
        <Link
          href={`/admin/bulletin/${studentId}/${active.termId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600
                     bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-700 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Vue plein écran
        </Link>
        <a
          href={`/api/bulletin/${studentId}/${active.termId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white
                     bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Télécharger le PDF
        </a>
      </div>

      {/* Corps du bulletin */}
      <div className="p-5 bg-gray-50/50">
        {active.error ? (
          <div className="border border-dashed border-red-300 rounded-xl py-10 text-center bg-white">
            <p className="text-sm text-red-600">{active.error}</p>
          </div>
        ) : active.data ? (
          <BulletinView data={active.data} />
        ) : (
          <div className="border border-dashed border-gray-300 rounded-xl py-10 text-center bg-white">
            <p className="text-sm text-gray-400 italic">
              Aucune donnée de bulletin pour ce trimestre.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
