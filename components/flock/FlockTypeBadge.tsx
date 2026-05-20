export function FlockTypeBadge({ type }: { type: 'production' | 'breeding' }) {
  return type === 'production' ? (
    <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">
      إنتاج
    </span>
  ) : (
    <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
      تربية
    </span>
  )
}
