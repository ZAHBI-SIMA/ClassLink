import { getStudentCafeteria } from '@/actions/cafeteria'
import { formatCurrency, formatDate } from '@/lib/utils'

export const runtime = 'nodejs'

const DAYS: Record<number, string> = {
  1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche',
}
const MEALS: Record<string, string> = {
  BREAKFAST: 'Petit-déj', LUNCH: 'Déjeuner', SNACK: 'Goûter',
}

function MenuItem({ m, highlight = false }: { m: any; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${
      highlight ? 'border-orange-200 bg-orange-50/60' : 'border-gray-200 bg-white'
    }`}>
      <span className="px-2 py-1 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wide shrink-0">
        {MEALS[m.meal_type] ?? m.meal_type}
      </span>
      <span className="flex-1 text-sm text-gray-800">{m.description}</span>
      {Number(m.price) > 0 && (
        <span className="text-xs font-semibold text-gray-500">{formatCurrency(Number(m.price))}</span>
      )}
    </div>
  )
}

export default async function StudentCafeteriaPage() {
  const { subscription, menus } = await getStudentCafeteria()

  const byDay = new Map<number, any[]>()
  for (const m of menus) {
    const d = m.day_of_week as number
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(m)
  }
  const days = [...byDay.keys()].sort((a, b) => a - b)

  const jsDay = new Date().getDay()
  const today = jsDay === 0 ? 7 : jsDay
  const todayMenus = byDay.get(today) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cantine</h1>
        <p className="text-sm text-gray-500 mt-1">Consulte le menu du jour et de la semaine.</p>
      </div>

      {/* Statut abonnement */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${
        subscription ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          subscription ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={subscription ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
          </svg>
        </div>
        {subscription ? (
          <div>
            <p className="text-sm font-semibold text-green-700">
              Abonnement actif{subscription.meal_type ? ` — ${MEALS[subscription.meal_type] ?? subscription.meal_type}` : ''}
            </p>
            {subscription.start_date && (
              <p className="text-xs text-gray-500">Depuis le {formatDate(subscription.start_date)}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Pas d’abonnement cantine actif.</p>
        )}
      </div>

      {/* Menu du jour */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-900">Menu du jour — {DAYS[today]}</h2>
        </div>
        {todayMenus.length === 0 ? (
          <div className="rounded-lg border border-orange-100 bg-orange-50/40 p-4 text-sm text-gray-500">
            Aucun menu prévu aujourd’hui.
          </div>
        ) : (
          <div className="space-y-2">
            {todayMenus.map((m: any) => <MenuItem key={m.id} m={m} highlight />)}
          </div>
        )}
      </div>

      {/* Menu de la semaine */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Menu de la semaine</h2>
        {days.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            Aucun menu publié cette semaine.
          </div>
        ) : (
          <div className="space-y-5">
            {days.map(d => (
              <div key={d}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{DAYS[d] ?? `Jour ${d}`}</p>
                <div className="space-y-2">
                  {byDay.get(d)!.map((m: any) => <MenuItem key={m.id} m={m} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
