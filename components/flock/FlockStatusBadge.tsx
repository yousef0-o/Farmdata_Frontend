import type { Flock } from '@/lib/types'

export function FlockStatusBadge({ status }: { status: Flock['status'] }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: 'نشط', className: 'bg-green-100 text-green-700' },
    completed: { label: 'مكتمل', className: 'bg-gray-100 text-gray-700' },
    cancelled: { label: 'ملغي', className: 'bg-red-100 text-red-700' },
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
