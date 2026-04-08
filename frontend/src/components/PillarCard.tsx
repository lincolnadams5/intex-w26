export function PillarCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-[24px] py-8 px-6 text-center border border-[var(--color-outline-variant)] transition-all duration-[300ms] ease-in-out hover:shadow-[var(--shadow-ambient)] hover:-translate-y-1 hover:border-[var(--color-outline-variant)]">
      <h3 className="mb-3 text-[var(--color-primary)]">{title}</h3>
      <p className="text-sm text-[var(--color-on-surface-variant)]">{description}</p>
    </div>
  )
}
