export function ServiceCard({
  href,
  title,
  description,
  linkText,
}: {
  href: string
  title: string
  description: string
  linkText: string
}) {
  return (
    <a
      href={href}
      className="group bg-[var(--bg)] border border-[var(--border)] rounded-[24px] p-7 no-underline transition-all duration-[300ms] ease-in-out flex flex-col hover:border-[var(--accent-border)] hover:shadow-[var(--shadow)] hover:-translate-y-1"
    >
      <h3 className="mb-2 text-[var(--text-h)]">{title}</h3>
      <p className="text-sm text-[var(--text)] grow">{description}</p>
      <span className="mt-4 text-sm font-medium text-[var(--text)] transition-colors duration-200 group-hover:text-[var(--accent)]">
        {linkText}
      </span>
    </a>
  )
}
