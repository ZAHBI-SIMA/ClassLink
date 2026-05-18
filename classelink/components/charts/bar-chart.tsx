interface BarChartItem {
  label:    string
  value:    number
  maxValue: number
  color?:   string
  suffix?:  string
}

interface Props {
  items:     BarChartItem[]
  height?:   number
  showValues?: boolean
}

const COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500',  'bg-teal-500',   'bg-amber-500',   'bg-red-500',
]

export function BarChart({ items, height = 120, showValues = true }: Props) {
  const maxVal = Math.max(...items.map(i => i.value), 1)

  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height }}>
      {items.map((item, idx) => {
        const pct    = Math.max((item.value / maxVal) * 100, item.value > 0 ? 3 : 0)
        const color  = item.color ?? COLORS[idx % COLORS.length]
        const suffix = item.suffix ?? ''
        return (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            {showValues && (
              <span className="text-[10px] font-semibold text-gray-600 truncate">
                {item.value > 0 ? `${item.value}${suffix}` : '—'}
              </span>
            )}
            <div className="w-full flex items-end" style={{ height: height - 30 }}>
              <div
                className={`w-full rounded-t-md ${color} hover:opacity-80 transition-all cursor-default`}
                style={{ height: `${pct}%` }}
                title={`${item.label} : ${item.value}${suffix}`}
              />
            </div>
            <span className="text-[10px] text-gray-400 truncate text-center w-full leading-tight">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
