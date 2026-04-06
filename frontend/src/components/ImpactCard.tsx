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
    <div className="bg-[var(--bg)] rounded-xl p-7 border border-[var(--border)] text-center">
      <div className="flex flex-col gap-1">
        <span className="text-[32px] font-bold text-[var(--accent)]">{number}</span>
        <span className="text-sm font-medium text-[var(--text-h)]">{label}</span>
      </div>
      <p className="text-[13px] text-[var(--text)] mt-3">{description}</p>
    </div>
  )
}
