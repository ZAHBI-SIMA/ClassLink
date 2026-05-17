const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-green-50 border-green-200 text-green-800',
  'bg-purple-50 border-purple-200 text-purple-800',
  'bg-orange-50 border-orange-200 text-orange-800',
  'bg-pink-50 border-pink-200 text-pink-800',
  'bg-teal-50 border-teal-200 text-teal-800',
  'bg-yellow-50 border-yellow-200 text-yellow-800',
  'bg-red-50 border-red-200 text-red-800',
]

interface Slot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  room?: string | null
  subject_name: string
  subject_code?: string
  class_name?: string
  teacher_first?: string
  teacher_last?: string
}

interface Props {
  slots: Slot[]
  showTeacher?: boolean
  showClass?: boolean
}

export function ScheduleGrid({ slots, showTeacher = false, showClass = false }: Props) {
  // Collecter tous les créneaux horaires uniques
  const timePairs = Array.from(
    new Set(slots.map(s => `${s.start_time}|${s.end_time}`))
  ).sort().map(pair => {
    const [start, end] = pair.split('|')
    return { start, end }
  })

  // Palette de couleurs par matière
  const subjectColors: Record<string, string> = {}
  let colorIdx = 0
  for (const slot of slots) {
    if (!subjectColors[slot.subject_name]) {
      subjectColors[slot.subject_name] = COLORS[colorIdx % COLORS.length]
      colorIdx++
    }
  }

  // Jours réellement utilisés
  const usedDays = Array.from(new Set(slots.map(s => s.day_of_week))).sort()

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
        <p className="text-sm text-gray-400">Aucun créneau configuré.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-24 px-3 py-2 text-xs font-semibold text-gray-500 text-left bg-gray-50
                           border border-gray-200 rounded-tl-lg">
              Horaire
            </th>
            {usedDays.map(d => (
              <th key={d} className="px-3 py-2 text-xs font-semibold text-gray-700 text-center
                                     bg-gray-50 border border-gray-200 min-w-[140px]">
                {DAYS[d - 1]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timePairs.map(({ start, end }) => (
            <tr key={`${start}-${end}`}>
              <td className="px-3 py-2 text-xs text-gray-500 font-mono bg-gray-50 border border-gray-200 whitespace-nowrap">
                {start.slice(0, 5)} – {end.slice(0, 5)}
              </td>
              {usedDays.map(day => {
                const slot = slots.find(
                  s => s.day_of_week === day && s.start_time === start && s.end_time === end
                )
                return (
                  <td key={day} className="px-2 py-1.5 border border-gray-100 align-top">
                    {slot ? (
                      <div className={`rounded-lg border px-2 py-1.5 ${subjectColors[slot.subject_name]}`}>
                        <p className="font-semibold text-xs leading-tight">{slot.subject_name}</p>
                        {showClass && slot.class_name && (
                          <p className="text-xs opacity-70 mt-0.5">{slot.class_name}</p>
                        )}
                        {showTeacher && slot.teacher_first && (
                          <p className="text-xs opacity-70 mt-0.5">
                            {slot.teacher_first} {slot.teacher_last}
                          </p>
                        )}
                        {slot.room && (
                          <p className="text-xs opacity-60 mt-0.5">Salle {slot.room}</p>
                        )}
                      </div>
                    ) : (
                      <div className="h-full min-h-[40px]" />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
