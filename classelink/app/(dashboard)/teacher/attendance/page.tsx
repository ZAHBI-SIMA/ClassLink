import { getTeacherClasses, getClassAttendance } from '@/actions/teacher'
import { AttendanceSheet } from './attendance-sheet'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ classId?: string; date?: string }>
}

export default async function TeacherAttendancePage({ searchParams }: Props) {
  const params      = await searchParams
  const classes     = await getTeacherClasses()
  const today       = new Date().toISOString().split('T')[0]
  const selectedClassId = params.classId ?? ''
  const selectedDate    = params.date    ?? today
  const selectedClass   = classes.find((c: any) => c.id === selectedClassId)

  const students = selectedClassId
    ? await getClassAttendance(selectedClassId, selectedDate)
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appel — Présences</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enregistrez les présences de vos élèves pour chaque séance.
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Classe
            </label>
            <div className="flex flex-wrap gap-2">
              {classes.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/teacher/attendance?classId=${c.id}&date=${selectedDate}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    c.id === selectedClassId
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {c.name}
                </Link>
              ))}
              {classes.length === 0 && (
                <p className="text-sm text-gray-400">Aucune classe attribuée.</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Date
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                defaultValue={selectedDate}
                max={today}
                onChange={e => {
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href)
                    url.searchParams.set('date', e.target.value)
                    window.location.href = url.toString()
                  }
                }}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedDate !== today && (
                <Link
                  href={`/teacher/attendance?classId=${selectedClassId}&date=${today}`}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Aujourd&apos;hui
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* En-tête résultat */}
      {selectedClass && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">{selectedClass.name}</h2>
            <p className="text-xs text-gray-500">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })} · {students.length} élèves
            </p>
          </div>
        </div>
      )}

      {!selectedClassId ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm text-gray-400">Sélectionnez une classe pour faire l&apos;appel</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">Aucun élève inscrit dans cette classe.</p>
        </div>
      ) : (
        <AttendanceSheet
          students={students as any}
          classId={selectedClassId}
          date={selectedDate}
        />
      )}
    </div>
  )
}
