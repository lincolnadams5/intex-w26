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
      className="group bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[24px] p-7 no-underline transition-all duration-[300ms] ease-in-out flex flex-col hover:border-[var(--color-outline-variant)] hover:shadow-[var(--shadow-ambient)] hover:-translate-y-1"
    >
      <h3 className="mb-2 text-[var(--color-on-surface)]">{title}</h3>
      <p className="text-sm text-[var(--color-on-surface-variant)] grow">{description}</p>
      <span className="mt-4 text-sm font-medium text-[var(--color-on-surface-variant)] transition-colors duration-200 group-hover:text-[var(--color-primary)]">
        {linkText}
      </span>
    </a>
  )
}
