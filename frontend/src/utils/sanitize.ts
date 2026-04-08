import DOMPurify from 'dompurify'

/**
 * Sanitizes an HTML string before rendering it with dangerouslySetInnerHTML.
 * Use this any time you need to render user-provided or API-provided HTML.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}
