import { getBooks, getActiveLoans, getOverdueLoans } from '@/actions/library'
import { PageHeader } from '@/components/ui/page-header'
import { LibraryClient } from './library-client'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function LibraryPage({ searchParams }: Props) {
  const sp = await searchParams
  const activeTab = sp.tab === 'loans' ? 'loans' : sp.tab === 'overdue' ? 'overdue' : 'books'

  const [books, activeLoans, overdueLoans] = await Promise.all([
    getBooks(),
    getActiveLoans(),
    getOverdueLoans(),
  ])

  const totalBooks     = books.reduce((sum: number, b: any) => sum + (b.quantity ?? 0), 0)
  const availableBooks = books.reduce((sum: number, b: any) => sum + (b.available ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bibliothèque"
        description="Gestion du catalogue, des prêts et des retours de livres"
      />

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477
                   5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0
                   3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalBooks}</p>
            <p className="text-sm text-gray-500">Total livres</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{availableBooks}</p>
            <p className="text-sm text-gray-500">Livres disponibles</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
            ${overdueLoans.length > 0 ? 'bg-red-100' : 'bg-orange-100'}`}>
            <svg className={`w-6 h-6 ${overdueLoans.length > 0 ? 'text-red-600' : 'text-orange-600'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12
                   a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activeLoans.length}</p>
            <p className="text-sm text-gray-500">
              Prêts en cours
              {overdueLoans.length > 0 && (
                <span className="ml-1 text-xs text-red-600 font-semibold">
                  ({overdueLoans.length} en retard)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Onglets et tableaux (client) */}
      <LibraryClient
        books={books}
        activeLoans={activeLoans}
        overdueLoans={overdueLoans}
        activeTab={activeTab}
      />
    </div>
  )
}
