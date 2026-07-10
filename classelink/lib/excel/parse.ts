'use client'

import * as XLSX from 'xlsx'

/**
 * Lit un fichier .xlsx / .xls / .csv côté client et retourne les lignes de la
 * première feuille sous forme d'objets { en-tête: valeur }. Les en-têtes sont
 * normalisés (minuscules, sans accents, espaces -> underscore) pour matcher
 * les noms de colonnes attendus par les imports (ex. "Prénom" -> "prenom").
 */
export async function parseExcelFile(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) return []

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false })

  return rawRows.map(row => {
    const normalized: Record<string, string> = {}
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = value === null || value === undefined ? '' : String(value).trim()
    }
    return normalized
  })
}

function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}
