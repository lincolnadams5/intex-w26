export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center max-w-[700px] mx-auto mb-12">
      <h2 className="mb-4">{title}</h2>
      <p className="text-[var(--color-on-surface-variant)]">{subtitle}</p>
    </div>
  )
}
