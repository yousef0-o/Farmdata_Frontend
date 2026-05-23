'use client'

import React from 'react'
import { useMe } from '@/lib/hooks/useAuth'
import { ShieldAlert, Loader2 } from 'lucide-react'

interface PermissionGuardProps {
  children: React.ReactNode
  permission: string
}

export default function PermissionGuard({ children, permission }: PermissionGuardProps) {
  const { data: user, isLoading } = useMe()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  const isAdmin = user?.roles.some((role) =>
    ['super_admin', 'admin', 'manager'].includes(role)
  ) || user?.email === 'admin@farmdata.com'

  const hasAccess = isAdmin || user?.permissions?.includes(permission)

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-950/30 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full mb-4">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">غير مصرح بالدخول</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
          عذراً، ليس لديك الصلاحية الكافية للوصول إلى هذه الصفحة. يرجى مراجعة مسؤول النظام لمنحك الصلاحيات اللازمة.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
