'use client'

import { useRef, useState, useTransition } from 'react'
import { importStudentsFromCSV } from '@/actions/admin'

interface ImportResult {
  created: number
  errors: { row: number; reason: string }[]
  passwords: { email: string; tempPassword: string }[]
}

export function ImportStudentsForm() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setParseError(null)
    setResult(null)

    const file = fileRef.current?.files?.[0]
    if (!file) {
      setParseError('Veuillez sélectionner un fichier CSV.')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      const formData = new FormData()
      formData.append('csv', content)

      startTransition(async () => {
        const res = await importStudentsFromCSV(null, formData)
        if (res.success) {
          setResult(res.data as ImportResult)
        } else {
          setParseError(res.error)
        }
      })
    }
    reader.readAsText(file, 'UTF-8')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fichier CSV
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition cursor-pointer"
            onClick={() => fileRef.current?.click()}>
            <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 mb-1">Cliquez pour choisir un fichier CSV</p>
            <p className="text-xs text-gray-400">ou glissez-déposez ici</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const name = e.target.files?.[0]?.name
                if (name) {
                  const el = e.target.previousElementSibling?.previousElementSibling as HTMLElement
                  if (el) el.textContent = name
                }
              }}
            />
          </div>
        </div>

        {parseError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {parseError}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                     text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Import en cours...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importer les élèves
            </>
          )}
        </button>
      </form>

      {/* Résultats */}
      {result && (
        <div className="mt-6">
          <div className={`rounded-lg p-4 mb-4 ${result.created > 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <p className={`text-sm font-semibold ${result.created > 0 ? 'text-green-800' : 'text-yellow-800'}`}>
              {result.created > 0
                ? `✅ ${result.created} élève${result.created > 1 ? 's' : ''} importé${result.created > 1 ? 's' : ''} avec succès`
                : '⚠️ Aucun élève importé'}
              {result.errors.length > 0 && ` · ${result.errors.length} erreur${result.errors.length > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Mots de passe générés */}
          {result.passwords.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Mots de passe temporaires — à transmettre aux élèves
              </h4>
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Email</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Mot de passe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.passwords.map((p, i) => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="px-3 py-2 text-gray-700">{p.email}</td>
                        <td className="px-3 py-2 font-mono text-blue-700">{p.tempPassword}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                💡 Copiez ces informations maintenant — elles ne seront plus accessibles.
              </p>
            </div>
          )}

          {/* Erreurs */}
          {result.errors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2">
                Lignes avec erreurs
              </h4>
              <div className="bg-red-50 rounded-lg border border-red-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-red-100">
                      <th className="text-left px-3 py-2 font-medium text-red-700">Ligne</th>
                      <th className="text-left px-3 py-2 font-medium text-red-700">Raison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, i) => (
                      <tr key={i} className="border-t border-red-200">
                        <td className="px-3 py-2 text-red-700 font-mono">{err.row}</td>
                        <td className="px-3 py-2 text-red-700">{err.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
