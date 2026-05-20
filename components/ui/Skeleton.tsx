import React from 'react'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className ?? 'h-4 w-full'}`}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="border border-gray-100 bg-white rounded-2xl p-6 space-y-3 shadow-sm">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}
