export function ImpactCard({
  number,
  label,
  description,
}: {
  number: string
  label: string
  description: string
}) {
  return (
    <div className="bg-[var(--bg)] rounded-[24px] p-7 border border-[var(--border)] text-center transition-all duration-[300ms] ease-in-out hover:shadow-[var(--shadow)] hover:-translate-y-1 hover:border-[var(--accent-border)]">
      <div className="flex flex-col gap-1">
        <span className="text-[32px] font-bold text-[var(--accent)]">{number}</span>
        <span className="text-sm font-medium text-[var(--text-h)]">{label}</span>
      </div>
      <p className="text-[13px] text-[var(--text)] mt-3">{description}</p>
    </div>
  )
}
