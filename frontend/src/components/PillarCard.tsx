export function PillarCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-[var(--bg)] rounded-xl py-8 px-6 text-center border border-[var(--border)] transition-all duration-300 hover:shadow-[var(--shadow)] hover:-translate-y-1">
      <h3 className="mb-3 text-[var(--accent)]">{title}</h3>
      <p className="text-sm text-[var(--text)]">{description}</p>
    </div>
  )
}
