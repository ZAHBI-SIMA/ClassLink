import { getTeacherKPIs, getTeacherAssignments } from '@/actions/teacher'
import { auth } from '@/lib/auth'

export default async function TeacherDashboardPage() {
  const session = await auth()
  const user = session?.user as any
  const [kpis, assignments] = await Promise.all([
    getTeacherKPIs(),
    getTeacherAssignments(),
  ])

  const KPIS = [
    { label: 'Classes', value: kpis.class_count, color: 'blue' },
    { label: 'Matières enseignées', value: kpis.subject_count, color: 'indigo' },
    { label: 'Élèves au total', value: kpis.student_count, color: 'green' },
    { label: 'Notes saisies (30j)', value: kpis.grades_entered_30d, color: 'orange' },
  ] as const

  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user?.firstName ?? 'Enseignant'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Voici un aperçu de votre activité</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPIS.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${colorMap[k.color].split(' ')[1]}`}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Mes classes & matières */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Mes attributions (année en cours)</h2>
        </div>
        {assignments.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            Aucune attribution pour l&apos;année en cours.<br />
            Contactez votre administrateur.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {assignments.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {a.subject_name}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">({a.subject_code})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {a.class_name}
                  </span>
                  <span className="text-xs text-gray-400">{a.student_count} élèves</span>
                  <a
                    href={`/teacher/grades?classId=${a.class_id}&subjectId=${a.subject_id}`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Saisir notes →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
