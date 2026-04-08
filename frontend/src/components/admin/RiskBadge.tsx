// Colored inline badge for resident risk levels.
// Used in the residents page risk tables.

const RISK_CLASSES: Record<string, string> = {
  Low:      'bg-green-100 text-green-700',
  Medium:   'bg-amber-100 text-amber-700',
  High:     'bg-orange-100 text-orange-700',
  Critical: 'bg-[#DB7981]/10 text-[#DB7981]',
}

interface RiskBadgeProps {
  level: string
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const classes = RISK_CLASSES[level] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {level}
    </span>
  )
}
