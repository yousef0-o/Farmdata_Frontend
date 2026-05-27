'use client'

import React from 'react'
import {
  Grid, Layers, MapPin, Building2, Car, Sliders, FileText, Package
} from 'lucide-react'

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  nurseries:      { label: 'حاضنات الصغار', icon: Grid, color: 'text-warning-strong bg-warning-soft' },
  incubators:     { label: 'فقاسات البيض', icon: Layers, color: 'text-info bg-info-soft' },
  lands:          { label: 'أراضي المزرعة', icon: MapPin, color: 'text-success-strong bg-success-soft' },
  buildings:      { label: 'مباني وإنشاءات', icon: Building2, color: 'text-action-secondary bg-surface-muted' },
  poultry_houses: { label: 'عنابر الدواجن', icon: Building2, color: 'text-action-primary bg-info-soft' },
  cars:           { label: 'أسطول السيارات', icon: Car, color: 'text-action-secondary bg-surface-subtle' },
  equipment:      { label: 'المعدات والآلات', icon: Sliders, color: 'text-danger bg-danger-soft' },
  roads:          { label: 'الطرق والممرات', icon: FileText, color: 'text-ink-soft bg-surface-muted' },
}

interface AssetTypeBadgeProps {
  category: string
}

export default function AssetTypeBadge({ category }: AssetTypeBadgeProps) {
  const config = CATEGORY_CONFIG[category] || {
    label: category,
    icon: Package,
    color: 'text-ink-soft bg-surface-muted',
  }
  const Icon = config.icon

  return (
    <div className="flex items-center gap-1.5 w-fit">
      <span className={`p-1.5 rounded-lg ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="text-ink-soft">{config.label}</span>
    </div>
  )
}

export { CATEGORY_CONFIG }
