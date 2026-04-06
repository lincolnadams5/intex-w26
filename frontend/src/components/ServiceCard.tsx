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
      className="group bg-[var(--bg)] border border-[var(--border)] rounded-xl p-7 no-underline transition-all duration-300 flex flex-col hover:border-[var(--accent)] hover:shadow-[var(--shadow)] hover:-translate-y-1"
    >
      <h3 className="mb-2 text-[var(--text-h)]">{title}</h3>
      <p className="text-sm text-[var(--text)] grow">{description}</p>
      <span className="mt-4 text-sm font-medium text-[var(--text)] transition-colors duration-200 group-hover:text-[var(--accent)]">
        {linkText}
      </span>
    </a>
  )
}
