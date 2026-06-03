'use client'

import React from 'react'
import {
  Plus, Receipt, Settings, Trash2, Eye, Edit3, Link, HelpCircle,
  FileText, FolderPlus, Loader2, AlertCircle, FolderOpen, Search
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import type { AccountingAccount } from '@/lib/types'

// --- Reusable Sheet Table ---
function SheetTable({ records, formatBalance, onView, onEdit, onDelete }: {
  records: any[]
  formatBalance: (s: any) => { value: string; isPositive: boolean; raw: number }
  onView: (s: any) => void
  onEdit: (s: any) => void
  onDelete: (s: any) => void
}) {
  if (records.length === 0) {
    return (
      <div className="text-center py-5 text-ink-muted text-xs bg-surface-subtle rounded-xl">
        لا توجد سجلات في هذا القسم
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-right border-collapse text-xs">
        <thead>
          <tr className="bg-surface-subtle border-b border-line text-ink-muted font-bold">
            <th className="p-3 font-sans">اسم السجل</th>
            <th className="p-3 font-sans">الحساب المحاسبي</th>
            <th className="p-3 font-sans">الرصيد</th>
            <th className="p-3 font-sans">الأوراق</th>
            <th className="p-3 font-sans text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {records.map((sheet: any) => {
            const bal = formatBalance(sheet)
            const folderMeta = sheet.folder?.meta
            const isDistributed = folderMeta?.distribute_by_production && folderMeta?.link_type === 'company'
            return (
              <tr key={sheet.id} className="border-b border-line hover:bg-surface-subtle/50 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-action-primary flex-shrink-0" />
                    <strong className="text-ink">{sheet.title}</strong>
                    {isDistributed && (
                      <span className="text-[10px] bg-info-soft text-info px-1.5 py-0.5 rounded font-bold">موزع</span>
                    )}
                    {sheet.status === 'closed' && (
                      <span className="text-[10px] bg-surface-muted text-ink-muted px-1.5 py-0.5 rounded font-bold">مغلق</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-ink-soft">
                  {sheet.account?.name} ({sheet.account?.code})
                </td>
                <td className={`p-3 font-bold ${bal.isPositive ? 'text-success' : 'text-danger'}`}>
                  {bal.value} ر.س
                </td>
                <td className="p-3 text-ink-soft">
                  {sheet.transactions_count ?? 0}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onView(sheet)} className="p-1.5 rounded-lg hover:bg-action-primary hover:text-ink-inverse text-ink-muted transition-colors" title="عرض">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onEdit(sheet)} className="p-1.5 rounded-lg hover:bg-warning hover:text-ink-inverse text-ink-muted transition-colors" title="تعديل">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(sheet)} className="p-1.5 rounded-lg hover:bg-danger hover:text-ink-inverse text-ink-muted transition-colors" title="حذف">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// --- Main Component ---
export default function SheetsTabContent({
  // Data
  folderNodes,
  loadingFolders,
  sheetsGroupedByFolder,
  yearNodeId,
  finInstId,
  selectedYear,
  accounts,
  companies,
  projects,
  // Formatters
  formatBalance,
  // Section CRUD
  openAddSectionModal,
  openEditSectionModal,
  setDeletingSection,
  // Sheet CRUD
  openAddSheetModal,
  openEditSheetModal,
  setDeletingSheet,
  setActiveSheetId,
  // Search
  sheetsSearch,
  setSheetsSearch,
  // Init year
  handleInitYear,
  createNodeMutation,
  // Section modal
  sectionModalOpen,
  setSectionModalOpen,
  editingSection,
  sectionName,
  setSectionName,
  sectionLinkType,
  setSectionLinkType,
  sectionCompanyId,
  setSectionCompanyId,
  sectionProjectId,
  setSectionProjectId,
  sectionDistribute,
  setSectionDistribute,
  sectionError,
  sectionSubmitting,
  handleSaveSection,
  // Sheet modal
  sheetModalOpen,
  setSheetModalOpen,
  editingSheet,
  sheetModalTitle,
  setSheetModalTitle,
  sheetModalAccountId,
  setSheetModalAccountId,
  sheetModalFolderId,
  setSheetModalFolderId,
  sheetModalStart,
  setSheetModalStart,
  sheetModalEnd,
  setSheetModalEnd,
  sheetModalError,
  sheetModalSubmitting,
  handleSaveSheet,
  // Delete confirm
  deletingSection,
  handleDeleteSection,
  deleteNodeMutation,
  deletingSheet,
  handleDeleteSheet,
  deleteSheetMutation,
}: any) {
  // If no year node and we have the institution
  if (finInstId && !yearNodeId) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-10 text-center space-y-4 shadow-sm">
        <div className="mx-auto w-16 h-16 bg-warning-soft rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-warning" />
        </div>
        <h3 className="text-lg font-bold text-ink">لم يتم تهيئة السنة المالية {selectedYear}</h3>
        <p className="text-sm text-ink-muted">يرجى تهيئة السنة المالية في الأرشيف المالي لبدء إدارة الأقسام والسجلات.</p>
        <button
          onClick={handleInitYear}
          disabled={createNodeMutation.isPending}
          className="px-6 py-3 bg-action-primary text-ink-inverse font-bold rounded-xl shadow-md hover:scale-[1.01] transition-transform disabled:opacity-50"
        >
          {createNodeMutation.isPending ? 'جاري التهيئة...' : `تهيئة السنة المالية ${selectedYear}`}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={openAddSheetModal} className="flex items-center gap-1.5 px-4 py-2.5 bg-action-primary text-ink-inverse font-bold text-xs rounded-xl shadow-md hover:scale-[1.01] transition-transform">
            <Plus className="w-4 h-4" />
            <span>إضافة سجل جديد</span>
          </button>
          <button onClick={openAddSectionModal} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface border border-line text-ink font-bold text-xs rounded-xl shadow-sm hover:bg-surface-muted transition-colors">
            <FolderPlus className="w-4 h-4" />
            <span>إضافة قسم جديد</span>
          </button>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="بحث في السجلات..."
            value={sheetsSearch}
            onChange={(e) => setSheetsSearch(e.target.value)}
            className="w-full pl-3 pr-9 py-2.5 bg-surface-muted border border-line rounded-xl text-xs focus:outline-none"
          />
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-ink-muted" />
        </div>
      </div>

      {/* Loading state */}
      {loadingFolders ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-action-primary" /></div>
      ) : (
        <div className="space-y-6">
          {/* Section Cards */}
          {folderNodes.map((folder: any) => {
            const folderSheets = sheetsGroupedByFolder.grouped[folder.id] ?? []
            const linkType = folder.meta?.link_type
            return (
              <div key={folder.id} className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden" style={{ borderTop: '4px solid var(--color-action-primary)' }}>
                {/* Section Header */}
                <div className="flex items-center justify-between p-5 border-b border-line">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-ink">{folder.name}</h3>
                    {linkType && linkType !== 'none' && (
                      <span className="flex items-center gap-1 text-[11px] bg-info-soft text-info px-2 py-0.5 rounded-md font-bold">
                        <Link className="w-3 h-3" />
                        {linkType === 'company' ? 'مرتبط بشركة' : 'مرتبط بمشروع'}
                      </span>
                    )}
                    {folder.meta?.distribute_by_production && (
                      <span className="text-[11px] bg-warning-soft text-warning px-2 py-0.5 rounded-md font-bold">توزيع تناسبي</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditSectionModal(folder)} className="p-2 rounded-lg hover:bg-surface-muted text-ink-muted transition-colors" title="إعدادات القسم">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingSection(folder)} className="p-2 rounded-lg hover:bg-danger-soft text-danger transition-colors" title="حذف القسم">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Section Body: Sheet Table */}
                <div className="p-4">
                  <SheetTable
                    records={folderSheets}
                    formatBalance={formatBalance}
                    onView={(s) => setActiveSheetId(s.id)}
                    onEdit={openEditSheetModal}
                    onDelete={(s) => setDeletingSheet(s)}
                  />
                </div>
              </div>
            )
          })}

          {/* Uncategorized Sheets */}
          {sheetsGroupedByFolder.uncategorized.length > 0 && (
            <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden" style={{ borderTop: '4px solid var(--color-ink-muted)' }}>
              <div className="flex items-center gap-2 p-5 border-b border-line">
                <HelpCircle className="w-5 h-5 text-ink-muted" />
                <h3 className="text-base font-bold text-ink-soft">سجلات عامة (غير مصنفة)</h3>
              </div>
              <div className="p-4">
                <SheetTable
                  records={sheetsGroupedByFolder.uncategorized}
                  formatBalance={formatBalance}
                  onView={(s) => setActiveSheetId(s.id)}
                  onEdit={openEditSheetModal}
                  onDelete={(s) => setDeletingSheet(s)}
                />
              </div>
            </div>
          )}

          {/* Empty state */}
          {folderNodes.length === 0 && sheetsGroupedByFolder.uncategorized.length === 0 && (
            <div className="bg-surface border border-line rounded-2xl p-12 text-center space-y-3">
              <FolderOpen className="w-12 h-12 text-ink-muted mx-auto" />
              <p className="text-sm text-ink-muted font-semibold">لا توجد أقسام أو سجلات في السنة المالية {selectedYear}</p>
              <p className="text-xs text-ink-muted">ابدأ بإضافة قسم جديد ثم أضف السجلات المالية بداخله.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== Section Modal ===== */}
      <AppDialog open={sectionModalOpen} onClose={() => setSectionModalOpen(false)} panelClassName="max-w-lg animate-fade-in">
        <div className="bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden">
          <div className="bg-action-primary text-ink-inverse p-5">
            <h3 className="text-sm font-bold">{editingSection ? 'تعديل إعدادات القسم' : 'إضافة قسم جديد'}</h3>
          </div>
          <form onSubmit={handleSaveSection} className="p-6 space-y-4 text-xs">
            {sectionError && (
              <div className="flex items-center gap-2 p-3 bg-danger-soft border border-danger-soft text-danger rounded-xl">
                <AlertCircle className="w-4 h-4" /><span>{sectionError}</span>
              </div>
            )}
            <div>
              <label className="block font-semibold text-ink-soft mb-1.5">اسم القسم</label>
              <input type="text" required value={sectionName} onChange={(e) => setSectionName(e.target.value)}
                className="w-full p-2.5 bg-surface-muted border border-line rounded-xl focus:outline-none" placeholder="مثال: فواتير المشتريات" />
            </div>
            <div>
              <label className="block font-semibold text-ink-soft mb-1.5">نوع الربط الافتراضي</label>
              <select value={sectionLinkType} onChange={(e) => setSectionLinkType(e.target.value as any)}
                className="w-full p-2.5 bg-surface-muted border border-line rounded-xl focus:outline-none">
                <option value="none">بدون ربط</option>
                <option value="company">ربط بشركة</option>
                <option value="project">ربط بمشروع</option>
              </select>
            </div>
            {sectionLinkType === 'company' && (
              <>
                <div>
                  <label className="block font-semibold text-ink-soft mb-1.5">الشركة المستهدفة</label>
                  <select value={sectionCompanyId ?? ''} onChange={(e) => setSectionCompanyId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full p-2.5 bg-surface-muted border border-line rounded-xl focus:outline-none">
                    <option value="">اختر شركة...</option>
                    {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={sectionDistribute} onChange={(e) => setSectionDistribute(e.target.checked)}
                    className="w-4 h-4 rounded border-line accent-action-primary" />
                  <span className="font-semibold text-ink-soft">تفعيل التوزيع التناسبي حسب الإنتاج</span>
                </label>
              </>
            )}
            {sectionLinkType === 'project' && (
              <div>
                <label className="block font-semibold text-ink-soft mb-1.5">المشروع المستهدف</label>
                <select value={sectionProjectId ?? ''} onChange={(e) => setSectionProjectId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full p-2.5 bg-surface-muted border border-line rounded-xl focus:outline-none">
                  <option value="">اختر مشروع...</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={sectionSubmitting}
                className="flex-1 py-2.5 bg-action-primary text-ink-inverse font-bold rounded-xl shadow-md disabled:opacity-50">
                {sectionSubmitting ? 'جاري الحفظ...' : 'حفظ القسم'}
              </button>
              <button type="button" onClick={() => setSectionModalOpen(false)}
                className="px-4 py-2.5 bg-surface border border-line text-ink-soft font-bold rounded-xl">إلغاء</button>
            </div>
          </form>
        </div>
      </AppDialog>

      {/* ===== Sheet Modal ===== */}
      <AppDialog open={sheetModalOpen} onClose={() => setSheetModalOpen(false)} panelClassName="max-w-lg animate-fade-in">
        <div className="bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden">
          <div className="bg-action-primary text-ink-inverse p-5">
            <h3 className="text-sm font-bold">{editingSheet ? 'تعديل بيانات السجل' : 'إضافة سجل جديد'}</h3>
          </div>
          <form onSubmit={handleSaveSheet} className="p-6 space-y-4 text-xs">
            {sheetModalError && (
              <div className="flex items-center gap-2 p-3 bg-danger-soft border border-danger-soft text-danger rounded-xl">
                <AlertCircle className="w-4 h-4" /><span>{sheetModalError}</span>
              </div>
            )}
            <div>
              <label className="block font-semibold text-ink-soft mb-1.5">عنوان السجل</label>
              <input type="text" required value={sheetModalTitle} onChange={(e) => setSheetModalTitle(e.target.value)}
                className="w-full p-2.5 bg-surface-muted border border-line rounded-xl focus:outline-none" placeholder="مثال: دفتر يناير 2026" />
            </div>
            <div>
              <label className="block font-semibold text-ink-soft mb-1.5">الحساب المحاسبي المرتبط</label>
              <select required value={sheetModalAccountId} onChange={(e) => setSheetModalAccountId(parseInt(e.target.value))}
                className="w-full p-2.5 bg-surface-muted border border-line rounded-xl focus:outline-none">
                <option value="">اختر حساب...</option>
                {accounts.filter((acc: AccountingAccount) => acc.is_active !== false).map((acc: AccountingAccount) => (
                  <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink-soft mb-1.5">القسم (اختياري)</label>
              <select value={sheetModalFolderId ?? ''} onChange={(e) => setSheetModalFolderId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full p-2.5 bg-surface-muted border border-line rounded-xl focus:outline-none">
                <option value="">بدون قسم (غير مصنف)</option>
                {folderNodes.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block font-semibold text-ink-soft mb-1.5">بداية الفترة</label>
                <input type="date" required value={sheetModalStart} onChange={(e) => setSheetModalStart(e.target.value)}
                  className="w-full p-2.5 bg-surface-muted border border-line rounded-xl text-xs" />
              </div>
              <div className="flex-1">
                <label className="block font-semibold text-ink-soft mb-1.5">نهاية الفترة</label>
                <input type="date" required value={sheetModalEnd} onChange={(e) => setSheetModalEnd(e.target.value)}
                  className="w-full p-2.5 bg-surface-muted border border-line rounded-xl text-xs" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={sheetModalSubmitting}
                className="flex-1 py-2.5 bg-action-primary text-ink-inverse font-bold rounded-xl shadow-md disabled:opacity-50">
                {sheetModalSubmitting ? 'جاري الحفظ...' : 'حفظ السجل'}
              </button>
              <button type="button" onClick={() => setSheetModalOpen(false)}
                className="px-4 py-2.5 bg-surface border border-line text-ink-soft font-bold rounded-xl">إلغاء</button>
            </div>
          </form>
        </div>
      </AppDialog>

      {/* ===== Delete Section Confirm ===== */}
      <AppDialog open={!!deletingSection} onClose={() => setDeletingSection(null)} panelClassName="max-w-md animate-fade-in">
        <div className="bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden">
          <div className="bg-danger text-ink-inverse p-5">
            <h3 className="text-sm font-bold">تأكيد حذف القسم</h3>
          </div>
          <div className="p-6 space-y-4 text-sm">
            <p className="text-ink-soft">سيتم حذف القسم <strong className="text-ink">{deletingSection?.name}</strong> وجميع السجلات بداخله نهائياً.</p>
            <div className="flex items-center gap-3">
              <button onClick={handleDeleteSection} disabled={deleteNodeMutation.isPending}
                className="flex-1 py-2.5 bg-danger text-ink-inverse font-bold rounded-xl shadow-md disabled:opacity-50">
                {deleteNodeMutation.isPending ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
              <button onClick={() => setDeletingSection(null)}
                className="px-4 py-2.5 bg-surface border border-line text-ink-soft font-bold rounded-xl">إلغاء</button>
            </div>
          </div>
        </div>
      </AppDialog>

      {/* ===== Delete Sheet Confirm ===== */}
      <AppDialog open={!!deletingSheet} onClose={() => setDeletingSheet(null)} panelClassName="max-w-md animate-fade-in">
        <div className="bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden">
          <div className="bg-danger text-ink-inverse p-5">
            <h3 className="text-sm font-bold">تأكيد حذف السجل</h3>
          </div>
          <div className="p-6 space-y-4 text-sm">
            <p className="text-ink-soft">سيتم حذف السجل <strong className="text-ink">{deletingSheet?.title}</strong> وجميع قيوده المالية نهائياً.</p>
            <div className="flex items-center gap-3">
              <button onClick={handleDeleteSheet} disabled={deleteSheetMutation.isPending}
                className="flex-1 py-2.5 bg-danger text-ink-inverse font-bold rounded-xl shadow-md disabled:opacity-50">
                {deleteSheetMutation.isPending ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
              <button onClick={() => setDeletingSheet(null)}
                className="px-4 py-2.5 bg-surface border border-line text-ink-soft font-bold rounded-xl">إلغاء</button>
            </div>
          </div>
        </div>
      </AppDialog>
    </div>
  )
}
