interface Props {
  value:   number   // 0-100
  size?:   number
  stroke?: number
  color?:  string
  label?:  string
}

export function ProgressRing({ value, size = 80, stroke = 8, color = '#3b82f6', label }: Props) {
  const r   = (size - stroke) / 2
  const c   = 2 * Math.PI * r
  const off = c - (Math.min(value, 100) / 100) * c

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#f3f4f6" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {label && (
        <p className="text-xs text-gray-500 text-center leading-tight">{label}</p>
      )}
    </div>
  )
}
