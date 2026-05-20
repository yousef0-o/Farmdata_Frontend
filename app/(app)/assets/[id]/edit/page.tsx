'use client'

import React, { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import AssetWizardForm from '@/components/assets/AssetWizardForm'
import { useAsset, useUpdateAsset } from '@/lib/hooks/useAssets'
import type { Asset } from '@/lib/types'

export default function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: assetResponse, isLoading } = useAsset(Number(id))
  const asset = assetResponse?.data
  const updateMutation = useUpdateAsset(Number(id))
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center" dir="rtl">
        <h2 className="text-xl font-bold text-gray-800">لم يتم العثور على الأصل</h2>
      </div>
    )
  }

  const handleSubmit = (data: Partial<Asset>) => {
    setServerErrors({})
    updateMutation.mutate(data, {
      onSuccess: () => router.push(`/assets/${id}`),
      onError: (err: any) => {
        if (err.errors) {
          const mapped: Record<string, string> = {}
          Object.keys(err.errors).forEach(k => { mapped[k] = err.errors[k][0] })
          setServerErrors(mapped)
        }
      },
    })
  }

  return (
    <div dir="rtl">
      <AssetWizardForm
        editingAsset={asset}
        onSubmit={handleSubmit}
        onClose={() => router.push(`/assets/${id}`)}
        isPending={updateMutation.isPending}
        serverErrors={serverErrors}
      />
    </div>
  )
}
