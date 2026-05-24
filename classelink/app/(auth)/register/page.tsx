import type { Metadata } from 'next'
import Link from 'next/link'
import { publicPrisma } from '@/lib/db/public'
import { RegisterForm } from './register-form'

export const metadata: Metadata = { title: 'Créer un compte établissement' }
export const runtime = 'nodejs'

interface Props {
  searchParams: Promise<{ plan?: string }>
}

export default async function RegisterPage({ searchParams }: Props) {
  const { plan: planSlug } = await searchParams
  const db = publicPrisma as any

  const slug = planSlug ?? 'gratuit'
  const plan =
    (await db.plan.findUnique({ where: { slug } })) ??
    (await db.plan.findUnique({ where: { slug: 'gratuit' } }))

  if (!plan) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-600">Aucun forfait disponible pour le moment.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-blue-600">Retour à l’accueil</Link>
      </div>
    )
  }

  return (
    <RegisterForm
      planSlug={plan.slug}
      planName={plan.name}
      planPrice={plan.priceMonthly}
    />
  )
}
