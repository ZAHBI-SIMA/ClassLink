import { getTeacherSchedule } from '@/actions/teacher'
import { ScheduleGrid } from '@/components/schedule/schedule-grid'

export default async function TeacherSchedulePage() {
  const slots = await getTeacherSchedule()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon emploi du temps</h1>
        <p className="text-sm text-gray-500 mt-1">Vos créneaux de cours pour la semaine.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <ScheduleGrid slots={slots as any[]} showClass />
      </div>

      {slots.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Jour</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Horaire</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Matière</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Classe</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Salle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(slots as any[]).map((slot: any) => (
                <tr key={slot.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-700">
                    {['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][slot.day_of_week]}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">
                    {String(slot.start_time).slice(0, 5)} – {String(slot.end_time).slice(0, 5)}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{slot.subject_name}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {slot.class_name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 hidden md:table-cell">{slot.room ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
