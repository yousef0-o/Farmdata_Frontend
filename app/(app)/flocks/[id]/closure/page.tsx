'use client'

import React, { use } from 'react'
import { Loader2 } from 'lucide-react'
import { useFlock } from '@/lib/hooks/useFlock'
import BreedingClosureDetailView from '@/components/flock/BreedingClosureDetailView'

export default function FlockClosurePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const flockId = Number(id)
  const { data: flockResponse, isLoading, error } = useFlock(flockId)
  const flock = flockResponse?.data

  if (isLoading) {
    return (
      <div className="flex justify-center py-20" dir="rtl">
        <Loader2 className="h-10 w-10 animate-spin text-farm-blue" />
      </div>
    )
  }

  if (error || !flock) {
    return (
      <div className="py-20 text-center text-ink-muted" dir="rtl">
        لم يتم العثور على بيانات الفوج.
      </div>
    )
  }

  return (
    <BreedingClosureDetailView
      flockId={flockId}
      barnId={flock.barn_id}
    />
  )
}
