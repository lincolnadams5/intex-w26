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

  // Only render on sub-routes (2+ segments with known labels)
  if (crumbs.length < 2) return null

  const parentCrumb = crumbs[crumbs.length - 2]

  return (
    <Link
      to={parentCrumb.to}
      className="flex items-center gap-1 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors no-underline flex-shrink-0"
      aria-label={`Back to ${parentCrumb.label}`}
    >
      ← Back to {parentCrumb.label}
    </Link>
  )
}
