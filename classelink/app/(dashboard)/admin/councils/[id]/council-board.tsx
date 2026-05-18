'use client'

import { useState, useTransition } from 'react'
import { saveCouncilDecisions, updateCouncilStatus } from '@/actions/council'

const DECISIONS = [
  { value: 'PASSAGE',               label: 'Passage',                cls: 'bg-green-100 text-green-800' },
  { value: 'PASSAGE_CONDITIONNEL',  label: 'Passage conditionnel',   cls: 'bg-yellow-100 text-yellow-800' },
  { value: 'REDOUBLEMENT',          label: 'Redoublement',           cls: 'bg-red-100 text-red-800' },
  { value: 'FELICITATIONS',         label: 'Félicitations',          cls: 'bg-emerald-100 text-emerald-800' },
  { value: 'ENCOURAGEMENTS',        label: 'Encouragements',         cls: 'bg-blue-100 text-blue-800' },
  { value: 'TABLEAU_HONNEUR',       label: "Tableau d'honneur",      cls: 'bg-purple-100 text-purple-800' },
  { value: 'EXCLUSION',             label: 'Exclusion',              cls: 'bg-gray-100 text-gray-800' },
]

const APPRECIATIONS = ['Très Bien', 'Bien', 'Assez Bien', 'Passable', 'Insuffisant', 'Très Insuffisant']

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PLANNED:     { label: 'Planifié',   cls: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'En cours',  cls: 'bg-yellow-100 text-yellow-700' },
  COMPLETED:   { label: 'Terminé',   cls: 'bg-green-100 text-green-700' },
}

type StudentRow = {
  student_id:      string
  first_name:      string
  last_name:       string
  student_number:  string | null
  decision_id:     string | null
  average:         number | null
  computed_average: number | null
  rank:            number | null
  decision:        string
  appreciation:    string | null
  council_comment: string | null
  total_absences:  number
}

interface Props {
  councilId: string
  council:   any
  students:  StudentRow[]
}

export function CouncilBoard({ councilId, council, students }: Props) {
  const [rows, setRows] = useState<Record<string, {
    decision:       string
    appreciation:   string
    councilComment: string
    average:        string
    rank:           string
    absencesCount:  string
  }>>(
    () => Object.fromEntries(students.map(s => [s.student_id, {
      decision:       s.decision        ?? 'PASSAGE',
      appreciation:   s.appreciation    ?? '',
      councilComment: s.council_comment ?? '',
      average:        s.computed_average != null ? String(s.computed_average) : s.average != null ? String(s.average) : '',
      rank:           s.rank            != null  ? String(s.rank)    : '',
      absencesCount:  String(s.total_absences    ?? 0),
    }]))
  )

  const [notes, setNotes]         = useState(council.general_notes ?? '')
  const [status, setStatus]       = useState(council.status)
  const [saving, startSave]       = useTransition()
  const [savingStatus, startSaveStatus] = useTransition()
  const [saved, setSaved]         = useState(false)
  const [errorMsg, setErrorMsg]   = useState<string | null>(null)

  const updateRow = (studentId: string, field: string, value: string) => {
    setRows(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }))
  }

  const handleSave = () => {
    startSave(async () => {
      const decisions = students.map(s => {
        const r = rows[s.student_id]
        return {
          studentId:      s.student_id,
          average:        r.average ? parseFloat(r.average) : null,
          rank:           r.rank    ? parseInt(r.rank) : null,
          decision:       r.decision,
          appreciation:   r.appreciation,
          councilComment: r.councilComment,
          absencesCount:  parseInt(r.absencesCount) || 0,
        }
      })
      const res = await saveCouncilDecisions(councilId, decisions)
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setErrorMsg(res.error ?? 'Erreur')
        setTimeout(() => setErrorMsg(null), 4000)
      }
    })
  }

  const handleStatusChange = (newStatus: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED') => {
    startSaveStatus(async () => {
      await updateCouncilStatus(councilId, newStatus, notes)
      setStatus(newStatus)
    })
  }

  const statusCfg = STATUS_LABELS[status] ?? STATUS_LABELS.PLANNED

  // Compteurs décisions
  const decisionCounts = students.reduce((acc, s) => {
    const d = rows[s.student_id]?.decision ?? 'PASSAGE'
    acc[d] = (acc[d] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-5">

      {/* Barre d'état du conseil */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusCfg.cls}`}>
            {statusCfg.label}
          </span>
          {council.president && (
            <span className="text-sm text-gray-500">Présidé par : <span className="font-medium">{council.president}</span></span>
          )}
        </div>
        <div className="flex gap-2">
          {(['PLANNED', 'IN_PROGRESS', 'COMPLETED'] as const).map(s => (
            <button key={s}
              onClick={() => handleStatusChange(s)}
              disabled={status === s || savingStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                ${status === s
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {STATUS_LABELS[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Résumé décisions */}
      <div className="flex flex-wrap gap-2">
        {DECISIONS.map(d => {
          const count = decisionCounts[d.value] ?? 0
          if (count === 0) return null
          return (
            <span key={d.value} className={`px-3 py-1 rounded-full text-xs font-semibold ${d.cls}`}>
              {count} {d.label}
            </span>
          )
        })}
      </div>

      {/* Notes générales */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Notes générales du conseil
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Observations générales, points abordés, recommandations…"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Table élèves */}
      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <p className="text-gray-400 text-sm">Aucun élève inscrit dans cette classe.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Élève', 'Moy./20', 'Rang', 'Absences', 'Décision', 'Appréciation', 'Observations'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s, idx) => {
                  const r   = rows[s.student_id]
                  const dec = DECISIONS.find(d => d.value === r.decision)
                  const avgNum = parseFloat(r.average)
                  const avgColor = !isNaN(avgNum)
                    ? avgNum >= 14 ? 'text-green-700' : avgNum >= 10 ? 'text-blue-700' : 'text-red-700'
                    : 'text-gray-400'

                  return (
                    <tr key={s.student_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      {/* Élève */}
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-900 whitespace-nowrap">
                          {s.last_name} {s.first_name}
                        </p>
                        {s.student_number && (
                          <p className="text-xs text-gray-400">{s.student_number}</p>
                        )}
                      </td>

                      {/* Moyenne */}
                      <td className="px-3 py-2.5">
                        <input
                          type="number" min="0" max="20" step="0.01"
                          value={r.average}
                          onChange={e => updateRow(s.student_id, 'average', e.target.value)}
                          className={`w-20 px-2 py-1 rounded-lg border border-gray-200 text-sm font-bold text-center
                                     focus:outline-none focus:ring-1 focus:ring-blue-400 ${avgColor}`}
                        />
                      </td>

                      {/* Rang */}
                      <td className="px-3 py-2.5">
                        <input
                          type="number" min="1"
                          value={r.rank}
                          onChange={e => updateRow(s.student_id, 'rank', e.target.value)}
                          className="w-14 px-2 py-1 rounded-lg border border-gray-200 text-sm text-center
                                     focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </td>

                      {/* Absences */}
                      <td className="px-3 py-2.5">
                        <input
                          type="number" min="0"
                          value={r.absencesCount}
                          onChange={e => updateRow(s.student_id, 'absencesCount', e.target.value)}
                          className="w-14 px-2 py-1 rounded-lg border border-gray-200 text-sm text-center
                                     focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </td>

                      {/* Décision */}
                      <td className="px-3 py-2.5">
                        <select
                          value={r.decision}
                          onChange={e => updateRow(s.student_id, 'decision', e.target.value)}
                          className={`px-2 py-1 rounded-lg border border-gray-200 text-xs font-semibold
                                     focus:outline-none focus:ring-1 focus:ring-blue-400 ${dec?.cls ?? ''}`}
                        >
                          {DECISIONS.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Appréciation */}
                      <td className="px-3 py-2.5">
                        <select
                          value={r.appreciation}
                          onChange={e => updateRow(s.student_id, 'appreciation', e.target.value)}
                          className="px-2 py-1 rounded-lg border border-gray-200 text-xs
                                     focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white min-w-32"
                        >
                          <option value="">—</option>
                          {APPRECIATIONS.map(a => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </td>

                      {/* Observations */}
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={r.councilComment}
                          onChange={e => updateRow(s.student_id, 'councilComment', e.target.value)}
                          placeholder="Observation…"
                          className="w-full min-w-36 px-2 py-1 rounded-lg border border-gray-200 text-xs
                                     focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Barre de sauvegarde */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            {errorMsg ? (
              <p className="text-sm text-red-600">{errorMsg}</p>
            ) : saved ? (
              <p className="text-sm text-green-600 font-medium">✓ Décisions enregistrées</p>
            ) : (
              <p className="text-xs text-gray-400">
                {students.length} élève{students.length > 1 ? 's' : ''} · Modifiez les décisions puis sauvegardez
              </p>
            )}
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white
                         text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 13l4 4L19 7" />
              </svg>
              {saving ? 'Enregistrement…' : 'Sauvegarder les décisions'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
