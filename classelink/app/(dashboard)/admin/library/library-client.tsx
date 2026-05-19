'use client'

import { useState } from 'react'
import { returnBook, deleteBook } from '@/actions/library'
import { BookModal } from './book-modal'
import { LoanModal } from './loan-modal'

interface Book {
  id: string
  title: string
  author: string
  category: string | null
  quantity: number
  available: number
  location: string | null
}

interface Loan {
  id: string
  book_title: string
  author: string
  borrower_name: string | null
  borrower_type: string
  loaned_at: string | Date
  due_date: string | Date
  status: string
  overdue_duration?: string | null
}

interface Props {
  books: Book[]
  activeLoans: Loan[]
  overdueLoans: Loan[]
  activeTab: string
}

function formatDate(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function LibraryClient({ books, activeLoans, overdueLoans, activeTab }: Props) {
  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [loanModal, setLoanModal] = useState<{ open: boolean; bookId: string; bookTitle: string }>({
    open: false, bookId: '', bookTitle: '',
  })
  const [returning, setReturning] = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  async function handleReturn(loanId: string) {
    setReturning(loanId)
    await returnBook(loanId)
    setReturning(null)
  }

  async function handleDelete(bookId: string) {
    if (!confirm('Supprimer ce livre définitivement ?')) return
    setDeleting(bookId)
    await deleteBook(bookId)
    setDeleting(null)
  }

  function openLoan(book: Book) {
    setLoanModal({ open: true, bookId: book.id, bookTitle: book.title })
  }

  const tabs = [
    { key: 'books',   label: 'Livres',        count: books.length },
    { key: 'loans',   label: 'Prêts actifs',  count: activeLoans.length },
    { key: 'overdue', label: 'En retard',      count: overdueLoans.length },
  ]

  return (
    <>
      {/* Bouton ajouter + onglets */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <a
              key={tab.key}
              href={`?tab=${tab.key}`}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition
                ${activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold
                  ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {tab.count}
                </span>
              )}
            </a>
          ))}
        </div>

        <button
          onClick={() => setBookModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white
                     text-sm font-medium hover:bg-blue-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un livre
        </button>
      </div>

      {/* Onglet Livres */}
      {activeTab === 'books' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {books.length === 0 ? (
            <div className="py-16 text-center text-gray-400 italic text-sm">
              Aucun livre dans la bibliothèque.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Titre', 'Auteur', 'Catégorie', 'Dispo / Total', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{book.title}</p>
                      {book.location && (
                        <p className="text-xs text-gray-400">{book.location}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{book.author}</td>
                    <td className="px-4 py-3">
                      {book.category ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                                         bg-purple-100 text-purple-700 border border-purple-200">
                          {book.category}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${book.available > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {book.available}
                      </span>
                      <span className="text-gray-400 text-xs"> / {book.quantity}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openLoan(book)}
                          disabled={book.available <= 0}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600
                                     border border-blue-200 hover:bg-blue-50 disabled:opacity-40
                                     disabled:cursor-not-allowed transition"
                        >
                          Prêter
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          disabled={deleting === book.id}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600
                                     border border-red-200 hover:bg-red-50 disabled:opacity-40 transition"
                        >
                          {deleting === book.id ? '…' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Onglet Prêts actifs */}
      {activeTab === 'loans' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {activeLoans.length === 0 ? (
            <div className="py-16 text-center text-gray-400 italic text-sm">
              Aucun prêt actif en ce moment.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Livre', 'Emprunteur', 'Date prêt', 'Retour prévu', 'Retour'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeLoans.map((loan) => {
                  const dueDate = new Date(loan.due_date)
                  const isLate  = dueDate < new Date()
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{loan.book_title}</p>
                        <p className="text-xs text-gray-400">{loan.author}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{loan.borrower_name ?? '—'}</p>
                        <p className="text-xs text-gray-400 capitalize">{loan.borrower_type}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(loan.loaned_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${isLate ? 'text-red-600' : 'text-gray-700'}`}>
                          {formatDate(loan.due_date)}
                        </span>
                        {isLate && (
                          <span className="ml-1 inline-flex px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">
                            retard
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleReturn(loan.id)}
                          disabled={returning === loan.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-green-700
                                     border border-green-200 hover:bg-green-50 disabled:opacity-50 transition"
                        >
                          {returning === loan.id ? '…' : 'Retourner'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Onglet En retard */}
      {activeTab === 'overdue' && (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          {overdueLoans.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-green-600 font-medium">Aucun prêt en retard</p>
              <p className="text-sm text-gray-400 mt-1">Tous les retours sont dans les délais.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-red-50 border-b border-red-200">
                <tr>
                  {['Livre', 'Emprunteur', 'Date prêt', 'Retour prévu', 'Retard', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-red-600 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {overdueLoans.map((loan) => {
                  const daysLate = loan.overdue_duration
                    ? Math.floor(
                        (new Date().getTime() - new Date(loan.due_date).getTime()) / (1000 * 60 * 60 * 24)
                      )
                    : null
                  return (
                    <tr key={loan.id} className="hover:bg-red-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{loan.book_title}</p>
                        <p className="text-xs text-gray-400">{loan.author}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{loan.borrower_name ?? '—'}</p>
                        <p className="text-xs text-gray-400 capitalize">{loan.borrower_type}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(loan.loaned_at)}</td>
                      <td className="px-4 py-3 text-xs text-red-700 font-semibold">{formatDate(loan.due_date)}</td>
                      <td className="px-4 py-3">
                        {daysLate !== null && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            +{daysLate} j
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleReturn(loan.id)}
                          disabled={returning === loan.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white
                                     bg-red-600 hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          {returning === loan.id ? '…' : 'Marquer retourné'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modaux */}
      <BookModal open={bookModalOpen} onClose={() => setBookModalOpen(false)} />
      <LoanModal
        open={loanModal.open}
        onClose={() => setLoanModal(prev => ({ ...prev, open: false }))}
        bookId={loanModal.bookId}
        bookTitle={loanModal.bookTitle}
      />
    </>
  )
}
