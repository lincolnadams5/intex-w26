export function StatCard({ number, label }: { number: string | number; label: string }) {
  return (
    <div className="bg-[var(--card-bg)] rounded-[24px] p-6 flex flex-col items-center gap-2 text-center border border-[var(--border)]">
      <span className="text-4xl font-bold text-[var(--accent)]">{number}</span>
      <span className="text-sm text-[var(--text)]">{label}</span>
    </div>
  )
}
