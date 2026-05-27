'use client'

import React, { useState } from 'react'
import PermissionGuard from '@/components/auth/PermissionGuard'
import {
  useTeamUsers,
  useCreateTeamUser,
  useUpdateTeamUser,
  useDeleteTeamUser,
} from '@/lib/hooks/useTeam'
import { useMe } from '@/lib/hooks/useAuth'
import type { User } from '@/lib/types'
import TeamForm from '@/components/team/TeamForm'
import AppDialog from '@/components/ui/AppDialog'
import {
  Users,
  UserPlus,
  Search,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit,
  ShieldCheck,
  Power,
  X,
  AlertTriangle,
} from 'lucide-react'

export default function TeamPage() {
  const { data: currentUser } = useMe()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [backendErrors, setBackendErrors] = useState<any>(null)

  // API query
  const { data: response, isLoading } = useTeamUsers(page, search)

  // API mutations
  const createUserMutation = useCreateTeamUser()
  const updateUserMutation = useUpdateTeamUser(editingUser?.id || 0)
  const deleteUserMutation = useDeleteTeamUser()

  const handleOpenCreate = () => {
    setEditingUser(null)
    setBackendErrors(null)
    setShowModal(true)
  }

  const handleOpenEdit = (user: User) => {
    setEditingUser(user)
    setBackendErrors(null)
    setShowModal(true)
  }

  const handleToggleStatus = (user: User) => {
    // Prevent self-suspension
    if (currentUser?.id === user.id) {
      alert('لا يمكنك تعطيل حسابك النشط الحالي تجنباً للخروج من النظام.')
      return
    }

    const nextStatus = !user.is_active
    const updateHook = teamApiUpdate(user.id, {
      name: user.name,
      email: user.email,
      is_active: nextStatus,
    })
  }

  const teamApiUpdate = (id: number, payload: any) => {
    updateUserMutation.mutate(payload, {
      onSuccess: () => {
        // Handled via React Query
      },
      onError: (err: any) => {
        alert(err?.message || 'فشلت عملية تحديث حالة الحساب.')
      },
    })
  }

  const handleSubmitForm = (payload: any) => {
    setBackendErrors(null)

    if (editingUser) {
      updateUserMutation.mutate(payload, {
        onSuccess: () => {
          setShowModal(false)
          setEditingUser(null)
        },
        onError: (err: any) => {
          if (err?.errors) {
            setBackendErrors(err.errors)
          } else {
            alert(err?.message || 'فشل تحديث بيانات العضو.')
          }
        },
      })
    } else {
      createUserMutation.mutate(payload, {
        onSuccess: () => {
          setShowModal(false)
        },
        onError: (err: any) => {
          if (err?.errors) {
            setBackendErrors(err.errors)
          } else {
            alert(err?.message || 'فشل تسجيل العضو الجديد.')
          }
        },
      })
    }
  }

  const handleConfirmDelete = () => {
    if (!deletingUser) return
    deleteUserMutation.mutate(deletingUser.id, {
      onSuccess: () => {
        setDeletingUser(null)
      },
      onError: (err: any) => {
        alert(err?.message || 'فشل حذف عضو فريق العمل.')
        setDeletingUser(null)
      },
    })
  }

  return (
    <PermissionGuard permission="view-team">
      <div className="space-y-6" dir="rtl">
        {/* Header Widget */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-farm-blue/10 text-farm-blue rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">إدارة فريق العمل والصلاحيات</h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                تصفح وأضف أعضاء الفريق وامنحهم صلاحيات تفصيلية مخصصة للتحكم بالأنشطة.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-farm-blue hover:bg-farm-blue-dark text-white text-sm font-semibold shadow-sm transition-colors hover:scale-[1.01]"
          >
            <UserPlus className="w-5 h-5" />
            إضافة موظف جديد
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="ابحث باسم الموظف أو البريد الإلكتروني..."
              className="min-h-11 w-full rounded-xl border border-line bg-surface-muted pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-action-primary/20"
            />
          </div>
        </div>

        {/* Team Grid Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-farm-blue border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-400">جاري تحميل البيانات...</span>
            </div>
          ) : !response?.data || response.data.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">لم يتم العثور على أي أعضاء مسجلين.</p>
            </div>
          ) : (
            <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200">
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400">الاسم / البريد الإلكتروني</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400">رقم الهاتف</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400">الدور الافتراضي</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400">الحالة</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400">مستوى الصلاحيات</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {response.data.map((user) => {
                    const isSelf = currentUser?.id === user.id
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-100/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {user.name} {isSelf && <span className="text-xs text-farm-blue font-semibold mr-1">(أنت)</span>}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-sans mt-0.5">
                              {user.email}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-400 font-sans">
                          {user.phone || '—'}
                        </td>

                        <td className="p-4">
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-farm-blue/10 text-farm-blue border border-farm-blue/10">
                            {user.roles.includes('super_admin') ? 'Super Admin' :
                             user.roles.includes('admin') ? 'Admin' :
                             user.roles.includes('manager') ? 'Manager' :
                             user.roles.includes('editor') ? 'Editor' :
                             user.roles.includes('viewer') ? 'Viewer' :
                             user.roles.includes('team_member') ? 'Team Member' : user.roles[0] || '—'}
                          </span>
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isSelf}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                              user.is_active
                                ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10 hover:bg-emerald-500/10'
                                : 'bg-red-500/5 text-red-500 border-red-500/10 hover:bg-red-500/10'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={isSelf ? 'لا يمكنك تعطيل حسابك الشخصي' : 'تغيير حالة الحساب'}
                          >
                            <Power className="w-3.5 h-3.5" />
                            {user.is_active ? 'نشط' : 'معطل'}
                          </button>
                        </td>

                        <td className="p-4 text-xs text-gray-500 dark:text-gray-400 font-sans">
                          {user.permissions ? `${user.permissions.length} صلاحية مخصصة` : '0 صلاحية مخصصة'}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-2 text-gray-400 hover:text-farm-blue hover:bg-farm-blue/5 rounded-lg transition-colors"
                              title="تعديل البيانات والصلاحيات"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeletingUser(user)}
                              disabled={isSelf}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              title={isSelf ? 'لا يمكنك حذف حسابك الشخصي' : 'حذف العضو'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
              {response.data.map((user) => {
                const isSelf = currentUser?.id === user.id
                return (
                  <article key={user.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-ink">
                        {user.name} {isSelf && <span className="mr-1 text-xs font-semibold text-action-primary">(أنت)</span>}
                      </p>
                      <p className="text-xs text-ink-muted">{user.email}</p>
                      <p className="text-xs text-ink-soft">{user.phone || '—'}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-lg bg-info-soft px-2.5 py-1 text-xs font-bold text-action-primary">
                        {user.roles.includes('super_admin') ? 'Super Admin' :
                         user.roles.includes('admin') ? 'Admin' :
                         user.roles.includes('manager') ? 'Manager' :
                         user.roles.includes('editor') ? 'Editor' :
                         user.roles.includes('viewer') ? 'Viewer' :
                         user.roles.includes('team_member') ? 'Team Member' : user.roles[0] || '—'}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold ${
                        user.is_active
                          ? 'border-success-soft bg-success-soft text-success'
                          : 'border-danger-soft bg-danger-soft text-danger'
                      }`}>
                        <Power className="h-3.5 w-3.5" />
                        {user.is_active ? 'نشط' : 'معطل'}
                      </span>
                      <span className="text-xs text-ink-muted">{user.permissions ? `${user.permissions.length} صلاحية مخصصة` : '0 صلاحية مخصصة'}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-info-soft bg-info-soft px-4 py-2 text-sm font-semibold text-action-primary"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setDeletingUser(user)}
                        disabled={isSelf}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-danger-soft bg-danger-soft px-4 py-2 text-danger disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
            </>
          )}

          {/* Pagination Controls */}
          {response?.meta && response.meta.last_page > 1 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-sans">
                الصفحة {page} من {response.meta.last_page} (إجمالي {response.meta.total} موظف)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(response.meta!.last_page, p + 1))}
                  disabled={page === response.meta.last_page}
                  className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Slide-over Modal Dialog */}
        {showModal && (
          <AppDialog open={showModal} onClose={() => setShowModal(false)} panelClassName="max-w-4xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-farm-blue/10 text-farm-blue rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {editingUser ? `تعديل صلاحيات: ${editingUser.name}` : 'إضافة عضو جديد وتخصيص الصلاحيات'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {editingUser ? 'تحديث البيانات الأساسية وتفاصيل الصلاحيات للموظف.' : 'سجل تفاصيل الحساب وحدد نطاق الصلاحيات بدقة.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <TeamForm
                  initialData={editingUser}
                  onSubmit={handleSubmitForm}
                  onCancel={() => setShowModal(false)}
                  isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
                  backendErrors={backendErrors}
                />
              </div>
            </div>
          </AppDialog>
        )}

        {/* Delete Confirmation Alert Modal */}
        {deletingUser && (
          <AppDialog open={!!deletingUser} onClose={() => setDeletingUser(null)} panelClassName="max-w-md">
            <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xl space-y-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">تأكيد حذف الحساب؟</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  هل أنت متأكد من رغبتك في حذف حساب الموظف <span className="font-bold text-gray-700 dark:text-gray-300">"{deletingUser.name}"</span> بشكل نهائي؟
                  هذا الإجراء سيؤدي إلى إنهاء إمكانية تسجيل الدخول وشطب كافة الصلاحيات المرتبطة.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>

                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                >
                  تأكيد الحذف النهائي
                </button>
              </div>
            </div>
          </AppDialog>
        )}
      </div>
    </PermissionGuard>
  )
}
