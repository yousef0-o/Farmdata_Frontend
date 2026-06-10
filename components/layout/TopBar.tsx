'use client'

import React from 'react'
import { LogOut, Menu, Calendar } from 'lucide-react'
import { useLogout } from '@/lib/hooks/useAuth'
import { usePathname } from 'next/navigation'

type TopBarProps = {
  isDrawerOpen?: boolean
  onMenuToggle?: () => void
}

// دالة لتوليد عنوان الصفحة والمسار التفصيلي ديناميكياً بناءً على المسار الحالي للـ URL
const getPageTitle = (path: string) => {
  if (path === '/dashboard') return 'لوحة التحكم الرئيسية'
  if (path.startsWith('/companies')) return 'إدارة الشركات والشركاء'
  
  if (path.startsWith('/nursery')) {
    if (path.startsWith('/nursery/locations')) return 'إدارة المواقع والخطوط (المشتل)'
    if (path.startsWith('/nursery/varieties')) return 'أصناف الأشجار والنباتات'
    if (path.startsWith('/nursery/fields')) return 'إدارة الحقول والمقاطع'
    if (path.startsWith('/nursery/manage')) return 'إدارة عمليات المشتل'
    if (path.startsWith('/nursery/lines')) return 'تفاصيل وعرض خطوط المشتل'
    if (path.startsWith('/nursery/inventory')) return 'حركة مخازن ومستلزمات المشتل'
    if (path.startsWith('/nursery/opening-balances')) return 'الأرصدة الافتتاحية للمشتل'
    if (path.startsWith('/nursery/contacts')) return 'دليل العملاء والموردين (المشتل)'
    if (path.startsWith('/nursery/invoices')) return 'الفواتير والماليات (المشتل)'
    if (path.startsWith('/nursery/expenses')) return 'إدارة مصروفات المشتل'
    return 'النظام العام لإدارة المشتل'
  }
  
  if (path.startsWith('/flocks')) return 'إدارة الأفواج والقطعان'
  if (path.startsWith('/analytics/flocks')) return 'تحليلات أداء القطيع والإنتاج'
  if (path.startsWith('/archive/accounting')) return 'دفتر الأستاذ العام والتقارير'
  if (path.startsWith('/archive')) return 'أرشيف الأفواج والسجلات المغلقة'
  if (path.startsWith('/financial/invoices')) return 'إدارة الفواتير والحركات المالية'
  if (path.startsWith('/financial/opening-balances')) return 'إدارة الأرصدة الافتتاحية للمزارع'
  if (path.startsWith('/assets')) return 'إدارة الأصول والعهد الثابتة'
  if (path.startsWith('/customers')) return 'دليل وإحصائيات العملاء'
  if (path.startsWith('/suppliers')) return 'دليل وحسابات الموردين'
  if (path.startsWith('/warehouses')) return 'مستودعات الأعلاف والمستلزمات'
  if (path.startsWith('/items')) return 'دليل المواد والأصناف المخزنية'
  if (path.startsWith('/inventory/movements')) return 'حركات وتوريدات المخزون'
  if (path.startsWith('/team')) return 'إدارة الموظفين وصلاحيات المستخدمين'
  if (path.startsWith('/barns')) {
    if (path.includes('/health-log')) return 'السجل الصحي والتشخيصي للحظيرة'
    return 'تفاصيل الحظيرة والإنتاجية'
  }
  
  return 'نظام إدارة مزارع الدواجن والمشتل'
}

export default function TopBar({
  isDrawerOpen = false,
  onMenuToggle,
}: TopBarProps) {
  const logoutMutation = useLogout()
  const pathname = usePathname()

  const pageTitle = getPageTitle(pathname)
  const isNursery = pathname.startsWith('/nursery')

  // توليد تاريخ اليوم باللغة العربية
  const todayFormatted = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-surface/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-surface/85 transition-[background-color,border-color] duration-200 sm:px-6 sm:py-3 lg:px-8">
      <div className="flex min-h-12 min-w-0 items-center justify-between gap-3 sm:gap-4">
        
        {/* القسم الأيمن: زر الهامبرغر وعنوان الصفحة التفاعلي */}
        <div className="flex min-w-0 items-center gap-3">
          {onMenuToggle ? (
            <button
              type="button"
              onClick={onMenuToggle}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line bg-surface-muted text-action-primary outline-none transition-colors hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-action-primary/30 lg:hidden"
              aria-label={isDrawerOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-farm-blue dark:text-orange-400 sm:text-lg lg:text-xl">
              {pageTitle}
            </h2>
            <div className="hidden items-center gap-2 mt-0.5 text-xs text-ink-muted sm:flex">
              <Calendar className="h-3 w-3 text-ink-soft" />
              <span>{todayFormatted}</span>
              <span className="text-line-strong">|</span>
              <span className={`font-semibold ${isNursery ? 'text-green-600 dark:text-green-400' : 'text-action-primary'}`}>
                {isNursery ? 'نظام المشتل الفني' : 'النظام الداخلي للدواجن'}
              </span>
            </div>
          </div>
        </div>

        {/* القسم الأيسر: زر الخروج */}
        <div className="flex min-w-0 items-center gap-3">
          {/* زر تسجيل الخروج */}
          <button
            type="button"
            onClick={() => logoutMutation.mutate()}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ink-muted outline-none transition-colors hover:bg-danger-soft hover:text-danger focus-visible:ring-2 focus-visible:ring-danger/30 active:scale-95 sm:w-auto sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج من النظام"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline font-bold">خروج</span>
          </button>
        </div>

      </div>
    </header>
  )
}
