'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { removeStudentFromClass, changeStudentClass, deleteStudent } from '@/actions/admin'

interface Props {
  studentId:   string
  studentName: string
  currentClass?: { id: string; name: string } | null
  classes:      { id: string; name: string; level_name: string }[]
}

export function StudentActions({ studentId, studentName, currentClass, classes }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // État modal suppression
  const [showDelete, setShowDelete]     = useState(false)
  const [confirmName, setConfirmName]   = useState('')
  const [deleteError, setDeleteError]   = useState('')

  // État modal changement de classe
  const [showClass, setShowClass]   = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const [classError, setClassError] = useState('')

  const [removeError, setRemoveError] = useState('')

  function handleRemove() {
    setRemoveError('')
    startTransition(async () => {
      const res = await removeStudentFromClass(studentId)
      if (!res.success) setRemoveError(res.error ?? 'Erreur')
      else router.refresh()
    })
  }

  function handleChangeClass() {
    if (!selectedClass) { setClassError('Sélectionnez une classe.'); return }
    setClassError('')
    startTransition(async () => {
      const res = await changeStudentClass(studentId, selectedClass)
      if (!res.success) setClassError(res.error ?? 'Erreur')
      else { setShowClass(false); router.refresh() }
    })
  }

  function handleDelete() {
    if (confirmName !== studentName) return
    setDeleteError('')
    startTransition(async () => {
      const res = await deleteStudent(studentId)
      if (!res.success) setDeleteError(res.error ?? 'Erreur')
      else router.push('/admin/students')
    })
  }

  return (
    <>
      {/* ── Gestion de la classe ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Gestion de la classe</h3>

        {currentClass ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">
              Classe actuelle : <strong>{currentClass.name}</strong>
            </span>
            <button
              onClick={() => { setShowClass(true); setSelectedClass('') }}
              className="px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
            >
              Changer de classe
            </button>
            <button
              onClick={handleRemove}
              disabled={pending}
              className="px-3 py-1.5 text-xs font-medium bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition disabled:opacity-50"
            >
              Retirer de la classe
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-400">Aucune classe assignée.</span>
            <button
              onClick={() => { setShowClass(true); setSelectedClass('') }}
              className="px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
            >
              Affecter une classe
            </button>
          </div>
        )}
        {removeError && <p className="text-xs text-red-600">{removeError}</p>}
      </div>

      {/* ── Zone dangereuse ── */}
      <div className="bg-white rounded-xl border border-red-200 p-5">
        <h3 className="text-sm font-semibold text-red-700 mb-3">Zone dangereuse</h3>
        <p className="text-xs text-gray-500 mb-3">
          La suppression de l'élève est irréversible. Toutes ses notes, absences et paiements seront effacés.
        </p>
        <button
          onClick={() => { setShowDelete(true); setConfirmName(''); setDeleteError('') }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
        >
          Supprimer l'élève
        </button>
      </div>

      {/* ── Modal : changer de classe ── */}
      {showClass && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              {currentClass ? 'Changer de classe' : 'Affecter une classe'}
            </h2>
            <p className="text-sm text-gray-500">
              Sélectionnez la nouvelle classe pour <strong>{studentName}</strong>.
            </p>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Choisir une classe —</option>
              {classes
                .filter(c => c.id !== currentClass?.id)
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.level_name})
                  </option>
                ))}
            </select>
            {classError && <p className="text-xs text-red-600">{classError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowClass(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={handleChangeClass}
                disabled={pending || !selectedClass}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
              >
                {pending ? 'En cours…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : supprimer l'élève ── */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-900">Supprimer l'élève</h2>
            </div>

            <p className="text-sm text-gray-600">
              Cette action est <strong>irréversible</strong>. Toutes les données de{' '}
              <strong>{studentName}</strong> seront définitivement supprimées.
            </p>
            <p className="text-sm text-gray-600">
              Tapez <strong className="font-mono bg-gray-100 px-1 rounded">{studentName}</strong> pour confirmer :
            </p>
            <input
              type="text"
              value={confirmName}
              onChange={e => setConfirmName(e.target.value)}
              placeholder={studentName}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={pending || confirmName !== studentName}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                {pending ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
