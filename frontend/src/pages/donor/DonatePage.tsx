import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const presetAmounts = [500, 1000, 2500, 5000, 10000, 25000]

export default function DonatePage() {
  const navigate = useNavigate()
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeAmount = selectedPreset ?? (customAmount ? parseInt(customAmount, 10) : 0)

  const handlePresetClick = (amount: number) => {
    setSelectedPreset(amount)
    setCustomAmount('')
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPreset(null)
    setCustomAmount(e.target.value.replace(/[^0-9]/g, ''))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAmount || activeAmount <= 0) return

    setIsSubmitting(true)
    setTimeout(() => {
      navigate('/my-donations')
    }, 800)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Header */}
      <header className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-white py-10 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <Link to="/my-donations" className="inline-block text-white/80 hover:text-white text-sm mb-4 transition-colors">
            ← Back to My Donations
          </Link>
          <h1 className="text-white mb-2">Make a Donation</h1>
          <p className="text-white/80 text-lg">Your generosity helps provide safety and hope to survivors</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-10">
        <form 
          className="bg-[var(--surface-container-lowest)] rounded-xl p-8 shadow-[var(--shadow-elevated)]"
          onSubmit={handleSubmit}
        >
          {/* Amount Selection */}
          <section className="mb-8">
            <h4 className="mb-4">Select Amount</h4>
            <div className="grid grid-cols-3 gap-3">
              {presetAmounts.map(amount => (
                <button
                  key={amount}
                  type="button"
                  className={`py-4 px-3 rounded-lg font-semibold text-base transition-all ${
                    selectedPreset === amount
                      ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-ambient)]'
                      : 'bg-[var(--surface-container-high)] text-[var(--on-surface)] hover:bg-[var(--surface-container-highest)]'
                  }`}
                  onClick={() => handlePresetClick(amount)}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
            <div className="mt-5">
              <label htmlFor="custom" className="block text-sm text-[var(--on-surface-variant)] mb-2">
                Or enter a custom amount (PHP)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[var(--outline)] font-medium">₱</span>
                <input
                  type="text"
                  id="custom"
                  placeholder="0"
                  value={customAmount}
                  onChange={handleCustomChange}
                  className="w-full pl-10 pr-4 py-4 text-xl font-semibold bg-[var(--surface-container-high)] rounded-lg focus:bg-[var(--surface-container-highest)] focus:shadow-[0_2px_0_0_var(--primary)] outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Recurring Option */}
          <section className="mb-8">
            <label className="flex items-center gap-3 p-4 bg-[var(--surface-container-low)] rounded-lg cursor-pointer hover:bg-[var(--surface-container)] transition-colors">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="w-5 h-5 accent-[var(--primary)]"
              />
              <span className="text-[var(--on-surface)]">Make this a monthly recurring donation</span>
            </label>
          </section>

          {/* Summary */}
          {activeAmount > 0 && (
            <section className="bg-[var(--surface-container-low)] rounded-lg p-5 mb-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-[var(--on-surface-variant)]">Donation Amount</span>
                <span className="text-xl font-bold text-[var(--primary)]">{formatCurrency(activeAmount)}</span>
              </div>
              {isRecurring && (
                <div className="flex justify-between items-center py-2 border-t border-[var(--surface-container-high)]">
                  <span className="text-[var(--on-surface-variant)] text-sm">Frequency</span>
                  <span className="text-sm">Monthly</span>
                </div>
              )}
            </section>
          )}

          {/* Impact Preview */}
          {activeAmount >= 500 && (
            <section className="bg-[var(--surface-container-low)] rounded-lg p-5 mb-6 border-l-[3px] border-[var(--secondary)]">
              <h4 className="text-sm font-semibold text-[var(--secondary)] mb-2">Your Impact</h4>
              <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
                {activeAmount >= 25000
                  ? 'Could provide a full month of care for a survivor, including housing, food, education, and counseling.'
                  : activeAmount >= 10000
                  ? 'Could fund two weeks of educational supplies and tutoring for multiple survivors.'
                  : activeAmount >= 5000
                  ? 'Could provide a week of nutritious meals for residents at a safe home.'
                  : activeAmount >= 2500
                  ? 'Could fund several counseling sessions for a survivor.'
                  : activeAmount >= 1000
                  ? 'Could provide school supplies for a child for an entire semester.'
                  : 'Could help provide essential hygiene supplies for residents.'}
              </p>
            </section>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-large w-full"
            disabled={!activeAmount || activeAmount <= 0 || isSubmitting}
          >
            {isSubmitting ? 'Processing...' : `Donate ${activeAmount > 0 ? formatCurrency(activeAmount) : ''}`}
          </button>

          <p className="text-center text-xs text-[var(--outline)] mt-4">
            Your donation is secure and encrypted. You will receive a receipt via email.
          </p>
        </form>
      </main>
    </div>
  )
}
