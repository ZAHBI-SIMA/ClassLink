'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface SidebarContextValue {
  open: boolean
  toggle: () => void
  close: () => void
  setOpen: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Ferme le tiroir à chaque navigation (mobile)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Bloque le défilement de l'arrière-plan quand le tiroir est ouvert
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <SidebarContext.Provider
      value={{ open, toggle: () => setOpen(v => !v), close: () => setOpen(false), setOpen }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar doit être utilisé à l\'intérieur de <SidebarProvider>')
  return ctx
}
