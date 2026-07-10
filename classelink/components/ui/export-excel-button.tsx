'use client'

import * as XLSX from 'xlsx'

interface Props {
  /** Lignes déjà calculées côté appelant : { "Libellé colonne": valeur }. */
  rows: Record<string, string | number | null>[]
  filename: string
  sheetName?: string
  label?: string
  className?: string
}

export function ExportExcelButton({
  rows,
  filename,
  sheetName = 'Feuille1',
  label = 'Exporter',
  className,
}: Props) {
  function handleExport() {
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      className={
        className ??
        'inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm font-medium rounded-lg transition'
      }
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {label}
    </button>
  )
}
