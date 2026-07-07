import { publicPrisma } from '@/lib/db/public'
import { EnrollForm } from './enroll-form'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function EnrollPage({ params }: Props) {
  const { slug } = await params

  const school = await (publicPrisma as any).school.findFirst({
    where: { slug, status: { in: ['ACTIVE', 'TRIAL'] } },
    select: { name: true, city: true, slug: true, logoUrl: true },
  })

  if (!school) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
          {school.city && <p className="text-gray-500 text-sm">{school.city}</p>}
          <p className="text-blue-600 font-medium mt-2">Demande d'inscription en ligne</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-white font-semibold">Formulaire de candidature</h2>
            <p className="text-blue-200 text-sm mt-0.5">
              Remplissez tous les champs requis. Nous vous répondrons dans les meilleurs délais.
            </p>
          </div>
          <EnrollForm slug={slug} />
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Propulsé par <span className="font-semibold text-blue-600">MyClassLink</span>
        </p>
      </div>
    </div>
  )
}
