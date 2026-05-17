'use client'

import { useState, useTransition } from 'react'
import { saveGrade, deleteGrade } from '@/actions/teacher'

const GRADE_TYPES = [
  { value: 'DEVOIR',        label: 'Devoir' },
  { value: 'INTERROGATION', label: 'Interrogation' },
  { value: 'COMPOSITION',   label: 'Composition' },
  { value: 'EXAM',          label: 'Examen' },
]

interface Grade {
  id: string
  type: string
  value: number
  coefficient: number
  comment: string | null
}

interface Student {
  student_id: string
  student_number: string
  first_name: string
  last_name: string
  grades: Grade[]
  average: number | null
}

interface Props {
  students: Student[]
  subjectId: string
  termId: string
}

export function GradeSheet({ students: initial, subjectId, termId }: Props) {
  const [students, setStudents] = useState(initial)
  const [gradeType, setGradeType] = useState('DEVOIR')
  const [coefficient, setCoefficient] = useState('1')
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState<string | null>(null)
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.map(s => [s.student_id, '']))
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleInput(studentId: string, value: string) {
    setInputs(prev => ({ ...prev, [studentId]: value }))
  }

  async function handleSaveAll() {
    setError(null)
    setSuccess(false)
    const toSave = students.filter(s => inputs[s.student_id]?.trim() !== '')
    if (toSave.length === 0) {
      setError('Aucune note à enregistrer.')
      return
    }

    startTransition(async () => {
      for (const student of toSave) {
        const fd = new FormData()
        fd.set('student_id', student.student_id)
        fd.set('subject_id', subjectId)
        fd.set('term_id', termId)
        fd.set('type', gradeType)
        fd.set('value', inputs[student.student_id])
        fd.set('coefficient', coefficient)

        const result = await saveGrade(null, fd)
        if (!result.success) {
          setError(`Erreur pour ${student.first_name} ${student.last_name}: ${result.error}`)
          return
        }
      }
      setSuccess(true)
      setInputs(Object.fromEntries(students.map(s => [s.student_id, ''])))
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  async function handleDelete(studentId: string, gradeId: string) {
    setSaving(gradeId)
    await deleteGrade(gradeId)
    setSaving(null)
  }

  return (
    <div className="space-y-4">
      {/* Barre de contrôle */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type d&apos;évaluation</label>
            <select
              value={gradeType}
              onChange={e => setGradeType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GRADE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Coefficient</label>
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={coefficient}
              onChange={e => setCoefficient(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSaveAll}
            disabled={pending}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold
                       hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {pending ? 'Enregistrement...' : 'Enregistrer toutes les notes'}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="mt-3 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            Notes enregistrées avec succès.
          </p>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Élève
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">
                Nouvelle note /20
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Moyenne matière
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Notes existantes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map(student => (
              <tr key={student.student_id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs
                                    font-bold flex items-center justify-center flex-shrink-0">
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.last_name} {student.first_name}
                      </p>
                      <p className="text-xs text-gray-400">{student.student_number}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    placeholder="—"
                    value={inputs[student.student_id] ?? ''}
                    onChange={e => handleInput(student.student_id, e.target.value)}
                    className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 text-center
                               text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  {student.average !== null ? (
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-sm font-bold ${
                      student.average >= 10
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {Number(student.average).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {student.grades.map((g: Grade) => (
                      <div key={g.id}
                        className="group flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                        <span className="text-xs text-gray-500">{g.type.slice(0, 3)}.</span>
                        <span className="text-xs font-semibold text-gray-800">{Number(g.value).toFixed(2)}</span>
                        <span className="text-xs text-gray-400">×{g.coefficient}</span>
                        <button
                          onClick={() => handleDelete(student.student_id, g.id)}
                          disabled={saving === g.id}
                          className="ml-0.5 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {student.grades.length === 0 && (
                      <span className="text-xs text-gray-300 italic">Aucune note</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
