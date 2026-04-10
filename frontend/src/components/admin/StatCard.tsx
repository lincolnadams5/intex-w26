// Reusable stat card for the top row of every admin page.

import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { direction: 'up' | 'down'; text: string }
  /** Renders the value in accent color instead of heading color. */
  accent?: boolean
  /** Optional small line below the value, before the trend. */
  subtitle?: string
  /** Colored top border + value text tint. */
  color?: string
}

export function StatCard({ label, value, icon, trend, accent, subtitle, color }: StatCardProps) {
  return (
    <div className="card">
      {/* Label + icon row */}
      <div className="flex items-center gap-2 mb-3">
        {icon && <span style={color ? { color } : undefined}>{icon}</span>}
        <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">{label}</span>
      </div>

      {/* Primary value */}
      <div
        className={`text-3xl font-bold mb-1 ${accent ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface)]'}`}
        style={color ? { color } : undefined}
      >
        {value}
      </div>

      {/* Optional subtitle */}
      {subtitle && (
        <div className="text-xs text-[var(--color-on-surface-variant)] mb-1">{subtitle}</div>
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
