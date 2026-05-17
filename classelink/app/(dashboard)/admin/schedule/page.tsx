import { getClasses, getSchedule, getTscForClass } from '@/actions/admin'
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

  const [slots, tscList] = selectedClassId
    ? await Promise.all([getSchedule(selectedClassId), getTscForClass(selectedClassId)])
    : [[], []]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emploi du temps</h1>
        <p className="text-sm text-gray-500 mt-1">Configurez les créneaux horaires par classe.</p>
      </div>

      {/* Sélecteur classe */}
      <div className="flex flex-wrap gap-2">
        {classes.map((c: any) => (
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

      {selectedClassId ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Grille */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                {selectedClass?.name ?? 'Classe'}
              </h2>
              <ScheduleGrid slots={slots as any[]} showTeacher />
            </div>

            {/* Liste des créneaux avec suppression */}
            {(slots as any[]).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Jour</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Horaire</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Matière</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Enseignant</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Salle</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(slots as any[]).map((slot: any) => (
                      <tr key={slot.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-700">{DAYS[slot.day_of_week]}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-600">
                          {String(slot.start_time).slice(0, 5)} – {String(slot.end_time).slice(0, 5)}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{slot.subject_name}</td>
                        <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">
                          {slot.teacher_first} {slot.teacher_last}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 hidden md:table-cell">
                          {slot.room ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <DeleteSlotButton slotId={slot.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Formulaire ajout */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Ajouter un créneau</h3>
              {tscList.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  Aucun enseignant affecté à cette classe. Configurez les affectations d&apos;abord.
                </p>
              ) : (
                <AddSlotForm classId={selectedClassId} tscList={tscList as any[]} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-20 text-center">
          <p className="text-sm text-gray-400">Aucune classe configurée.</p>
        </div>
      )}
    </div>
  )
}
