'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Barre de progression globale affichée en haut de l'écran pendant les
 * navigations. Donne un retour immédiat au clic — indispensable sur réseau
 * lent, où le squelette de la page cible peut ne pas être préchargé.
 *
 * Démarrage : clic sur un lien interne (délégation au niveau document).
 * Fin : changement effectif de pathname (ou délai de sécurité).
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const startedFrom = useRef<string | null>(null)

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  /* Démarrage sur clic de lien interne */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      // Même page (ancre ou lien identique) : rien à charger
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      startedFrom.current = window.location.pathname
      clearTimers()
      setVisible(true)
      setProgress(12)
      // Progression simulée, de plus en plus lente, jamais 100 % avant l'arrivée
      timers.current.push(
        setTimeout(() => setProgress(35), 150),
        setTimeout(() => setProgress(55), 450),
        setTimeout(() => setProgress(72), 1000),
        setTimeout(() => setProgress(85), 2200),
        setTimeout(() => setProgress(92), 4500),
        // Sécurité : on masque après 15 s quoi qu'il arrive
        setTimeout(() => { setVisible(false); setProgress(0) }, 15000),
      )
    }
    // Phase capture : Next <Link> annule l'événement (preventDefault) pour la
    // navigation client avant la phase bubble — il faut donc écouter avant lui.
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Fin de navigation : le pathname a changé */
  useEffect(() => {
    if (startedFrom.current === null || pathname === startedFrom.current) return
    startedFrom.current = null
    clearTimers()
    setProgress(100)
    timers.current.push(
      setTimeout(() => { setVisible(false); setProgress(0) }, 250),
    )
  }, [pathname])

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 shadow-[0_0_8px_rgba(24,0,173,0.5)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
