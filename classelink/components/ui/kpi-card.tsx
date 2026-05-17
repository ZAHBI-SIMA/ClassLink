import { cn } from '@/lib/utils'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; label: string }
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
}

const colors = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   trend: 'text-blue-600' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  trend: 'text-green-600' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', trend: 'text-orange-600' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', trend: 'text-purple-600' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',    trend: 'text-red-600' },
}

export function KpiCard({ title, value, subtitle, trend, icon, color = 'blue' }: Props) {
  const c = colors[color]
  const trendUp = trend && trend.value >= 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', c.icon)}>
        <span className="w-5 h-5">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={cn('text-xs font-medium mt-1 flex items-center gap-0.5', trendUp ? 'text-green-600' : 'text-red-500')}>
            {trendUp ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  )
}
