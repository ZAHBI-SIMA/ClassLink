'use client'

import { useState } from 'react'
import { getClassGradesExport } from '@/actions/teacher'

interface Assignment {
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
}

interface Term {
  id: string
  name: string
}

interface Props {
  assignments: Assignment[]
  terms: Term[]
}

function rowsToCsv(rows: any[]): string {
  const headers = ['Prénom', 'Nom', 'Matière', 'Type', 'Note', 'Max', 'Coefficient', 'Trimestre', 'Date']
  const lines = [headers.join(';')]
  for (const r of rows) {
    const date = r.published_at
      ? new Date(r.published_at).toLocaleDateString('fr-FR')
      : ''
    lines.push([
      r.first_name ?? '',
      r.last_name ?? '',
      r.subject_name ?? '',
      r.type ?? '',
      r.value ?? '',
      r.max_value ?? '',
      r.coefficient ?? '',
      r.term_name ?? '',
      date,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
  }
  return lines.join('\n')
}

export function ExportClient({ assignments, terms }: Props) {
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [termId, setTermId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Unique classes from assignments
  const classes = Array.from(
    new Map(assignments.map(a => [a.class_id, { id: a.class_id, name: a.class_name }])).values()
  )

  // Filter subjects by selected class
  const subjects = assignments
    .filter(a => a.class_id === classId)
    .map(a => ({ id: a.subject_id, name: a.subject_name }))

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClassId(e.target.value)
    setSubjectId('')
  }

  const handleExport = async () => {
    if (!classId || !subjectId) {
      setError('Veuillez sélectionner une classe et une matière.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const result = await getClassGradesExport(classId, subjectId, termId || undefined)
      if (!result.success) {
        setError(result.error)
        return
      }
      const rows = result.data ?? []
      if (rows.length === 0) {
        setError('Aucune note à exporter pour cette sélection.')
        return
      }
      const csv = rowsToCsv(rows)
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `notes_${classId}_${subjectId}${termId ? '_' + termId : ''}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e.message ?? 'Erreur inattendue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Classe */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Classe</label>
          <select
            value={classId}
            onChange={handleClassChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Sélectionner --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Matière */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Matière</label>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            disabled={!classId}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">-- Sélectionner --</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Trimestre */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Trimestre (optionnel)</label>
          <select
            value={termId}
            onChange={e => setTermId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les trimestres</option>
            {terms.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleExport}
        disabled={loading || !classId || !subjectId}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Exportation...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exporter en CSV
          </>
        )}
      </button>
    </div>
  )
}
