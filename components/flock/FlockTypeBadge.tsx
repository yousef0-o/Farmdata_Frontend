export function FlockTypeBadge({ type }: { type: 'production' | 'breeding' }) {
  return type === 'production' ? (
    <span className="rounded-full bg-success-soft px-2 py-1 text-xs font-bold text-success-strong">
      إنتاج
    </span>
  ) : (
    <span className="rounded-full bg-info-soft px-2 py-1 text-xs font-bold text-info">
      تربية
    </span>
  )
}
