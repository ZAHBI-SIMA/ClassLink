'use client'

import { useActionState, useState } from 'react'
import { saveAttendance } from '@/actions/teacher'
import type { ActionResult } from '@/types'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string }> = {
  PRESENT:  { label: 'Présent',  color: 'bg-green-100 text-green-700 border-green-300' },
  ABSENT:   { label: 'Absent',   color: 'bg-red-100 text-red-700 border-red-300' },
  LATE:     { label: 'Retard',   color: 'bg-orange-100 text-orange-700 border-orange-300' },
  EXCUSED:  { label: 'Excusé',   color: 'bg-blue-100 text-blue-700 border-blue-300' },
}

interface Student {
  student_id: string
  student_number: string
  first_name: string
  last_name: string
  attendance_id: string | null
  status: AttendanceStatus
  justified: boolean
  justification: string | null
}

interface Props {
  students: Student[]
  classId: string
  date: string
}

export function AttendanceSheet({ students: initial, classId, date }: Props) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(
    Object.fromEntries(initial.map(s => [s.student_id, s.status]))
  )
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    saveAttendance,
    null
  )

  const counts = Object.values(statuses).reduce(
    (acc, s) => { acc[s] = (acc[s] ?? 0) + 1; return acc },
    {} as Record<string, number>
  )

  function buildFormData() {
    const fd = new FormData()
    fd.set('class_id', classId)
    fd.set('date', date)
    for (const s of initial) {
      fd.append('student_id', s.student_id)
      fd.set(`status_${s.student_id}`, statuses[s.student_id])
    }
    return fd
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = buildFormData()
    await action(fd)
  }

  function markAll(status: AttendanceStatus) {
    setStatuses(Object.fromEntries(initial.map(s => [s.student_id, status])))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Résumé + actions rapides */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-4 text-sm">
            {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => (
              <span key={s} className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_CONFIG[s].color}`}>
                {counts[s] ?? 0} {STATUS_CONFIG[s].label.toLowerCase()}{(counts[s] ?? 0) > 1 ? 's' : ''}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Tout marquer :</span>
            {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => markAll(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition hover:opacity-80 ${STATUS_CONFIG[s].color}`}
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      {state && !state.success && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          Présences enregistrées.
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Élève
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initial.map(student => {
              const current = statuses[student.student_id]
              return (
                <tr key={student.student_id}
                  className={`transition ${current !== 'PRESENT' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                       text-xs font-bold flex-shrink-0 ${
                        current === 'PRESENT' ? 'bg-green-100 text-green-700' :
                        current === 'ABSENT'  ? 'bg-red-100 text-red-700' :
                        current === 'LATE'    ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-100 text-blue-700'
                      }`}>
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
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2 flex-wrap">
                      {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatuses(prev => ({ ...prev, [student.student_id]: s }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            current === s
                              ? STATUS_CONFIG[s].color + ' shadow-sm'
                              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold
                     hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isPending ? 'Enregistrement...' : 'Enregistrer les présences'}
        </button>
      </div>
    </form>
  )
}
