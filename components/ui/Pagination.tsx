'use client'

import { ChevronRight, ChevronLeft } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  lastPage: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, lastPage, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-center gap-3"
      aria-label="ترقيم الصفحات"
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex min-h-11 items-center gap-1 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-soft outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-action-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="الصفحة السابقة"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        السابق
      </button>

      <span className="text-sm font-medium text-ink-soft" aria-live="polite">
        الصفحة {currentPage} من {lastPage}
      </span>

      <button
        type="button"
        disabled={currentPage >= lastPage}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex min-h-11 items-center gap-1 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-soft outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-action-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="الصفحة التالية"
      >
        التالي
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  )
}
