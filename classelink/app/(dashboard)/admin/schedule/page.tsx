import { getClasses, getSchedule, getScheduleFormData } from '@/actions/admin'
import { ScheduleGrid } from '@/components/schedule/schedule-grid'
import { DeleteSlotButton } from '@/components/schedule/delete-slot-button'
import { AddSlotForm } from './add-slot-form'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ classId?: string }>
}

const DAYS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export const metadata = { title: 'Emploi du temps' }

export default async function SchedulePage({ searchParams }: Props) {
  const params  = await searchParams
  const classes = await getClasses()
  const selectedClassId = params.classId ?? (classes[0]?.id ?? '')
  const selectedClass   = classes.find((c: any) => c.id === selectedClassId)

  const [slots, formData] = selectedClassId
    ? await Promise.all([
        getSchedule(selectedClassId),
        getScheduleFormData(selectedClassId),
      ])
    : [[], { teachers: [], subjects: [] }]

  const slotsByDay: Record<number, any[]> = {}
  for (const slot of slots as any[]) {
    if (!slotsByDay[slot.day_of_week]) slotsByDay[slot.day_of_week] = []
    slotsByDay[slot.day_of_week].push(slot)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emploi du temps</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sélectionnez une classe puis ajoutez les créneaux horaires.
        </p>
      </div>

      {/* Sélecteur classe */}
      {classes.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Aucune classe créée.{' '}
          <Link href="/admin/classes" className="underline font-medium">
            Créer des classes →
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(classes as any[]).map((c: any) => (
            <Link key={c.id} href={`/admin/schedule?classId=${c.id}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                c.id === selectedClassId
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}>
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {selectedClassId && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

          {/* Colonne principale : grille + liste */}
          <div className="lg:col-span-3 space-y-5">

            {/* Grille visuelle */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  {selectedClass?.name} — Vue hebdomadaire
                </h2>
                <span className="text-xs text-gray-400">
                  {(slots as any[]).length} créneau{(slots as any[]).length !== 1 ? 'x' : ''}
                </span>
              </div>
              <ScheduleGrid slots={slots as any[]} showTeacher />
            </div>

            {/* Liste détaillée par jour */}
            {(slots as any[]).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Détail des créneaux</h3>
                </div>
                {[1, 2, 3, 4, 5, 6].map(day => {
                  const daySlots = slotsByDay[day] ?? []
                  if (daySlots.length === 0) return null
                  return (
                    <div key={day}>
                      <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {DAYS[day]}
                        </span>
                      </div>
                      {daySlots
                        .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
                        .map((slot: any) => (
                          <div key={slot.id}
                            className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-0">
                            <span className="text-xs font-mono text-gray-500 w-24 flex-shrink-0">
                              {String(slot.start_time).slice(0, 5)} – {String(slot.end_time).slice(0, 5)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-900">{slot.subject_name}</span>
                              <span className="text-xs text-gray-400 ml-2">
                                {slot.teacher_first} {slot.teacher_last}
                              </span>
                            </div>
                            {slot.room && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex-shrink-0">
                                {slot.room}
                              </span>
                            )}
                            <DeleteSlotButton slotId={slot.id} />
                          </div>
                        ))}
                    </div>
                  )
                })}
              </div>
            )}

            {(slots as any[]).length === 0 && (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-400">Aucun créneau pour cette classe.</p>
                <p className="text-xs text-gray-400 mt-1">Utilisez le formulaire pour ajouter des cours.</p>
              </div>
            )}
          </div>

          {/* Colonne formulaire */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Ajouter un créneau</h3>
              <AddSlotForm
                classId={selectedClassId}
                teachers={formData.teachers}
                subjects={formData.subjects}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
