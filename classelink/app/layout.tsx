import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ClasseLink — Gestion Scolaire Numérique',
    template: '%s | ClasseLink',
  },
  description:
    "Plateforme SaaS de gestion scolaire numérique pour les établissements africains.",
  keywords: ['gestion scolaire', 'school management', "Côte d'Ivoire", 'SaaS éducatif'],
  authors: [{ name: 'ClasseLink' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ClasseLink',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head />
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  )
}
