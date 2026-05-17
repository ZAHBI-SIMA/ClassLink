import { getStudentSchedule } from '@/actions/student'
import { ScheduleGrid } from '@/components/schedule/schedule-grid'

export default async function StudentSchedulePage() {
  const slots = await getStudentSchedule()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon emploi du temps</h1>
        <p className="text-sm text-gray-500 mt-1">Vos cours de la semaine.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <ScheduleGrid slots={slots as any[]} showTeacher />
      </div>
    </div>
  )
}
