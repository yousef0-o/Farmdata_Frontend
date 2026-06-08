'use client'

import React, { useState, useEffect } from 'react'
import type { User } from '@/lib/types'
import { useRolesAndPermissions } from '@/lib/hooks/useTeam'
import { ShieldCheck, CheckSquare, Square, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface TeamFormProps {
  initialData?: User | null
  onSubmit: (data: any) => void
  onCancel: () => void
  isSubmitting: boolean
  backendErrors?: Record<string, string[]> | null
}

interface PermissionGroup {
  title: string
  permissions: { key: string; label: string; viewKey: string; manageKey: string }[]
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: 'مزرعة الدواجن (Poultry Modules)',
    permissions: [
      { key: 'flocks', label: 'إدارة الأقطاع والقطعان', viewKey: 'view-flocks', manageKey: 'manage-flocks' },
    ],
  },
  {
    title: 'المشتل والعمليات العامة (Nursery & General Operations)',
    permissions: [
      { key: 'companies', label: 'الشركات والمشاريع', viewKey: 'view-companies', manageKey: 'manage-companies' },
      { key: 'warehouses', label: 'المستودعات والمخازن', viewKey: 'view-warehouses', manageKey: 'manage-warehouses' },
      { key: 'items', label: 'أصناف ومستلزمات الإنتاج', viewKey: 'view-items', manageKey: 'manage-items' },
      { key: 'movements', label: 'حركة المخزون والتحويلات', viewKey: 'view-movements', manageKey: 'manage-movements' },
      { key: 'assets', label: 'الأصول الرأسمالية وإهلاكها', viewKey: 'view-assets', manageKey: 'manage-assets' },
      { key: 'customers', label: 'العملاء وبياناتهم', viewKey: 'view-customers', manageKey: 'manage-customers' },
      { key: 'suppliers', label: 'الموردين والحسابات', viewKey: 'view-suppliers', manageKey: 'manage-suppliers' },
    ],
  },
  {
    title: 'أرشيف والمالية (Archive & Accounting)',
    permissions: [
      { key: 'archive', label: 'أرشيف المستندات والوثائق', viewKey: 'view-archive', manageKey: 'manage-archive' },
      { key: 'accounting', label: 'الدفاتر المحاسبية والقيود', viewKey: 'view-accounting', manageKey: 'manage-accounting' },
    ],
  },
  {
    title: 'إدارة والضبط (General Administration)',
    permissions: [
      { key: 'team', label: 'فريق العمل والصلاحيات', viewKey: 'view-team', manageKey: 'manage-team' },
    ],
  },
  {
    title: 'المشتل - إدارة المشتل (Nursery Management)',
    permissions: [
      { key: 'nursery-dashboard', label: 'لوحة التحكم والإحصائيات', viewKey: 'view-nursery-dashboard', manageKey: 'manage-nursery-dashboard' },
      { key: 'nursery-locations', label: 'المواقع والتنظيم الهيكلي', viewKey: 'view-nursery-locations', manageKey: 'manage-nursery-locations' },
      { key: 'nursery-varieties', label: 'أصناف الأشجار والدليل', viewKey: 'view-nursery-varieties', manageKey: 'manage-nursery-varieties' },
      { key: 'nursery-fields', label: 'الحقول والخيارات العامة', viewKey: 'view-nursery-fields', manageKey: 'manage-nursery-fields' },
      { key: 'nursery-management', label: 'إدارة المشتل البصرية', viewKey: 'view-nursery-management', manageKey: 'manage-nursery-management' },
    ],
  },
  {
    title: 'المشتل - العمليات والنشاطات (Nursery Operations)',
    permissions: [
      { key: 'nursery-basin-operations', label: 'عمليات الأحواض', viewKey: 'view-nursery-basin-operations', manageKey: 'manage-nursery-basin-operations' },
      { key: 'nursery-trees', label: 'الأشجار والخطوط', viewKey: 'view-nursery-trees', manageKey: 'manage-nursery-trees' },
      { key: 'nursery-activities', label: 'سجل النشاطات', viewKey: 'view-nursery-activities', manageKey: 'manage-nursery-activities' },
      { key: 'nursery-irrigation', label: 'الري والري المبرمج', viewKey: 'view-nursery-irrigation', manageKey: 'manage-nursery-irrigation' },
      { key: 'nursery-fertilization', label: 'التسميد والأسمدة', viewKey: 'view-nursery-fertilization', manageKey: 'manage-nursery-fertilization' },
      { key: 'nursery-mortality', label: 'النفوق والخسائر', viewKey: 'view-nursery-mortality', manageKey: 'manage-nursery-mortality' },
      { key: 'nursery-transfers', label: 'النقل والتحويلات', viewKey: 'view-nursery-transfers', manageKey: 'manage-nursery-transfers' },
      { key: 'nursery-procedures', label: 'الإجراءات والعمليات', viewKey: 'view-nursery-procedures', manageKey: 'manage-nursery-procedures' },
      { key: 'nursery-cycles', label: 'دورات الإنتاج والإنبات', viewKey: 'view-nursery-cycles', manageKey: 'manage-nursery-cycles' },
    ],
  },
  {
    title: 'المشتل - المخزون والمالية (Nursery Inventory & Finance)',
    permissions: [
      { key: 'nursery-inventory', label: 'مخزون المشتل', viewKey: 'view-nursery-inventory', manageKey: 'manage-nursery-inventory' },
      { key: 'nursery-contacts', label: 'العملاء والموردين', viewKey: 'view-nursery-contacts', manageKey: 'manage-nursery-contacts' },
      { key: 'nursery-opening-balances', label: 'الأرصدة الافتتاحية', viewKey: 'view-nursery-opening-balances', manageKey: 'manage-nursery-opening-balances' },
      { key: 'nursery-invoices', label: 'الفواتير', viewKey: 'view-nursery-invoices', manageKey: 'manage-nursery-invoices' },
      { key: 'nursery-sales', label: 'المبيعات', viewKey: 'view-nursery-sales', manageKey: 'manage-nursery-sales' },
      { key: 'nursery-purchases', label: 'المشتريات', viewKey: 'view-nursery-purchases', manageKey: 'manage-nursery-purchases' },
      { key: 'nursery-expenses', label: 'المصروفات', viewKey: 'view-nursery-expenses', manageKey: 'manage-nursery-expenses' },
    ],
  },
  {
    title: 'المشتل - الذكاء الاصطناعي (Nursery AI)',
    permissions: [
      { key: 'nursery-ai', label: 'المستشار الزراعي الذكي', viewKey: 'view-nursery-ai', manageKey: 'manage-nursery-ai' },
    ],
  },
]

export default function TeamForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  backendErrors,
}: TeamFormProps) {
  const { data: metaData, isLoading: isLoadingMeta } = useRolesAndPermissions()

  const [name, setName] = useState(initialData?.name || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [phone, setPhone] = useState(initialData?.phone || '')
  const [password, setPassword] = useState('')
  const [isActive, setIsActive] = useState(initialData?.is_active !== false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  // Initialize selected permissions
  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setEmail(initialData.email)
      setPhone(initialData.phone || '')
      setIsActive(initialData.is_active !== false)
      if (initialData.permissions) {
        setSelectedPermissions(initialData.permissions)
      }
    }
  }, [initialData])

  // "Editing implies Viewing" Permission sync rule
  const handlePermissionChange = (perm: string, checked: boolean) => {
    setSelectedPermissions((prev) => {
      let next = [...prev]

      if (checked) {
        if (!next.includes(perm)) {
          next.push(perm)
        }
        // If we checked an update/manage permission, automatically check the corresponding view permission
        if (perm.startsWith('manage-')) {
          const viewPerm = perm.replace('manage-', 'view-')
          if (!next.includes(viewPerm)) {
            next.push(viewPerm)
          }
        }
      } else {
        next = next.filter((p) => p !== perm)
        // If we unchecked a view permission, automatically uncheck the corresponding manage permission
        if (perm.startsWith('view-')) {
          const managePerm = perm.replace('view-', 'manage-')
          next = next.filter((p) => p !== managePerm)
        }
      }

      return next
    })
  }

  // Sectional Bulk Select/Deselect
  const handleSectionToggle = (group: PermissionGroup, selectAll: boolean) => {
    setSelectedPermissions((prev) => {
      let next = [...prev]
      const sectionPerms: string[] = []

      group.permissions.forEach((p) => {
        sectionPerms.push(p.viewKey)
        sectionPerms.push(p.manageKey)
      })

      if (selectAll) {
        // Add all section permissions that aren't already included
        sectionPerms.forEach((p) => {
          if (!next.includes(p)) next.push(p)
        })
      } else {
        // Remove all section permissions
        next = next.filter((p) => !sectionPerms.includes(p))
      }

      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Base role: preserve existing role if editing, otherwise default to 'team_member'
    const baseRole = initialData?.roles?.[0] || 'team_member'
    const roleObj = metaData?.roles.find((r) => r.name === baseRole)
    const role_ids = roleObj ? [roleObj.id] : []

    // Map permission names to database IDs
    const permission_ids = selectedPermissions
      .map((name) => metaData?.permissions.find((p) => p.name === name)?.id)
      .filter((id): id is number => typeof id === 'number')

    const payload: any = {
      name,
      email,
      phone,
      is_active: isActive,
      role_ids,
      permission_ids,
    }

    if (password) {
      payload.password = password
    }

    onSubmit(payload)
  }

  if (isLoadingMeta) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-farm-blue animate-spin" />
        <span className="mr-2 text-sm text-gray-500">جاري تحميل الصلاحيات المتاحة...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Information Section */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-farm-blue" />
          البيانات الأساسية للموظف
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              الاسم بالكامل *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue/20"
              placeholder="مثال: أحمد محمود"
            />
            {backendErrors?.name && (
              <p className="text-red-500 text-xs mt-1">{backendErrors.name[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              البريد الإلكتروني *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue/20"
              placeholder="email@example.com"
            />
            {backendErrors?.email && (
              <p className="text-red-500 text-xs mt-1">{backendErrors.email[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              رقم الهاتف (اختياري)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue/20 text-left"
              placeholder="01xxxxxxxxx"
              dir="ltr"
            />
            {backendErrors?.phone && (
              <p className="text-red-500 text-xs mt-1">{backendErrors.phone[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              {initialData ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء عليها)' : 'كلمة المرور *'}
            </label>
            <input
              type="password"
              required={!initialData}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue/20 text-left"
              placeholder="••••••••"
              dir="ltr"
            />
            {backendErrors?.password && (
              <p className="text-red-500 text-xs mt-1">{backendErrors.password[0]}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-farm-blue border-gray-300 rounded focus:ring-farm-blue"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 dark:text-gray-300 select-none cursor-pointer">
              الحساب نشط ويمكنه تسجيل الدخول
            </label>
          </div>
        </div>
      </div>

      {/* Permissions Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            الصلاحيات التفصيلية المخصصة
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-sans">
            (تحديث الصلاحيات الفردية يدعم مبدأ: التعديل يقتضي العرض تلقائياً)
          </span>
        </div>

        {PERMISSION_GROUPS.map((group) => {
          return (
            <div
              key={group.title}
              className="border border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-950/20 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Group Header */}
              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 border-b border-gray-100 dark:border-gray-800/80 flex flex-wrap justify-between items-center gap-2">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {group.title}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => handleSectionToggle(group, true)}
                    variant="ghost"
                    size="sm"
                  >
                    تحديد الكل
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSectionToggle(group, false)}
                    variant="danger"
                    size="sm"
                  >
                    إلغاء التحديد
                  </Button>
                </div>
              </div>

              {/* Group Body Checkboxes Grid */}
              <div className="p-5 space-y-4">
                {group.permissions.map((perm) => {
                  const viewChecked = selectedPermissions.includes(perm.viewKey)
                  const manageChecked = selectedPermissions.includes(perm.manageKey)

                  return (
                    <div
                      key={perm.key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-900 gap-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {perm.label}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-sans">
                          {perm.viewKey} | {perm.manageKey}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 self-end sm:self-center">
                        {/* View Checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={viewChecked}
                            onChange={(e) => handlePermissionChange(perm.viewKey, e.target.checked)}
                            className="w-4 h-4 text-farm-blue border-gray-300 rounded focus:ring-farm-blue"
                          />
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            صلاحية العرض (View)
                          </span>
                        </label>

                        {/* Edit Checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={manageChecked}
                            onChange={(e) => handlePermissionChange(perm.manageKey, e.target.checked)}
                            className="w-4 h-4 text-farm-blue border-gray-300 rounded focus:ring-farm-blue"
                          />
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            صلاحية التحكم / التعديل (Edit)
                          </span>
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {backendErrors?.non_field_errors && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl">
          {backendErrors.non_field_errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          variant="outline"
        >
          إلغاء
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          loadingText="جاري الحفظ..."
        >
          حفظ عضو فريق العمل
        </Button>
      </div>
    </form>
  )
}
