import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export function GET() {
  const rows = [
    { prenom: 'Awa', nom: 'Diallo', email: 'awa.diallo@exemple.ci', date_naissance: '2008-03-15', genre: 'F', classe_id: '' },
    { prenom: 'Moussa', nom: 'Konaté', email: 'moussa.konate@exemple.ci', date_naissance: '2008-07-22', genre: 'M', classe_id: '' },
    { prenom: 'Aïcha', nom: 'Traoré', email: 'aicha.traore@exemple.ci', date_naissance: '2007-11-05', genre: 'F', classe_id: '' },
  ]

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ['prenom', 'nom', 'email', 'date_naissance', 'genre', 'classe_id'],
  })
  worksheet['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 8 }, { wch: 14 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Élèves')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="modele-import-eleves.xlsx"',
    },
  })
}
