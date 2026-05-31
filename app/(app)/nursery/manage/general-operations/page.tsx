import type { Metadata } from 'next'
import NurseryGeneralOperationsWorkspace from './workspace'
import type { NurseryGeneralOperationContextType } from '@/lib/types/nurseryManagement'

export const metadata: Metadata = {
  title: 'عمليات عامة | إدارة المشتل | Farmdata',
  description: 'تنفيذ عمليات الري والتسميد والتنظيف والتقليم على نطاق مشتل أو موقع أو قسم.',
}

type NurseryGeneralOperationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

function normalizeType(value: string | undefined): NurseryGeneralOperationContextType | null {
  if (value === 'nursery' || value === 'location' || value === 'section') return value
  return null
}

export default async function NurseryGeneralOperationsPage({
  searchParams,
}: NurseryGeneralOperationsPageProps) {
  const params = await searchParams
  const contextType = normalizeType(firstParam(params.type))
  const contextId = Number(firstParam(params.id) ?? 0)

  return <NurseryGeneralOperationsWorkspace contextType={contextType} contextId={contextId} />
}
