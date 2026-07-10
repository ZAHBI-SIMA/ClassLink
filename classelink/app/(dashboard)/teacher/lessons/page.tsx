import {
  getTeacherLessons,
  getTeacherSubjectsAndClasses,
  getTeacherScheduleList,
  deleteLesson,
} from '@/actions/assignments'
import { CreateLessonForm } from './create-form'
import { LessonsSummary } from './lessons-summary'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ classId?: string; subjectId?: string }>
}

function formatDate(d: string | Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

async function DeleteLessonButton({ id }: { id: string }) {
  async function doDelete() {
    'use server'
    await deleteLesson(id)
  }
  return (
    <form action={doDelete}>
      <button
        type="submit"
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200
                   hover:bg-red-50 transition"
      >
        Supprimer
      </button>
    </form>
  )
}

export default async function TeacherLessonsPage({ searchParams }: Props) {
  const params    = await searchParams
  const classId   = params.classId   ?? undefined
  const subjectId = params.subjectId ?? undefined

  const [tscList, scheduleList, lessons] = await Promise.all([
    getTeacherSubjectsAndClasses(),
    getTeacherScheduleList(),
    getTeacherLessons(classId, subjectId),
  ])

  // Build unique class / subject pill lists from tscList
  const classes  = Array.from(new Map(tscList.map((t: any) => [t.class_id,   { id: t.class_id,   name: t.class_name }])).values())
  const subjects = Array.from(new Map(tscList.map((t: any) => [t.subject_id, { id: t.subject_id, name: t.subject_name }])).values())

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cahier de texte</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enregistrez le contenu des cours, le travail maison et preparez le prochain cours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : filtres + liste */}
        <div className="lg:col-span-2 space-y-5">
          {/* Filtres */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            {/* Filtre classe */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Classe</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/teacher/lessons${subjectId ? `?subjectId=${subjectId}` : ''}`}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                    !classId
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  Toutes
                </Link>
                {classes.map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/teacher/lessons?classId=${c.id}${subjectId ? `&subjectId=${subjectId}` : ''}`}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                      classId === c.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Filtre matière */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Matière</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/teacher/lessons${classId ? `?classId=${classId}` : ''}`}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                    !subjectId
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  Toutes
                </Link>
                {subjects.map((s: any) => (
                  <Link
                    key={s.id}
                    href={`/teacher/lessons?subjectId=${s.id}${classId ? `&classId=${classId}` : ''}`}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                      subjectId === s.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <LessonsSummary lessons={lessons as any} />

          {/* Liste des entrees */}
          {lessons.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <p className="text-sm text-gray-400">Aucune entree dans le cahier de texte.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((l: any) => (
                <div key={l.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-500">
                          {formatDate(l.date)}
                        </span>
                        {l.subject_name && (
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs rounded px-2 py-0.5">
                            {l.subject_code ?? l.subject_name}
                          </span>
                        )}
                        {l.class_name && (
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs rounded px-2 py-0.5">
                            {l.class_name}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-gray-900">{l.title}</h3>

                      {l.content && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Contenu traite</p>
                          <p className="text-sm text-gray-700 line-clamp-3">{l.content}</p>
                        </div>
                      )}

                      {l.next_content && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Prochain cours</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{l.next_content}</p>
                        </div>
                      )}

                      {l.homework && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                          <p className="text-xs font-medium text-yellow-700 mb-0.5">Travail maison</p>
                          <p className="text-sm text-yellow-800">{l.homework}</p>
                        </div>
                      )}
                    </div>

                    <DeleteLessonButton id={l.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite : formulaire */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            {tscList.length > 0 ? (
              <CreateLessonForm tscList={tscList} scheduleList={scheduleList} />
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                Aucune attribution trouvee pour l&apos;annee en cours.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
