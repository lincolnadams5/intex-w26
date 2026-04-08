interface ProfileCardProps {
  name: string
  email: string
}

export function ProfileCard({ name, email }: ProfileCardProps) {
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {initial}
      </div>
      <div className="hidden sm:block text-left">
        <p className="text-sm font-medium text-[var(--color-on-surface)] leading-tight">{name}</p>
        <p className="text-xs text-[var(--color-on-surface-variant)] leading-tight">{email}</p>
      </div>
    </div>
  )
}
