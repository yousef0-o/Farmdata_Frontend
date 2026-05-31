import type { Metadata } from 'next'
import NurseryLinesWorkspace from './workspace'

export const metadata: Metadata = {
  title: 'عرض الخطوط | المشتل | Farmdata',
  description: 'دفتر خطوط الشتلات مع فلاتر المشتل والموقع والقسم والحوض والصنف ومقاس المركن.',
}

type NurseryLinesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function NurseryLinesPage({ searchParams }: NurseryLinesPageProps) {
  const params = await searchParams

  return (
    <NurseryLinesWorkspace
      initialFilters={{
        nursery_id: firstParam(params.nursery_id) ?? null,
        location_id: firstParam(params.location_id) ?? null,
        section_id: firstParam(params.section_id) ?? null,
        basin_id: firstParam(params.basin_id) ?? null,
        variety_id: firstParam(params.variety_id) ?? null,
        pot_size: firstParam(params.pot_size) ?? null,
        date_from: firstParam(params.date_from) ?? null,
        date_to: firstParam(params.date_to) ?? null,
      }}
    />
  )
}
