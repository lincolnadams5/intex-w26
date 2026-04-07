import { useState } from 'react'

interface ConfirmDeleteModalProps {
  /** Short description of what is being deleted, e.g. "Lighthouse Safehouse 3" */
  itemName: string
  /** Called when the user confirms the deletion */
  onConfirm: () => void
  /** Called when the user cancels */
  onCancel: () => void
  /** Optional: if true the confirm button shows a spinner */
  isLoading?: boolean
}

/**
 * Reusable delete confirmation modal.
 *
 * Usage:
 *   <ConfirmDeleteModal
 *     itemName="Safehouse 3"
 *     onConfirm={() => deleteItem(id)}
 *     onCancel={() => setShowModal(false)}
 *   />
 *
 * The backend also requires ?confirmed=true on DELETE requests — the caller
 * is responsible for appending that query param when it calls the API.
 */
export function ConfirmDeleteModal({
  itemName,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDeleteModalProps) {
  const [typed, setTyped] = useState('')
  const confirmed = typed === 'DELETE'

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      {/* Modal card — stop click propagation so clicking inside doesn't close */}
      <div
        className="bg-[var(--bg)] rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-[var(--text-h)]">
          Confirm Deletion
        </h2>

        <p className="text-sm text-[var(--text)]">
          You are about to permanently delete{' '}
          <span className="font-semibold text-[var(--alert)]">{itemName}</span>.
          This action <strong>cannot be undone</strong>.
        </p>

        <p className="text-sm text-[var(--text)]">
          Type <span className="font-mono font-bold">DELETE</span> to confirm:
        </p>

        <input
          type="text"
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder="DELETE"
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--bg-alt)] text-[var(--text-h)] focus:outline-none focus:ring-2 focus:ring-[var(--alert)]"
          autoFocus
        />

        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors border border-[var(--border)]"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={!confirmed || isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--alert)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
