'use client'

import { useState } from 'react'
import { translateText } from '@/actions/ai'

const LANGUAGES: { code: 'en' | 'es' | 'ar' | 'pt' | 'de'; label: string }[] = [
  { code: 'en', label: 'Anglais' },
  { code: 'es', label: 'Espagnol' },
  { code: 'ar', label: 'Arabe' },
  { code: 'pt', label: 'Portugais' },
  { code: 'de', label: 'Allemand' },
]

interface Props {
  title: string
  content: string
  createdAt: string
  isPinned?: boolean
}

export function AnnouncementItem({ title, content, createdAt, isPinned }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [translated, setTranslated] = useState<string | null>(null)

  async function handleTranslate(lang: 'en' | 'es' | 'ar' | 'pt' | 'de') {
    setOpen(false)
    setError(null)
    setLoading(true)
    setTranslated(null)
    const result = await translateText({ text: `${title}. ${content}`, targetLang: lang })
    setLoading(false)
    if (result.success && result.data) {
      setTranslated(result.data)
    } else if (!result.success) {
      setError(result.error ?? 'Erreur de traduction.')
    }
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-2">
        {isPinned && (
          <span className="mt-0.5 inline-flex text-amber-500 flex-shrink-0">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setOpen(v => !v)}
                title="Traduire cette annonce"
                className="p-1 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </button>
              {open && (
                <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => handleTranslate(l.code)}
                      className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{content}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>

          {loading && (
            <p className="mt-2 text-xs text-gray-400 italic">Traduction en cours…</p>
          )}
          {error && (
            <p className="mt-2 text-xs text-orange-700 bg-orange-50 rounded-lg px-2 py-1.5">{error}</p>
          )}
          {translated && (
            <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Traduction</p>
              <p className="text-xs text-blue-900">{translated}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
