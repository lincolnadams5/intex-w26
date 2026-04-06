interface AdminStatCardProps {
  label: string
  value: string | number
  icon?: string
  trend?: { direction: 'up' | 'down'; text: string }
  accent?: boolean
}

export function AdminStatCard({ label, value, icon, trend, accent }: AdminStatCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--text)]">{label}</span>
        {icon && <span className="text-xl opacity-70">{icon}</span>}
      </div>
      <div className={`text-3xl font-bold mb-2 ${accent ? 'text-[var(--accent)]' : 'text-[var(--text-h)]'}`}>
        {value}
      </div>
      {trend && (
        <div className={`text-xs flex items-center gap-1 font-medium ${trend.direction === 'up' ? 'text-green-600' : 'text-[#DB7981]'}`}>
          <span>{trend.direction === 'up' ? '▲' : '▼'}</span>
          <span>{trend.text}</span>
        </div>
      )}
    </div>
  )
}
