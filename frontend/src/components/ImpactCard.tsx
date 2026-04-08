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
    <div className="bg-[var(--color-surface-container-lowest)] rounded-[24px] p-7 border border-[var(--color-outline-variant)] text-center transition-all duration-[300ms] ease-in-out hover:shadow-[var(--shadow-ambient)] hover:-translate-y-1 hover:border-[var(--color-outline-variant)]">
      <div className="flex flex-col gap-1">
        <span className="text-[32px] font-bold text-[var(--color-primary)]">{number}</span>
        <span className="text-sm font-medium text-[var(--color-on-surface)]">{label}</span>
      </div>
      <p className="text-[13px] text-[var(--color-on-surface-variant)] mt-3">{description}</p>
    </div>
  )
}
