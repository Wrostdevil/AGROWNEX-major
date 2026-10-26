import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface TrendSeriesPoint {
  label: string
  count: number
}

/**
 * Shared, accessible trend chart (Recharts wrapper).
 * Charts always pair with numeric labels/summaries nearby — never color alone.
 */
export function TrendAreaChart({
  data,
  color = '#267A56',
  height = 260,
  ariaLabel,
}: {
  data: TrendSeriesPoint[]
  color?: string
  height?: number
  ariaLabel: string
}) {
  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id={`trend-${Math.round(color ? 0 : 0)}-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(105,115,108,0.18)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: 'rgba(105,115,108,0.25)' }}
            tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.65 }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.65 }}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: 'rgba(38,122,86,0.35)', strokeWidth: 1.5 }}
            content={({ active, payload, label }) =>
              active && payload && payload.length ? (
                <div className="rounded-lg bg-forest-900 px-3 py-2 text-ivory shadow-lift ring-1 ring-white/10">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-300/80">{label}</p>
                  <p className="text-sm font-bold tabular">{payload[0].value} reports</p>
                </div>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2.4}
            fill={`url(#trend-0-${color.slice(1)})`}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#102A24', fill: color }}
            dot={false}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
