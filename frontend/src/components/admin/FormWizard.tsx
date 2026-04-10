import type { ReactNode } from 'react'
import { ProgressBar } from './ProgressBar'

export interface WizardStep {
  label: string
  /** Return true if the step's data is valid and user may advance */
  isValid: () => boolean
  content: ReactNode
}

interface FormWizardProps {
  steps: WizardStep[]
  currentStep: number                   // 1-indexed
  onStepChange: (step: number) => void
  onSubmit: () => void | Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

export function FormWizard({
  steps, currentStep, onStepChange, onSubmit, isSubmitting, submitLabel = 'Submit',
}: FormWizardProps) {
  const isLast = currentStep === steps.length
  const current = steps[currentStep - 1]

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 bg-[var(--color-surface-container-lowest)] py-4 px-4 sm:px-6 border-b border-[var(--color-outline-variant)] rounded-t-xl">
        <ProgressBar
          currentStep={currentStep}
          totalSteps={steps.length}
          stepLabels={steps.map(s => s.label)}
        />
      </div>

      <div className="px-4 sm:px-6 pb-4">
        {current.content}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-[var(--color-outline-variant)]">
        <button
          type="button"
          onClick={() => onStepChange(currentStep - 1)}
          disabled={currentStep === 1 || isSubmitting}
          className="btn btn-secondary"
        >
          Back
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!current.isValid() || isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Saving…' : submitLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { if (current.isValid()) onStepChange(currentStep + 1) }}
            disabled={!current.isValid() || isSubmitting}
            className="btn btn-primary"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
