'use client'

export function contextHintsFromPath(pathname: string, searchParams: URLSearchParams) {
  const hints: Record<string, number> = {}
  const basinFromQuery = numericParam(searchParams.get('basin_id') || searchParams.get('context_basin_id'))
  const cycleFromQuery = numericParam(searchParams.get('cycle_id') || searchParams.get('context_cycle_id'))

  if (basinFromQuery) hints.context_basin_id = basinFromQuery
  if (cycleFromQuery) hints.context_cycle_id = cycleFromQuery

  const basinMatch = pathname.match(/\/nursery\/manage\/basins\/(\d+)/)
  if (basinMatch?.[1]) hints.context_basin_id = Number(basinMatch[1])

  return hints
}

function numericParam(value: string | null) {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
