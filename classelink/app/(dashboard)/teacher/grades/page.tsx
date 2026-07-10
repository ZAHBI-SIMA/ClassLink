import { getTeacherAssignments, getTeacherTerms, getStudentsWithGrades } from '@/actions/teacher'
import { GradeSheet } from './grade-sheet'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ classId?: string; subjectId?: string; termId?: string }>
}

export default async function TeacherGradesPage({ searchParams }: Props) {
  const params = await searchParams
  const [assignments, terms] = await Promise.all([
    getTeacherAssignments(),
    getTeacherTerms(),
  ])

  const selectedClassId   = params.classId   ?? ''
  const selectedSubjectId = params.subjectId ?? ''
  const selectedTermId    = params.termId    ?? (terms[0]?.id ?? '')

  const selectedAssignment = assignments.find(
    a => a.class_id === selectedClassId && a.subject_id === selectedSubjectId
  )

  const students = selectedClassId && selectedSubjectId && selectedTermId
    ? await getStudentsWithGrades(selectedClassId, selectedSubjectId, selectedTermId)
    : []

  const selectedTerm = terms.find(t => t.id === selectedTermId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saisie des notes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sélectionnez une classe, une matière et un trimestre pour saisir les notes.
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Classe + Matière */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Classe / Matière
            </label>
            <div className="flex flex-wrap gap-2">
              {assignments.map((a: any) => {
                const active = a.class_id === selectedClassId && a.subject_id === selectedSubjectId
                return (
                  <Link
                    key={a.id}
                    href={`/teacher/grades?classId=${a.class_id}&subjectId=${a.subject_id}&termId=${selectedTermId}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {a.class_name} — {a.subject_name}
                  </Link>
                )
              })}
              {assignments.length === 0 && (
                <p className="text-sm text-gray-400">Aucune attribution pour l&apos;année en cours.</p>
              )}
            </div>
          </div>

          {/* Trimestre */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Trimestre</label>
            <div className="flex flex-col gap-1.5">
              {terms.map((t: any) => {
                const active = t.id === selectedTermId
                return (
                  <Link
                    key={t.id}
                    href={`/teacher/grades?classId=${selectedClassId}&subjectId=${selectedSubjectId}&termId=${t.id}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-center transition ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {t.name}
                  </Link>
                )
              })}
              {terms.length === 0 && (
                <p className="text-sm text-gray-400">Aucun trimestre configuré.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* En-tête de saisie */}
      {selectedAssignment && selectedTerm && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {selectedAssignment.class_name} — {selectedAssignment.subject_name}
            </h2>
            <p className="text-xs text-gray-500">{selectedTerm.name} · {students.length} élèves</p>
          </div>
        </div>
      )}

      {/* Grille de notes */}
      {!selectedClassId || !selectedSubjectId ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm text-gray-400">Sélectionnez une classe et une matière ci-dessus</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">Aucun élève inscrit dans cette classe.</p>
        </div>
      ) : (
        <GradeSheet
          students={students as any}
          subjectId={selectedSubjectId}
          subjectName={selectedAssignment?.subject_name ?? ''}
          termId={selectedTermId}
        />
      )}
    </div>
  )
}
