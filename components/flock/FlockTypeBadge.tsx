export function FlockTypeBadge({ type }: { type: 'production' | 'breeding' }) {
  return type === 'production' ? (
    <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
      إنتاج
    </span>
  ) : (
    <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
      تربية
    </span>
  )
}
