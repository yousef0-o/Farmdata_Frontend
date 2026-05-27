import type { Flock } from '@/lib/types'

export function FlockStatusBadge({ status }: { status: Flock['status'] }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: 'نشط', className: 'bg-success-soft text-success-strong border border-success-soft' },
    completed: { label: 'مكتمل', className: 'bg-surface-muted text-ink-soft border border-line' },
    cancelled: { label: 'ملغي', className: 'bg-danger-soft text-danger border border-danger-soft' },
  }
  const { label, className } = map[status] ?? {
    label: status,
    className: 'bg-surface-muted text-ink-soft border border-line',
  }
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full ${className}`}>
      {label}
    </span>
  )
}
