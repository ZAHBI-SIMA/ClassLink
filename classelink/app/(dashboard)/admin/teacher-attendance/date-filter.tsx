'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  selectedDate: string
  today: string
}

export function DateFilter({ selectedDate, today }: Props) {
  const router = useRouter()

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value
    if (!date) return
    router.push(`/admin/teacher-attendance?date=${date}`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
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
            href={`/admin/teacher-attendance?date=${today}`}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Aujourd&apos;hui
          </Link>
        )}
      </div>
    </div>
  )
}
