export interface ChartDataPoint {
  label: string
  value: number
}

interface Props {
  data: ChartDataPoint[]
  height?: number
  color?: string
  formatValue?: (v: number) => string
}

export default function BarChart({ data, height = 200, color = 'var(--color-accent)', formatValue }: Props) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center text-caption text-text-muted" style={{ height }}>No data</div>
  }

  const max = Math.max(...data.map((d) => d.value), 1)
  const barWidth = Math.min(48, Math.max(16, 600 / data.length - 8))

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={height + 40} viewBox={`0 0 ${data.length * (barWidth + 12) + 20} ${height + 40}`} preserveAspectRatio="xMidYMid meet">
        {data.map((d, i) => {
          const barH = (d.value / max) * (height - 20)
          const x = i * (barWidth + 12) + 10
          const y = height - barH
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barWidth} height={barH} rx={4} fill={color} opacity={0.85} />
              <text x={x + barWidth / 2} y={height + 14} textAnchor="middle" className="fill-text-muted" fontSize={10}>
                {d.label.length > 8 ? d.label.slice(5) : d.label}
              </text>
              {formatValue && (
                <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" className="fill-text-secondary" fontSize={9}>
                  {formatValue(d.value)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
