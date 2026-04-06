export function Header() {
  return (
    <header className="sticky top-0 z-[100] bg-[var(--bg)] border-b border-[var(--border)]">
      <nav className="flex items-center justify-between py-3 px-4 md:py-4 md:px-8 max-w-[1200px] mx-auto flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[22px] font-bold text-[var(--text-h)] tracking-tight">
            Pag-asa Sanctuary
          </span>
        </div>
        <div className="hidden md:flex gap-8">
          {(['Mission', 'Services', 'Impact', 'Contact'] as const).map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="text-[var(--text)] text-[15px] font-medium hover:text-[var(--accent)] transition-colors no-underline"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end">
          <button className="btn btn-secondary">Sign In</button>
          <button className="btn btn-primary">Donate</button>
        </div>
      </nav>
    </header>
  )
}
