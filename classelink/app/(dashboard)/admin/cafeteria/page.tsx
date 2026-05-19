import { getCafeteriaMenus, getCafeteriaSubscriptions } from '@/actions/cafeteria'
import { PageHeader } from '@/components/ui/page-header'
import { CafeteriaClient } from './cafeteria-client'

interface Props {
  searchParams: Promise<{ tab?: string; week?: string }>
}

function getISOWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export default async function CafeteriaPage({ searchParams }: Props) {
  const sp = await searchParams
  const activeTab = sp.tab === 'subs' ? 'subs' : 'menus'

  // Calcul de la semaine courante ou celle passée en query param
  let weekStart: string
  if (sp.week && /^\d{4}-\d{2}-\d{2}$/.test(sp.week)) {
    // S'assurer que c'est bien un lundi
    weekStart = getISOWeekStart(new Date(sp.week))
  } else {
    weekStart = getISOWeekStart(new Date())
  }

  const [menus, subscriptions] = await Promise.all([
    getCafeteriaMenus(weekStart),
    getCafeteriaSubscriptions(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cantine scolaire"
        description="Gestion des menus de la semaine et des abonnements élèves"
      />

      <CafeteriaClient
        menus={menus}
        subscriptions={subscriptions}
        activeTab={activeTab}
        weekStart={weekStart}
      />
    </div>
  )
}
