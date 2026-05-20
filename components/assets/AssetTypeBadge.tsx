'use client'

import React from 'react'
import {
  Grid, Layers, MapPin, Building2, Car, Sliders, FileText, Package
} from 'lucide-react'

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  nurseries:      { label: 'حاضنات الصغار', icon: Grid,      color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/40' },
  incubators:     { label: 'فقاسات البيض',  icon: Layers,    color: 'text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-950/40' },
  lands:          { label: 'أراضي المزرعة',  icon: MapPin,    color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/40' },
  buildings:      { label: 'مباني وإنشاءات', icon: Building2, color: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/40' },
  poultry_houses: { label: 'عنابر الدواجن',  icon: Building2, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/40' },
  cars:           { label: 'أسطول السيارات', icon: Car,       color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950/40' },
  equipment:      { label: 'المعدات والآلات', icon: Sliders,   color: 'text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-950/40' },
  roads:          { label: 'الطرق والممرات',  icon: FileText,  color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-950/40' },
}

interface AssetTypeBadgeProps {
  category: string
}

export default function AssetTypeBadge({ category }: AssetTypeBadgeProps) {
  const config = CATEGORY_CONFIG[category] || {
    label: category,
    icon: Package,
    color: 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-950/40',
  }
  const Icon = config.icon

  return (
    <div className="flex items-center gap-1.5 w-fit">
      <span className={`p-1.5 rounded-lg ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="text-gray-700 dark:text-gray-300">{config.label}</span>
    </div>
  )
}

export { CATEGORY_CONFIG }
