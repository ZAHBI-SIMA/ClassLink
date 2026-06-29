'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Intervalle de rafraîchissement automatique des données (ms). */
const REFRESH_INTERVAL_MS = 15_000

/**
 * Rafraîchit automatiquement les données de la page courante toutes les 15 s.
 *
 * Utilise `router.refresh()` : re-exécute les Server Components et récupère des
 * données fraîches côté serveur, tout en préservant le scroll, l'état des
 * formulaires et le reste de l'UI cliente (aucun rechargement complet).
 *
 * Le rafraîchissement est mis en pause quand l'onglet passe en arrière-plan,
 * et déclenché immédiatement dès le retour sur l'onglet.
 */
export function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined

    const stop = () => {
      if (interval) clearInterval(interval)
      interval = undefined
    }
    const start = () => {
      stop()
      interval = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS)
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop()
      } else {
        router.refresh()
        start()
      }
    }

    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [router])

  return null
}
