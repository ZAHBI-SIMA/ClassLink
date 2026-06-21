'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'cl-sidebar-collapsed'

/**
 * État réduit/agrandi de la barre latérale, partagé entre tous les espaces
 * via localStorage. Hydratation sûre : démarre toujours « agrandi » côté
 * serveur puis se synchronise avec la préférence stockée au montage.
 */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setCollapsed(true)
    } catch {
      // localStorage indisponible (mode privé strict) — on ignore
    }
  }, [])

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }

  return { collapsed, toggle }
}
