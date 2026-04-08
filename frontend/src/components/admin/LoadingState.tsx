// Full-page loading spinner shown while admin pages fetch data.

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="loading-spinner w-8 h-8 border-[3px] border-[var(--color-primary)]" />
    </div>
  )
}
