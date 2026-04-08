// Reusable stat card for the top row of every admin page.

interface StatCardProps {
  label: string
  value: string | number
  icon?: string
  trend?: { direction: 'up' | 'down'; text: string }
  /** Renders the value in accent color instead of heading color. */
  accent?: boolean
  /** Optional small line below the value, before the trend. */
  subtitle?: string
}

export function StatCard({ label, value, icon, trend, accent, subtitle }: StatCardProps) {
  return (
    <div className="card">
      {/* Label + icon row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--text)]">{label}</span>
        {icon && <span className="text-xl opacity-70">{icon}</span>}
      </div>

      {/* Primary value */}
      <div className={`text-3xl font-bold mb-1 ${accent ? 'text-[var(--accent)]' : 'text-[var(--text-h)]'}`}>
        {value}
      </div>

      {/* Optional subtitle */}
      {subtitle && (
        <div className="text-xs text-[var(--text)] mb-1">{subtitle}</div>
      )}

      {/* Trend indicator */}
      {trend && (
        <div className={`text-xs flex items-center gap-1 font-medium mt-1 ${
          trend.direction === 'up' ? 'text-green-600' : 'text-[#DB7981]'
        }`}>
          <span>{trend.direction === 'up' ? '▲' : '▼'}</span>
          <span>{trend.text}</span>
        </div>
      )}
    </div>
  )
}
