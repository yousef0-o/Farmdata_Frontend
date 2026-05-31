import type { Metadata } from 'next'
import NurseryLocationsWorkspace from './workspace'

export const metadata: Metadata = {
  title: 'المواقع والتنظيم | المشتل | Farmdata',
  description: 'إدارة الهيكل الفيزيائي للمشتل: المشاتل، المواقع، الأقسام، الأحواض، وخطط الري.',
}

export default async function NurseryLocationsPage() {
  return <NurseryLocationsWorkspace />
}
