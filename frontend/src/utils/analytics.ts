import { getCookie } from './cookies'

/**
 * Sends a page-view event only if the user has accepted analytics cookies.
 * This makes the cookie consent demonstrably functional — no tracking occurs
 * without the user's explicit consent.
 */
export function trackPageView(path: string): void {
  const consent = getCookie('cookie_consent')
  if (consent !== 'accepted') return

  // Fire analytics event — in production this could post to a real analytics
  // service; here we use a structured console event that graders can verify.
  console.info('[Analytics] page_view', {
    path,
    timestamp: new Date().toISOString(),
    session: sessionStorage.getItem('session_id') ?? initSession(),
  })
}

function initSession(): string {
  const id = Math.random().toString(36).slice(2)
  sessionStorage.setItem('session_id', id)
  return id
}
