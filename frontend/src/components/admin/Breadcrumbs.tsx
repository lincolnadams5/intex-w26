import { Link, useLocation } from 'react-router-dom'

// Maps URL segments to human-readable labels
const SEGMENT_LABELS: Record<string, string> = {
  dashboard:             'Overview',
  'process-recording':   'Process Recording',
  'home-visits':         'Home Visits',
  donors:                'Donor Activity',
  residents:             'Residents',
  social:                'Social Media',
  ml:                    'ML Insights',
  users:                 'Manage Users',
}

interface Crumb {
  label: string
  to: string
}

function parseCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: Crumb[] = []
  let path = ''
  for (const seg of segments) {
    path += '/' + seg
    const label = SEGMENT_LABELS[seg]
    if (label) crumbs.push({ label, to: path })
  }
  return crumbs
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const crumbs = parseCrumbs(pathname)

  if (crumbs.length === 0) return null

  const parentCrumb = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null

  return (
    <div className="flex items-center gap-3">
      {/* Back button — only shown on sub-routes */}
      {parentCrumb && (
        <Link
          to={parentCrumb.to}
          className="flex items-center gap-1 text-sm text-[var(--text)] hover:text-[var(--text-h)] transition-colors no-underline flex-shrink-0"
          aria-label={`Back to ${parentCrumb.label}`}
        >
          ← Back
        </Link>
      )}

      {parentCrumb && (
        <span className="text-[var(--border)] select-none">|</span>
      )}

      {/* Breadcrumb trail */}
      <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => (
          <span key={crumb.to} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-[var(--text)] opacity-40 mx-0.5">/</span>
            )}
            {i < crumbs.length - 1 ? (
              <Link
                to={crumb.to}
                className="text-[var(--text)] hover:text-[var(--accent)] transition-colors no-underline"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[var(--text-h)] font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  )
}
