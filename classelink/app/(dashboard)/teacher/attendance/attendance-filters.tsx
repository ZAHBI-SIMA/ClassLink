'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ClassItem {
  id:   string
  name: string
}

interface Props {
  classes:         ClassItem[]
  selectedClassId: string
  selectedDate:    string
  today:           string
}

export function AttendanceFilters({ classes, selectedClassId, selectedDate, today }: Props) {
  const router = useRouter()

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value
    if (!date) return
    const params = new URLSearchParams()
    if (selectedClassId) params.set('classId', selectedClassId)
    params.set('date', date)
    router.push(`/teacher/attendance?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="grid md:grid-cols-2 gap-5">
        {/* Sélection de classe */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Classe
          </label>
          <div className="flex flex-wrap gap-2">
            {classes.map(c => (
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

        {/* Sélection de date */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Date
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              defaultValue={selectedDate}
              max={today}
              onChange={handleDateChange}
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
  )
}
