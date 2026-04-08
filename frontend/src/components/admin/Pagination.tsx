// Reusable pagination controls for sortable, paginated tables.

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  const start = (page - 1) * pageSize + 1
  const end   = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between mt-4">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="btn btn-secondary btn-small"
      >
        ← Previous
      </button>
      <span className="text-sm text-[var(--text)]">
        Showing {start}–{end} of {totalItems}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="btn btn-secondary btn-small"
      >
        Next →
      </button>
    </div>
  )
}
