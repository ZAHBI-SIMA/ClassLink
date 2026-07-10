'use client'

import { useState } from 'react'
import { summarizeLesson } from '@/actions/ai'

interface Lesson {
  title: string
  content: string | null
  date: string | Date
}

interface Props {
  lessons: Lesson[]
}

/** Résume avec l'IA l'ensemble des entrées de cahier de texte actuellement affichées (filtre classe/matière). */
export function LessonsSummary({ lessons }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)

  const withContent = lessons.filter(l => l.content?.trim())

  async function handleSummarize() {
    setError(null)
    setSummary(null)
    setLoading(true)

    const combined = withContent
      .map(l => `${new Date(l.date).toLocaleDateString('fr-FR')} — ${l.title}: ${l.content}`)
      .join('\n')

    const result = await summarizeLesson({ title: `${withContent.length} séance(s)`, content: combined })
    setLoading(false)
    if (result.success && result.data) {
      setSummary(result.data)
    } else if (!result.success) {
      setError(result.error ?? 'Erreur de résumé.')
    }
  }

  if (withContent.length === 0) return null

  return (
    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-violet-900">Résumé du programme</p>
          <p className="text-xs text-violet-600">
            Générer un résumé IA des {withContent.length} séance{withContent.length > 1 ? 's' : ''} affichée{withContent.length > 1 ? 's' : ''}.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSummarize}
          disabled={loading}
          className="flex-shrink-0 px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold
                     hover:bg-violet-700 disabled:opacity-50 transition"
        >
          {loading ? 'Génération…' : 'Résumer avec l\'IA'}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-orange-700 bg-orange-100 rounded-lg px-3 py-2">{error}</p>
      )}
      {summary && (
        <div className="mt-3 bg-white rounded-lg p-3 border border-violet-100">
          <p className="text-xs text-gray-700 whitespace-pre-line">{summary}</p>
        </div>
      )}
    </div>
  )
}
