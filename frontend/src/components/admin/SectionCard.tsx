// Card wrapper with a consistent title, subtitle, and optional accent border.
// Use this to wrap every chart, table, or content block on admin pages.

import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  /** Adds a left-side accent border for attention-drawing sections (e.g., risk escalations). */
  accentBorder?: boolean
  /** Icon displayed to the left of the title. */
  titleIcon?: string
  className?: string
}

export function SectionCard({
  title,
  subtitle,
  children,
  accentBorder = false,
  titleIcon,
  className = '',
}: SectionCardProps) {
  return (
    <div className={`card ${accentBorder ? 'border-l-4 border-l-[#DB7981]' : ''} ${className}`}>
      {/* Section header */}
      <div className="flex items-start gap-2 mb-1">
        {titleIcon && <span className="text-xl leading-tight mt-0.5">{titleIcon}</span>}
        <h3 className="text-[var(--text-h)]">{title}</h3>
      </div>
      {subtitle && (
        <p className="text-xs text-[var(--text)] mb-4">{subtitle}</p>
      )}
      {!subtitle && <div className="mb-4" />}

      {children}
    </div>
  )
}
