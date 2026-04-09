// Consistent page title + subtitle used at the top of every admin page.

interface PageHeaderProps {
  title: string
  subtitle: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h2 className="text-[var(--color-on-surface)]">{title}</h2>
      <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{subtitle}</p>
    </div>
  )
}
