'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Building2, 
  Sprout, 
  Warehouse, 
  ArrowLeftRight, 
  Coins, 
  Users, 
  Truck, 
  FolderArchive, 
  BookOpen, 
  Bird, 
  X,
  ChartLine,
  MapPin,
  TreePine,
  Boxes,
  Scale,
  ReceiptText,
  Wallet,
  Bot,
  ArrowRight,
  Package2,
  PackageCheck,
  UserCog,
  SlidersHorizontal,
  ListOrdered
} from 'lucide-react'
import DarkModeToggle from '../ui/DarkModeToggle'
import { useMe } from '@/lib/hooks/useAuth'

// 1. القائمة الافتراضية للنظام العام (Main ERP Menu)
export const navItems = [
  {
    icon: LayoutDashboard,
    label: 'الرئيسية',
    href: '/dashboard',
    permission: null,
  },
  {
    icon: Building2,
    label: 'الشركات',
    href: '/companies',
    permission: 'view-companies',
  },
  {
    icon: Sprout, // إضافة زر المشتل في النظام العام
    label: 'المشتل',
    href: '/nursery',
    permission: 'view-companies', // يمكنك تعديل الصلاحية حسب النظام عندك
  },
  {
    icon: Bird,
    label: 'الأفواج',
    href: '/flocks',
    permission: 'view-flocks',
  },
  {
    icon: ChartLine,
    label: 'تحليلات القطيع',
    href: '/analytics/flocks',
    permission: 'view-flocks',
  },
  {
    icon: FolderArchive,
    label: 'الأرشيف',
    href: '/archive',
    permission: 'view-archive',
  },
  {
    icon: BookOpen,
    label: 'دفتر الأستاذ',
    href: '/archive/accounting',
    permission: 'view-accounting',
  },
  {
    icon: ReceiptText,
    label: 'الفواتير',
    href: '/financial/invoices',
    permission: 'view-accounting',
  },
  {
    icon: Coins,
    label: 'الأرصدة الافتتاحية',
    href: '/financial/opening-balances',
    permission: 'view-accounting',
  },
  {
    icon: PackageCheck,
    label: 'الأصول',
    href: '/assets',
    permission: 'view-assets',
  },
  {
    icon: Users,
    label: 'العملاء',
    href: '/customers',
    permission: 'view-customers',
  },
  {
    icon: Truck,
    label: 'الموردون',
    href: '/suppliers',
    permission: 'view-suppliers',
  },
  {
    icon: Warehouse,
    label: 'المستودعات',
    href: '/warehouses',
    permission: 'view-warehouses',
  },
  {
    icon: Package2,
    label: 'الأصناف',
    href: '/items',
    permission: 'view-items',
  },
  {
    icon: ArrowLeftRight,
    label: 'حركات المخزون',
    href: '/inventory/movements',
    permission: 'view-movements',
  },
  {
    icon: UserCog,
    label: 'المستخدمون',
    href: '/team',
    permission: 'view-team',
  },
]

// 2. قائمة موديول المشتل المخصصة والكاملة (Nursery Internal Menu)
export const nurseryNavItems = [
  {
    icon: ChartLine,
    label: 'إحصائيات الموقع',
    href: '/nursery',
    permission: 'view-companies',
  },
  {
    icon: MapPin,
    label: 'المواقع',
    href: '/nursery/locations',
    permission: 'view-companies',
  },
  {
    icon: TreePine,
    label: 'أصناف الأشجار',
    href: '/nursery/varieties',
    permission: 'view-companies',
  },
  {
    icon: SlidersHorizontal,
    label: 'إدارة الحقول العامة',
    href: '/nursery/fields',
    permission: 'view-companies',
  },
  {
    icon: Sprout,
    label: 'إدارة المشتل',
    href: '/nursery/manage',
    permission: 'view-companies',
  },
  {
    icon: ListOrdered,
    label: 'عرض الخطوط',
    href: '/nursery/lines',
    permission: 'view-companies',
  },
  {
    icon: Boxes,
    label: 'المخزون',
    href: '/nursery/inventory',
    permission: 'view-companies',
  },
  {
    icon: Scale,
    label: 'الأرصدة الافتتاحية',
    href: '/nursery/opening-balances',
    permission: 'view-nursery-opening-balances',
  },
  {
    icon: Users,
    label: 'العملاء والموردين',
    href: '/nursery/contacts',
    permission: 'view-companies',
  },
  {
    icon: ReceiptText,
    label: 'الفواتير',
    href: '/nursery/invoices',
    permission: 'view-companies',
  },
  {
    icon: Wallet,
    label: 'مصروفات المشتل',
    href: '/nursery/expenses',
    permission: 'view-companies',
  },

]

type SidebarProps = {
  className?: string
  drawerTitleId?: string
  isMobileDrawer?: boolean
  onNavigate?: () => void
  onClose?: () => void
}

export default function Sidebar({
  className = '',
  drawerTitleId,
  isMobileDrawer = false,
  onNavigate,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()
  const { data: user } = useMe()

  // التحقق هل نحن داخل مسار المشتل حالياً أم لا
  const isNurseryMode = pathname === '/nursery' || pathname.startsWith('/nursery/')

  function isActive(href: string) {
    if (href === '/dashboard' || href === '/nursery') return pathname === href
    if (href === '/archive') {
      return pathname === '/archive' || pathname.startsWith('/archive/folder')
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  function hasPermission(permission: string | null) {
    if (!user) return false
    const isAdmin = user.roles.some((role) =>
      ['super_admin', 'admin', 'manager'].includes(role)
    ) || user.email === 'admin@farmdata.com'

    if (isAdmin) return true
    if (!permission) return true

    return user.permissions?.includes(permission) || false
  }

  // اختيار عناصر القائمة بناءً على الوضع الحالي للـ URL
  const activeNavItems = isNurseryMode ? nurseryNavItems : navItems

  return (
    <aside
      className={`flex h-full min-h-0 flex-col overflow-hidden border-l border-border bg-surface ${className}`}
      dir="rtl"
      aria-label="التنقل الرئيسي"
    >
      {/* Brand Header */}
      <div className="flex min-h-12 items-center gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div className="rounded-lg bg-brand-logo-bg p-2">
          <Sprout className="w-6 h-6 text-brand-logo-icon" />
        </div>
        <div className="min-w-0 flex-1">
          <span
            id={drawerTitleId}
            className="block truncate font-sans text-lg font-bold leading-tight text-brand-logo-text"
          >
            Farmdata
          </span>
          <span className="block text-xs text-brand-logo-sub">
            {isNurseryMode ? 'نظام إدارة المشتل' : 'إدارة المزارع'}
          </span>
        </div>
        {isMobileDrawer && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Navigation Layer */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 sm:py-6 space-y-1">
        {activeNavItems
          .filter((item) => hasPermission(item.permission))
          .map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? 'bg-farm-blue text-[#ffffff] shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-700 hover:bg-menu-hover-bg hover:text-menu-hover-text'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-[#ffffff]' : ''}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}

        {/* زر العودة للرئيسية - يظهر فقط عندما نكون داخل طور المشتل */}
        {isNurseryMode && (
          <div className="pt-4 mt-4 border-t border-border">
            <Link
              href="/dashboard"
              onClick={onNavigate}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-brand-logo-icon bg-brand-logo-bg/50 hover:bg-brand-logo-bg transition-colors duration-200 active:scale-[0.98]"
            >
              <ArrowRight className="w-5 h-5 text-brand-logo-icon" />
              <span className="text-sm font-bold">العودة للرئيسية</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Theme Toggle Button */}
      <div className="px-4 py-3 border-t border-border">
        <DarkModeToggle />
      </div>
    </aside>
  )
}
