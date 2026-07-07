import type { Metadata } from 'next'
import { getPlans } from '@/actions/super-admin'
import { CreateSchoolForm } from './create-school-form'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Ajouter un établissement' }

export default async function NewSchoolPage() {
  const plans = await getPlans()

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/super-admin/schools"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Nouvel établissement</h2>
          <p className="text-sm text-gray-500">Créer une nouvelle école sur MyClassLink</p>
        </div>
      </div>
      <CreateSchoolForm plans={plans} />
    </div>
  )
}
