import type { Flock } from '@/lib/types'

export function FlockStatusBadge({ status }: { status: Flock['status'] }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: 'نشط', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
    completed: { label: 'مكتمل', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400' },
    cancelled: { label: 'ملغي', className: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' },
  }
  const { label, className } = map[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-700',
  }
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full ${className}`}>
      {label}
    </span>
  )
}
