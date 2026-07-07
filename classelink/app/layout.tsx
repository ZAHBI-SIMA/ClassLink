import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NavigationProgress } from '@/components/layout/navigation-progress'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'MyClassLink — Gestion Scolaire Numérique',
    template: '%s | MyClassLink',
  },
  description:
    "Plateforme SaaS de gestion scolaire numérique pour les établissements africains.",
  keywords: ['gestion scolaire', 'school management', "Côte d'Ivoire", 'SaaS éducatif'],
  authors: [{ name: 'MyClassLink' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MyClassLink',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1800ad',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head />
      <body className="min-h-full bg-background text-foreground">
        <NavigationProgress />
        {children}
      </body>
    </html>
  )
}
