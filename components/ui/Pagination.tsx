'use client'

import { ChevronRight, ChevronLeft } from 'lucide-react'

import { Button } from '@/components/ui/Button'

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
      <Button
        variant="outline"
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="gap-1"
        aria-label="الصفحة السابقة"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        السابق
      </Button>

      <span className="text-sm font-medium text-ink-soft" aria-live="polite">
        الصفحة {currentPage} من {lastPage}
      </span>

      <Button
        variant="outline"
        type="button"
        disabled={currentPage >= lastPage}
        onClick={() => onPageChange(currentPage + 1)}
        className="gap-1"
        aria-label="الصفحة التالية"
      >
        التالي
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  )
}
