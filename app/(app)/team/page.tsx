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
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-farm-blue hover:bg-farm-blue-dark text-white text-sm font-semibold shadow-sm transition-all hover:scale-[1.01]"
          >
            <UserPlus className="w-5 h-5" />
            إضافة موظف جديد
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
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
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue/20"
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
            <div className="overflow-x-auto">
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
                        className="hover:bg-gray-100/30 transition-all"
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
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
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
                              className="p-2 text-gray-400 hover:text-farm-blue hover:bg-farm-blue/5 rounded-lg transition-all"
                              title="تعديل البيانات والصلاحيات"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeletingUser(user)}
                              disabled={isSelf}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
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
                  className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(response.meta!.last_page, p + 1))}
                  disabled={page === response.meta.last_page}
                  className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Slide-over Modal Dialog */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-all">
            <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
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
          </div>
        )}

        {/* Delete Confirmation Alert Modal */}
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-xl text-center space-y-4">
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
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  إلغاء
                </button>

                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all"
                >
                  تأكيد الحذف النهائي
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  )
}
