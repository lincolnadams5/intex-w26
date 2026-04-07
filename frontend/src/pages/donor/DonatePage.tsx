import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './DonatePage.css'

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
    // Simulate processing delay
    setTimeout(() => {
      navigate('/my-donations')
    }, 800)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="donate-page">
      <header className="donate-header">
        <div className="donate-header-content">
          <Link to="/my-donations" className="back-link">← Back to My Donations</Link>
          <h1>Make a Donation</h1>
          <p>Your generosity helps provide safety and hope to survivors</p>
        </div>
      </header>

      <main className="donate-main">
        <form className="donate-form" onSubmit={handleSubmit}>
          {/* Amount Selection */}
          <section className="form-section">
            <h2>Select Amount</h2>
            <div className="preset-grid">
              {presetAmounts.map(amount => (
                <button
                  key={amount}
                  type="button"
                  className={`preset-btn ${selectedPreset === amount ? 'active' : ''}`}
                  onClick={() => handlePresetClick(amount)}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
            <div className="custom-amount">
              <label htmlFor="custom">Or enter a custom amount (PHP)</label>
              <div className="custom-input-wrapper">
                <span className="currency-symbol">₱</span>
                <input
                  type="text"
                  id="custom"
                  placeholder="0"
                  value={customAmount}
                  onChange={handleCustomChange}
                  className="custom-input"
                />
              </div>
            </div>
          </section>

          {/* Recurring Option */}
          <section className="form-section">
            <label className="recurring-label">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
              />
              <span>Make this a monthly recurring donation</span>
            </label>
          </section>

          {/* Summary */}
          {activeAmount > 0 && (
            <section className="summary-section">
              <div className="summary-row">
                <span>Donation Amount</span>
                <span className="summary-amount">{formatCurrency(activeAmount)}</span>
              </div>
              {isRecurring && (
                <div className="summary-row recurring-note">
                  <span>Frequency</span>
                  <span>Monthly</span>
                </div>
              )}
            </section>
          )}

          {/* Impact Preview */}
          {activeAmount >= 500 && (
            <section className="impact-preview">
              <h3>Your Impact</h3>
              <p>
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
            className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
            disabled={!activeAmount || activeAmount <= 0 || isSubmitting}
          >
            {isSubmitting ? 'Processing...' : `Donate ${activeAmount > 0 ? formatCurrency(activeAmount) : ''}`}
          </button>

          <p className="secure-note">
            Your donation is secure and encrypted. You will receive a receipt via email.
          </p>
        </form>
      </main>
    </div>
  )
}
