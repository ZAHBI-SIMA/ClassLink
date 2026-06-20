'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

async function getDb() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

async function getAdminDb() {
  const session = await requireRole('ADMIN')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

async function getAnyRoleDb() {
  const session = await requireRole('ADMIN', 'CENSOR', 'TEACHER', 'STUDENT', 'PARENT')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

// ─── Liste des livres ─────────────────────────────────────────────────────────
export async function getBooks(
  search?: string,
  category?: string
): Promise<any[]> {
  const { db } = await getAnyRoleDb()

  const params: any[] = []
  const conditions: string[] = []

  if (search) {
    params.push(`%${search}%`)
    const n = params.length
    conditions.push(`(b.title ILIKE $${n} OR b.author ILIKE $${n})`)
  }
  if (category) {
    params.push(category)
    conditions.push(`b.category = $${params.length}`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  return db.$queryRawUnsafe(`
    SELECT
      b.id, b.title, b.author, b.isbn, b.category,
      b.quantity, b.available, b.location, b.description,
      b.created_at,
      COUNT(bl.id) FILTER (WHERE bl.status = 'ACTIVE')::int AS active_loans
    FROM books b
    LEFT JOIN book_loans bl ON bl.book_id = b.id
    ${where}
    GROUP BY b.id
    ORDER BY b.title
  `, ...params)
}

// ─── Créer un livre ───────────────────────────────────────────────────────────
export async function createBook(
  prevState: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const { db } = await getAdminDb()

  const title       = formData.get('title')       as string
  const author      = formData.get('author')      as string
  const isbn        = formData.get('isbn')        as string | null
  const category    = formData.get('category')    as string | null
  const quantity    = parseInt(formData.get('quantity') as string ?? '1', 10)
  const location    = formData.get('location')    as string | null
  const description = formData.get('description') as string | null

  if (!title || !author) {
    return { success: false, error: 'Titre et auteur sont requis.' }
  }

  try {
    const rows: any[] = await db.$queryRaw`
      INSERT INTO books (title, author, isbn, category, quantity, available, location, description)
      VALUES (${title}, ${author}, ${isbn ?? null}, ${category ?? null},
              ${quantity}, ${quantity}, ${location ?? null}, ${description ?? null})
      RETURNING id
    `
    revalidatePath('/admin/library')
    return { success: true, data: { id: rows[0].id } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Mettre à jour un livre ───────────────────────────────────────────────────
export async function updateBook(
  bookId: string,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db } = await getAdminDb()

  const title       = formData.get('title')       as string
  const author      = formData.get('author')      as string
  const isbn        = formData.get('isbn')        as string | null
  const category    = formData.get('category')    as string | null
  const quantity    = parseInt(formData.get('quantity') as string ?? '1', 10)
  const location    = formData.get('location')    as string | null
  const description = formData.get('description') as string | null

  try {
    await db.$executeRaw`
      UPDATE books
      SET title       = ${title},
          author      = ${author},
          isbn        = ${isbn ?? null},
          category    = ${category ?? null},
          quantity    = ${quantity},
          location    = ${location ?? null},
          description = ${description ?? null},
          updated_at  = NOW()
      WHERE id = ${bookId}
    `
    revalidatePath('/admin/library')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Supprimer un livre ───────────────────────────────────────────────────────
export async function deleteBook(bookId: string): Promise<ActionResult> {
  const { db } = await getAdminDb()

  try {
    // Vérifier qu'il n'y a pas de prêt actif
    const activeLoans: any[] = await db.$queryRaw`
      SELECT id FROM book_loans
      WHERE book_id = ${bookId} AND status = 'ACTIVE'
      LIMIT 1
    `
    if (activeLoans[0]) {
      return { success: false, error: 'Ce livre a des prêts actifs et ne peut pas être supprimé.' }
    }

    await db.$executeRaw`DELETE FROM books WHERE id = ${bookId}`
    revalidatePath('/admin/library')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Emprunter un livre ───────────────────────────────────────────────────────
export async function loanBook(
  bookId: string,
  borrowerType: 'student' | 'teacher',
  borrowerId: string,
  dueDate: string
): Promise<ActionResult<{ id: string }>> {
  const { db } = await getAdminDb()

  try {
    // Vérifier la disponibilité
    const bookRows: any[] = await db.$queryRaw`
      SELECT id, available FROM books WHERE id = ${bookId} LIMIT 1
    `
    const book = bookRows[0]
    if (!book) return { success: false, error: 'Livre introuvable.' }
    if (book.available <= 0) return { success: false, error: 'Aucun exemplaire disponible.' }

    const rows: any[] = await db.$queryRaw`
      INSERT INTO book_loans (book_id, borrower_type, borrower_id, due_date, status, loaned_at)
      VALUES (${bookId}, ${borrowerType}, ${borrowerId}, ${new Date(dueDate)}, 'ACTIVE', NOW())
      RETURNING id
    `
    await db.$executeRaw`
      UPDATE books SET available = available - 1, updated_at = NOW()
      WHERE id = ${bookId}
    `
    revalidatePath('/admin/library')
    return { success: true, data: { id: rows[0].id } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Retourner un livre ───────────────────────────────────────────────────────
export async function returnBook(loanId: string): Promise<ActionResult> {
  const { db } = await getAdminDb()

  try {
    const loanRows: any[] = await db.$queryRaw`
      SELECT id, book_id, status FROM book_loans WHERE id = ${loanId} LIMIT 1
    `
    const loan = loanRows[0]
    if (!loan) return { success: false, error: 'Prêt introuvable.' }
    if (loan.status === 'RETURNED') return { success: false, error: 'Ce livre a déjà été retourné.' }

    await db.$executeRaw`
      UPDATE book_loans
      SET status = 'RETURNED', returned_at = NOW(), updated_at = NOW()
      WHERE id = ${loanId}
    `
    await db.$executeRaw`
      UPDATE books SET available = available + 1, updated_at = NOW()
      WHERE id = ${loan.book_id}
    `
    revalidatePath('/admin/library')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Prêts actifs ─────────────────────────────────────────────────────────────
export async function getActiveLoans(): Promise<any[]> {
  const { db } = await getAdminDb()

  const rows: any[] = await db.$queryRaw`
    SELECT
      bl.id, bl.borrower_type, bl.borrower_id, bl.loaned_at, bl.due_date, bl.status,
      b.title AS book_title, b.author,
      CASE bl.borrower_type
        WHEN 'student' THEN (
          SELECT u.first_name || ' ' || u.last_name
          FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = bl.borrower_id
        )
        WHEN 'teacher' THEN (
          SELECT u.first_name || ' ' || u.last_name
          FROM teachers t JOIN users u ON u.id = t.user_id WHERE t.id = bl.borrower_id
        )
        ELSE NULL
      END AS borrower_name
    FROM book_loans bl
    JOIN books b ON b.id = bl.book_id
    WHERE bl.status = 'ACTIVE'
    ORDER BY bl.due_date ASC
  `
  return rows
}

// ─── Prêts en retard ─────────────────────────────────────────────────────────
export async function getOverdueLoans(): Promise<any[]> {
  const { db } = await getAdminDb()

  // Mettre à jour le statut des prêts en retard
  await db.$executeRaw`
    UPDATE book_loans
    SET status = 'OVERDUE', updated_at = NOW()
    WHERE status = 'ACTIVE' AND due_date < NOW()
  `

  const rows: any[] = await db.$queryRaw`
    SELECT
      bl.id, bl.borrower_type, bl.borrower_id, bl.loaned_at, bl.due_date, bl.status,
      b.title AS book_title, b.author,
      CASE bl.borrower_type
        WHEN 'student' THEN (
          SELECT u.first_name || ' ' || u.last_name
          FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = bl.borrower_id
        )
        WHEN 'teacher' THEN (
          SELECT u.first_name || ' ' || u.last_name
          FROM teachers t JOIN users u ON u.id = t.user_id WHERE t.id = bl.borrower_id
        )
        ELSE NULL
      END AS borrower_name,
      NOW() - bl.due_date AS overdue_duration
    FROM book_loans bl
    JOIN books b ON b.id = bl.book_id
    WHERE bl.status = 'OVERDUE'
    ORDER BY bl.due_date ASC
  `
  return rows
}
