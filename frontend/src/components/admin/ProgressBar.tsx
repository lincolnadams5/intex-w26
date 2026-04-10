interface ProgressBarProps {
  currentStep: number   // 1-indexed
  totalSteps: number
  stepLabels?: string[] // optional; shown beside the counter
}

export function ProgressBar({ currentStep, totalSteps, stepLabels }: ProgressBarProps) {
  const percent = (currentStep / totalSteps) * 100
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--color-on-surface)]">
          Step {currentStep} of {totalSteps}
          {stepLabels && `: ${stepLabels[currentStep - 1]}`}
        </span>
        <span className="text-sm text-[var(--color-on-surface-variant)]">
          {Math.round(percent)}%
        </span>
      </div>
      <div className="w-full h-2 bg-[var(--color-surface-container-low)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
