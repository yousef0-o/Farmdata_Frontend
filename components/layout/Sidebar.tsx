'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Sprout, Warehouse, Layers, ArrowLeftRight, Coins, Users, Truck, FolderArchive, BookOpen } from 'lucide-react'
import DarkModeToggle from '../ui/DarkModeToggle'

const navItems = [
  {
    icon: LayoutDashboard,
    label: 'الرئيسية',
    href: '/dashboard',
  },
  {
    icon: Building2,
    label: 'الشركات',
    href: '/companies',
  },
  {
    icon: Sprout,
    label: 'الأقطاع',
    href: '/flocks',
  },
  {
    icon: FolderArchive,
    label: 'أرشيف المستندات',
    href: '/archive',
  },
  {
    icon: BookOpen,
    label: 'الدفاتر المحاسبية',
    href: '/archive/accounting',
  },
  {
    icon: Coins,
    label: 'الأصول الرأسمالية',
    href: '/assets',
  },
  {
    icon: Users,
    label: 'العملاء',
    href: '/customers',
  },
  {
    icon: Truck,
    label: 'الموردين',
    href: '/suppliers',
  },
  {
    icon: Warehouse,
    label: 'المستودعات',
    href: '/warehouses',
  },
  {
    icon: Layers,
    label: 'الأصناف',
    href: '/items',
  },
  {
    icon: ArrowLeftRight,
    label: 'حركة المخزون',
    href: '/inventory/movements',
  },
]


export default function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 h-screen bg-surface border-l border-border flex flex-col sticky top-0 z-50 shrink-0" dir="rtl">
      {/* Brand Header */}
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="p-2 bg-brand-logo-bg rounded-lg">
          <Sprout className="w-6 h-6 text-brand-logo-icon" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-brand-logo-text leading-tight font-sans">
            Farmdata
          </span>
          <span className="text-[10px] text-brand-logo-sub">إدارة المزارع</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-farm-blue text-[#ffffff] shadow-sm'
                  : 'text-gray-600 dark:text-gray-700 hover:bg-menu-hover-bg hover:text-menu-hover-text'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-[#ffffff]' : ''}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Theme Toggle Button */}
      <div className="px-4 py-3 border-t border-border">
        <DarkModeToggle />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center">
          نظام إدارة مزارع الدواجن
        </p>
      </div>
    </aside>
  )
}

