export function StatCard({ number, label }: { number: string | number; label: string }) {
  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-[24px] p-6 flex flex-col items-center gap-2 text-center border border-[var(--color-outline-variant)]">
      <span className="text-4xl font-bold text-[var(--color-primary)]">{number}</span>
      <span className="text-sm text-[var(--color-on-surface-variant)]">{label}</span>
    </div>
  )
}
