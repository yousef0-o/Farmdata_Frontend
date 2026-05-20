'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Coins } from 'lucide-react'
import AssetWizardForm from '@/components/assets/AssetWizardForm'
import { useCreateAsset } from '@/lib/hooks/useAssets'
import type { Asset } from '@/lib/types'

export default function NewAssetPage() {
  const router = useRouter()
  const createMutation = useCreateAsset()
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})

  const handleSubmit = (data: Partial<Asset>) => {
    setServerErrors({})
    createMutation.mutate(data, {
      onSuccess: () => router.push('/assets'),
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
        editingAsset={null}
        onSubmit={handleSubmit}
        onClose={() => router.push('/assets')}
        isPending={createMutation.isPending}
        serverErrors={serverErrors}
      />
    </div>
  )
}
