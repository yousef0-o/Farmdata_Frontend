'use client'

import React, { useState } from 'react'
import {
  useArchiveNodes,
  useNodeChildren,
  useNodeBreadcrumb,
  useCreateNode,
  useDeleteNode,
  useCompanies
} from '@/lib/hooks/useArchive'
import {
  Building2,
  Calendar,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  ChevronRight,
  Folder,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import AppDialog from '@/components/ui/AppDialog'

export default function ArchivePage() {
  const [currentNodeId, setCurrentNodeId] = useState<number | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newNodeType, setNewNodeType] = useState<'institution' | 'year' | 'folder'>('institution')
  const [newNodeName, setNewNodeName] = useState('')
  const [newNodeDesc, setNewNodeDesc] = useState('')
  const [distributeByProduction, setDistributeByProduction] = useState(false)
  const [companyId, setCompanyId] = useState('')
  const [formError, setFormError] = useState('')

  // Queries
  const { data: rootNodesRes, isLoading: loadingRoot, error: rootError } = useArchiveNodes(currentNodeId ? undefined : undefined)
  const { data: childrenRes, isLoading: loadingChildren } = useNodeChildren(currentNodeId ?? 0)
  const { data: breadcrumbRes } = useNodeBreadcrumb(currentNodeId ?? 0)
  const { data: companiesList } = useCompanies()

  // Mutations
  const createNodeMutation = useCreateNode()
  const deleteNodeMutation = useDeleteNode()

  // Breadcrumbs helper
  const breadcrumbs = breadcrumbRes?.data ?? []

  // Resolve list of nodes depending on whether we are at root or in a child node
  const activeNodes = currentNodeId ? (childrenRes?.data ?? []) : (rootNodesRes?.data ?? [])
  const filteredNodes = activeNodes.filter(node =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (node.description && node.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const isLoading = currentNodeId ? loadingChildren : loadingRoot
  const isError = rootError

  // Determine allowed types under the current node
  const getCurrentAllowedType = (): 'institution' | 'year' | 'folder' => {
    if (!currentNodeId) return 'institution'
    const current = breadcrumbs[breadcrumbs.length - 1]
    if (current?.type === 'institution') return 'year'
    return 'folder'
  }

  const handleAddClick = () => {
    setNewNodeType(getCurrentAllowedType())
    setNewNodeName('')
    setNewNodeDesc('')
    setDistributeByProduction(false)
    setCompanyId('')
    setFormError('')
    setShowAddModal(true)
  }

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNodeName.trim()) {
      setFormError('يرجى إدخال الاسم')
      return
    }

    try {
      await createNodeMutation.mutateAsync({
        parent_id: currentNodeId ?? null,
        type: newNodeType,
        name: newNodeName.trim(),
        description: newNodeDesc.trim() || undefined,
        meta: newNodeType === 'folder' ? {
          distribute_by_production: distributeByProduction,
          company_id: distributeByProduction && companyId ? parseInt(companyId) : null
        } : undefined
      } as any)
      setShowAddModal(false)
    } catch (err: any) {
      setFormError(err?.message || 'حدث خطأ أثناء إضافة العنصر')
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const triggerDelete = (node: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteTarget(node)
    setDeleteError('')
  }

  const confirmDeleteNode = async () => {
    if (!deleteTarget) return
    setDeleteError('')
    try {
      await deleteNodeMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err: any) {
      setDeleteError(err?.message || 'فشل حذف العنصر')
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">الأرشيف</h1>
          <p className="text-gray-500 text-sm mt-1">تنظيم المستندات في مجلدات حسب الشركات والسنوات المالية.</p>
        </div>
        
        <button
          onClick={handleAddClick}
          disabled={createNodeMutation.isPending}
          className="flex items-center gap-2 px-5 py-3 bg-farm-blue text-white font-semibold text-sm rounded-xl shadow-md hover:bg-opacity-90 active:scale-[0.98] transition-colors disabled:opacity-50 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>
            {getCurrentAllowedType() === 'institution' && 'إضافة شركة'}
            {getCurrentAllowedType() === 'year' && 'إضافة سنة'}
            {getCurrentAllowedType() === 'folder' && 'مجلد جديد'}
          </span>
        </button>
      </div>

      {/* Navigation Breadcrumb Bar */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm overflow-x-auto">
        <button
          onClick={() => setCurrentNodeId(undefined)}
          className={`flex items-center gap-1 font-semibold ${!currentNodeId ? 'text-farm-blue' : 'text-gray-500 hover:text-farm-blue'}`}
        >
          <Building2 className="w-4 h-4" />
          <span>الرئيسية (المؤسسات)</span>
        </button>

        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            <button
              onClick={() => setCurrentNodeId(crumb.id)}
              className={`font-semibold shrink-0 ${idx === breadcrumbs.length - 1 ? 'text-farm-blue font-bold' : 'text-gray-500 hover:text-farm-blue'}`}
            >
              {crumb.type === 'year' ? <Calendar className="w-4 h-4 inline ml-1 align-text-bottom" /> : <Folder className="w-4 h-4 inline ml-1 align-text-bottom" />}
              <span>{crumb.name}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Dynamic Search & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="اسم المجلد أو الشركة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue focus:border-transparent"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
        </div>

        <div className="text-xs text-gray-500 shrink-0">
          إجمالي العناصر المستعرضة: <span className="font-bold text-gray-900">{filteredNodes.length}</span>
        </div>
      </div>

      {/* Nodes Explorer Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
          <span className="text-gray-500 text-sm mt-3 font-medium">جاري تحميل شجرة الأرشيف...</span>
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">فشل تحميل الأرشيف، يرجى التحقق من اتصالك بالخادم.</span>
        </div>
      ) : filteredNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-gray-200 rounded-2xl">
          <FolderOpen className="w-12 h-12 text-gray-300" />
          <span className="text-gray-500 text-sm mt-3 font-semibold">المجلد فارغ</span>
          <button
            onClick={handleAddClick}
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
          >
            أضف ملفاً أو مجلداً للبدء
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNodes.map((node) => {
            const isFolder = node.type === 'folder'
            
            return (
              <div
                key={node.id}
                onClick={() => {
                  if (node.type === 'folder') {
                    // Navigate to folder detail
                    window.location.href = `/archive/folder/${node.id}`
                  } else {
                    setCurrentNodeId(node.id)
                  }
                }}
                className="group relative flex flex-col justify-between p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-farm-blue cursor-pointer transition-colors duration-200"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${
                      node.type === 'institution' ? 'bg-blue-50 text-blue-600' :
                      node.type === 'year' ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {node.type === 'institution' && <Building2 className="w-6 h-6" />}
                      {node.type === 'year' && <Calendar className="w-6 h-6" />}
                      {node.type === 'folder' && <Folder className="w-6 h-6" />}
                    </div>

                    <button
                      onClick={(e) => triggerDelete(node, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-150"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 font-sans mt-4 group-hover:text-farm-blue transition-colors">
                    {node.name}
                  </h3>

                  {node.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {node.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 mt-6 pt-4 text-xs text-gray-500">
                  <span>
                    {node.type === 'institution' && 'مؤسسة معتمدة'}
                    {node.type === 'year' && 'سنة أرشيفية'}
                    {node.type === 'folder' && 'مجلد مستندات'}
                  </span>
                  
                  <span className="font-semibold text-farm-blue flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                    {isFolder ? 'عرض المستندات والبيانات' : 'استعراض المحتوى'}
                    <ChevronRight className="w-3 h-3 rotate-180" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Node Modal Form */}
      {showAddModal && (
        <AppDialog open={showAddModal} onClose={() => setShowAddModal(false)} panelClassName="max-w-md animate-fade-in">
          <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 font-sans">
              {newNodeType === 'institution' && 'إضافة شركة'}
              {newNodeType === 'year' && 'إضافة سنة'}
              {newNodeType === 'folder' && 'مجلد جديد'}
            </h2>

            <form onSubmit={handleCreateNode} className="mt-4 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-200 text-red-750 text-xs rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  الاسم / العنوان <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder={
                    newNodeType === 'institution' ? 'مثال: وزارة الشؤون المالية' :
                    newNodeType === 'year' ? 'مثال: عام 2026' :
                    'مثال: فواتير المشتريات الزراعية'
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue"
                />
              </div>

              {newNodeType !== 'year' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">الوصف (اختياري)</label>
                  <textarea
                    value={newNodeDesc}
                    onChange={(e) => setNewNodeDesc(e.target.value)}
                    placeholder="تفاصيل إضافية حول محتوى المجلد أو المؤسسة..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue"
                  />
                </div>
              )}

              {newNodeType === 'folder' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="distributeByProduction"
                      checked={distributeByProduction}
                      onChange={(e) => setDistributeByProduction(e.target.checked)}
                      className="rounded border-gray-300 text-farm-blue focus:ring-farm-blue w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="distributeByProduction" className="text-xs font-bold text-gray-700 cursor-pointer">
                      توزيع التكاليف ديناميكياً بناءً على إنتاج البيض للمشاريع
                    </label>
                  </div>

                  {distributeByProduction && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="block text-xs font-semibold text-gray-650">
                        الشركة المستهدفة للتوزيع <span className="text-red-500">*</span>
                      </label>
                      <select
                        required={distributeByProduction}
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue"
                      >
                        <option value="">-- اختر الشركة --</option>
                        {companiesList?.data?.map((comp: any) => (
                          <option key={comp.id} value={comp.id}>{comp.company_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createNodeMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-farm-blue text-white font-bold text-xs rounded-lg hover:bg-opacity-90 active:scale-[0.98] disabled:opacity-50 transition-colors"
                >
                  {createNodeMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>حفظ</span>
                </button>
              </div>
            </form>
          </div>
        </AppDialog>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AppDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} panelClassName="max-w-md animate-fade-in">
          <div className="w-full space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl" dir="rtl">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="p-2.5 bg-red-50 text-red-650 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-sans">حذف نهائي</h3>
                <p className="text-xs text-gray-400 mt-0.5">سيتم إزالة العنصر وكافة البيانات المرتبطة به</p>
              </div>
            </div>

            {deleteError && (
              <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-200 text-red-750 text-xs rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="text-xs text-gray-650 leading-relaxed font-sans space-y-2">
              <p>
                تنبيه: أنت على وشك حذف العنصر <span className="font-bold text-red-600">"{deleteTarget.name}"</span> وكل ما يحتويه من مجلدات فرعية، مستندات، وملفات بشكل نهائي.
              </p>
              <p className="font-semibold text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                ⚠️ لا يمكن التراجع عن هذا الإجراء بعد تنفيذه من خوادم النظام.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDeleteNode}
                disabled={deleteNodeMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors shadow disabled:opacity-50"
              >
                {deleteNodeMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>حذف نهائي</span>
              </button>
            </div>
          </div>
        </AppDialog>
      )}
    </div>
  )
}
