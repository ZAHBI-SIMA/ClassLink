import { NextResponse } from 'next/server'

export function GET() {
  const csvContent = [
    'prenom,nom,email,date_naissance,genre,classe_id',
    'Awa,Diallo,awa.diallo@exemple.ci,2008-03-15,F,',
    'Moussa,Konaté,moussa.konate@exemple.ci,2008-07-22,M,',
    'Aïcha,Traoré,aicha.traore@exemple.ci,2007-11-05,F,',
  ].join('\n')

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="modele-import-eleves.csv"',
    },
  })
}
