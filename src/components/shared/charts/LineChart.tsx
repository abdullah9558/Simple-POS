import type { ChartDataPoint } from './BarChart'

interface Props {
  data: ChartDataPoint[]
  height?: number
  color?: string
}

export default function LineChart({ data, height = 200, color = 'var(--color-accent)' }: Props) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center text-caption text-text-muted" style={{ height }}>No data</div>
  }

  const max = Math.max(...data.map((d) => d.value), 1)
  const width = Math.max(400, data.length * 60)
  const padX = 30
  const padY = 20
  const chartH = height - padY * 2
  const chartW = width - padX * 2

  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * chartW
    const y = padY + chartH - (d.value / max) * chartH
    return { x, y, label: d.label }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={height + 24} viewBox={`0 0 ${width} ${height + 24}`} preserveAspectRatio="xMidYMid meet">
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r={3} fill={color} />
            <text x={p.x} y={height + 16} textAnchor="middle" className="fill-text-muted" fontSize={10}>
              {p.label.length > 8 ? p.label.slice(5) : p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
