import { getTeacherAttendance } from '@/actions/admin'
import { DateFilter } from './date-filter'
import { TeacherAttendanceSheet } from './teacher-attendance-sheet'

interface Props {
  searchParams: Promise<{ date?: string }>
}

export default async function TeacherAttendancePage({ searchParams }: Props) {
  const params = await searchParams
  const today  = new Date().toISOString().split('T')[0]
  const selectedDate = params.date ?? today

  const teachers = await getTeacherAttendance(selectedDate)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Présence des enseignants</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enregistrez la présence quotidienne du corps enseignant.
        </p>
      </div>

      <DateFilter selectedDate={selectedDate} today={today} />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </h2>
          <p className="text-xs text-gray-500">{teachers.length} enseignant{teachers.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {teachers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">Aucun enseignant actif dans l&apos;établissement.</p>
        </div>
      ) : (
        <TeacherAttendanceSheet teachers={teachers as any} date={selectedDate} />
      )}
    </div>
  )
}
