import { getCouncils } from '@/actions/council'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

const STATUS_CFG = {
  PLANNED:     { label: 'Planifié',    cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'En cours',   cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  COMPLETED:   { label: 'Terminé',    cls: 'bg-green-100 text-green-700 border-green-200' },
}

function formatDt(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function CouncilsPage() {
  const councils = await getCouncils()

  // Grouper par année scolaire
  const grouped = councils.reduce((acc: Record<string, any[]>, c: any) => {
    const key = c.academic_year_name ?? 'Année inconnue'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conseil de classe"
        description="Gestion des conseils de classe numériques"
        action={
          <Link href="/admin/councils/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white
                       text-sm font-medium hover:bg-blue-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau conseil
          </Link>
        }
      />

      {councils.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-20 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500 font-medium">Aucun conseil de classe</p>
          <p className="text-sm text-gray-400 mt-1">Créez le premier conseil pour commencer.</p>
          <Link href="/admin/councils/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            Créer un conseil
          </Link>
        </div>
      ) : (
        Object.entries(grouped).map(([year, items]) => (
          <div key={year} className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{year}</h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Classe', 'Trimestre', 'Date prévue', 'Élèves', 'Décisions spéciales', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(items as any[]).map((c: any) => {
                    const cfg = STATUS_CFG[c.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.PLANNED
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.class_name}</td>
                        <td className="px-4 py-3 text-gray-600">{c.term_name}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDt(c.scheduled_at)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-gray-900">{Number(c.student_count)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {Number(c.flagged_count) > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              {Number(c.flagged_count)} cas
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/councils/${c.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition">
                            {c.status === 'PLANNED' ? 'Préparer' : 'Ouvrir'}
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
