import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastKind = 'success' | 'error' | 'info'
interface Toast { id: number; kind: ToastKind; message: string }

interface ToastContextValue {
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, kind, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const value: ToastContextValue = {
    success: msg => push('success', msg),
    error:   msg => push('error', msg),
    info:    msg => push('info', msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`
              pointer-events-auto min-w-[260px] max-w-[400px]
              rounded-lg shadow-lg px-4 py-3 text-sm
              border
              ${t.kind === 'success'
                ? 'bg-[var(--color-surface-container-lowest)] border-[var(--color-primary)] text-[var(--color-on-surface)]'
                : ''}
              ${t.kind === 'error'
                ? 'bg-[var(--color-error-container)] border-[var(--color-error)] text-[var(--color-error)]'
                : ''}
              ${t.kind === 'info'
                ? 'bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] text-[var(--color-on-surface)]'
                : ''}
            `}
          >
            <div className="flex items-start gap-2">
              <span aria-hidden>
                {t.kind === 'success' ? '✓' : t.kind === 'error' ? '⚠' : 'ℹ'}
              </span>
              <span className="flex-1">{t.message}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
