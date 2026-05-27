'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Loader2, 
  Trash2, 
  Search, 
  DollarSign, 
  FileText, 
  Building2, 
  Percent,
  Calendar,
  X,
  Eye,
  Info,
  Warehouse as WarehouseIcon,
  User as UserIcon,
  Tag
} from 'lucide-react'
import { useInvoices, useCreateInvoice, useDeleteInvoice } from '@/lib/hooks/useFinancial'
import { useWarehouses, useItems } from '@/lib/hooks/useInventory'
import { useCustomers } from '@/lib/hooks/useCustomers'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import type { Invoice, InvoicePayload, InvoiceItemPayload } from '@/lib/api/financial'
import type { Item, Warehouse, Customer, Supplier } from '@/lib/types'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
import AppDialog from '@/components/ui/AppDialog'

interface FormItem {
  item_id: string
  quantity: string
  unit_price: string
}

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchase'>('sales')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // API hooks
  const { data: invoicesData, isLoading: isInvoicesLoading, refetch } = useInvoices(activeTab, search || undefined, page)
  const createInvoiceMutation = useCreateInvoice()
  const deleteInvoiceMutation = useDeleteInvoice()

  // Dropdowns data hooks
  const { data: warehousesData } = useWarehouses(1, 100)
  const { data: itemsData } = useItems(1, 100)
  const { data: customersData } = useCustomers(1, { per_page: 100 })
  const { data: suppliersData } = useSuppliers(1, { per_page: 100 })

  const invoices = invoicesData?.data || []
  const meta = invoicesData?.meta

  const warehouses = warehousesData?.data || []
  const items = itemsData?.data || []
  const customers = customersData?.data || []
  const suppliers = suppliersData?.data || []

  // Create form state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formItems, setFormItems] = useState<FormItem[]>([{ item_id: '', quantity: '1', unit_price: '' }])

  // Form items helpers
  const handleAddItemRow = () => {
    setFormItems(prev => [...prev, { item_id: '', quantity: '1', unit_price: '' }])
  }

  const handleRemoveItemRow = (index: number) => {
    setFormItems(prev => {
      const copy = [...prev]
      copy.splice(index, 1)
      return copy.length === 0 ? [{ item_id: '', quantity: '1', unit_price: '' }] : copy
    })
  }

  const handleItemChange = (index: number, field: keyof FormItem, value: string) => {
    setFormItems(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  // Calculate live aggregates for creation form
  const calculatedSubtotal = formItems.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0
    const p = parseFloat(item.unit_price) || 0
    return sum + (q * p)
  }, 0)
  const calculatedTax = calculatedSubtotal * 0.15 // 15% VAT
  const calculatedTotal = calculatedSubtotal + calculatedTax

  // Reset form when modal toggles or tab changes
  useEffect(() => {
    setInvoiceNumber('')
    setWarehouseId('')
    setCustomerId('')
    setSupplierId('')
    setInvoiceDate(new Date().toISOString().split('T')[0])
    setDueDate('')
    setNotes('')
    setFormItems([{ item_id: '', quantity: '1', unit_price: '' }])
    setFormErrors({})
  }, [showCreateModal, activeTab])

  // Submit Handler
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    // Basic Validation
    const errors: Record<string, string> = {}
    if (!invoiceNumber.trim()) errors.invoice_number = 'يرجى إدخال رقم الفاتورة'
    if (!warehouseId) errors.warehouse_id = 'يرجى اختيار المستودع'
    if (activeTab === 'sales' && !customerId) errors.customer_id = 'يرجى اختيار العميل'
    if (activeTab === 'purchase' && !supplierId) errors.supplier_id = 'يرجى اختيار المورد'
    if (!invoiceDate) errors.invoice_date = 'يرجى إدخال تاريخ الفاتورة'

    // Items validation
    const validItems = formItems.filter(item => item.item_id && parseFloat(item.quantity) > 0 && parseFloat(item.unit_price) >= 0)
    if (validItems.length === 0) {
      errors.items = 'يرجى إضافة صنف واحد على الأقل يحتوي على كمية وسعر صالحين'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    // Pure explicit payload mapping (Rule C & M)
    const payload: InvoicePayload = {
      type: activeTab,
      invoice_number: invoiceNumber.trim(),
      warehouse_id: parseInt(warehouseId),
      customer_id: activeTab === 'sales' ? parseInt(customerId) : null,
      supplier_id: activeTab === 'purchase' ? parseInt(supplierId) : null,
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      notes: notes || null,
      items: validItems.map(item => ({
        item_id: parseInt(item.item_id),
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price)
      }))
    }

    createInvoiceMutation.mutate(payload, {
      onSuccess: () => {
        setShowCreateModal(false)
        refetch()
      },
      onError: (err: any) => {
        if (err.errors) {
          const apiErrors: Record<string, string> = {}
          Object.keys(err.errors).forEach(key => {
            apiErrors[key] = err.errors[key][0]
          })
          setFormErrors(apiErrors)
        } else {
          setFormErrors({ form: err.message || 'حدث خطأ أثناء حفظ الفاتورة' })
        }
      }
    })
  }

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من إلغاء وحذف هذه الفاتورة وعكس جميع قيودها وحركات المخازن الخاصة بها؟')) {
      deleteInvoiceMutation.mutate({ id, type: activeTab }, {
        onSuccess: () => {
          refetch()
        }
      })
    }
  }

  const openInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowDetailsModal(true)
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4 text-right">
          <div className="p-3 bg-farm-blue/10 text-farm-blue rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الفواتير</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              إنشاء فواتير البيع والشراء ومتابعة الأثر المخزني والمالي.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-farm-blue hover:bg-farm-blue/90 text-white px-5 py-3 rounded-xl transition-colors font-semibold text-sm shadow-sm hover:scale-[1.01]"
        >
          <Plus className="w-5 h-5" />
          <span>فاتورة جديدة</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">عدد الفواتير</p>
            <p className="text-xl font-extrabold text-gray-900 mt-0.5">
              {invoices.length} فواتير
            </p>
          </div>
          <div className="p-3 bg-farm-blue/10 text-farm-blue rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">قيمة الفواتير</p>
            <p className="text-xl font-extrabold text-gray-900 mt-0.5">
              {invoices.reduce((sum: number, inv: Invoice) => sum + parseFloat(inv.total_amount || '0'), 0).toLocaleString('ar-SA')} <SaudiRiyalIcon size={18} className="text-emerald-700 inline-block align-middle ml-1" />
            </p>
          </div>
          <div className="p-3 bg-farm-blue/10 text-farm-blue rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">ضريبة القيمة المضافة</p>
            <p className="text-xl font-extrabold text-gray-900 mt-0.5">
              {invoices.reduce((sum: number, inv: Invoice) => sum + parseFloat(inv.tax_amount || '0'), 0).toLocaleString('ar-SA')} <SaudiRiyalIcon size={18} className="text-emerald-700 inline-block align-middle ml-1" />
            </p>
          </div>
          <div className="p-3 bg-farm-blue/10 text-farm-blue rounded-xl">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Search Toolbar */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between md:p-6">
          {/* Tabs */}
          <div className="flex w-full max-w-full overflow-x-auto bg-gray-50 p-1.5 rounded-xl border border-gray-200 md:w-auto">
            <button
              onClick={() => { setActiveTab('sales'); setPage(1) }}
              className={`min-h-11 shrink-0 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors duration-200 ${
                activeTab === 'sales'
                  ? 'bg-farm-blue text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              فواتير المبيعات
            </button>
            <button
              onClick={() => { setActiveTab('purchase'); setPage(1) }}
              className={`min-h-11 shrink-0 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors duration-200 ${
                activeTab === 'purchase'
                  ? 'bg-farm-blue text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              فواتير المشتريات
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="رقم الفاتورة أو اسم العميل..."
              className="w-full min-h-11 pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        {/* Invoices Table */}
        {isInvoicesLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">جاري تحميل سجلات الفواتير الموثقة...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface-subtle">
              <FileText className="h-8 w-8 text-ink-muted" />
            </div>
            <div>
              <h3 className="font-bold text-ink">لا توجد فواتير</h3>
              <p className="mt-1 max-w-sm text-sm text-ink-muted">
                ابدأ بإنشاء فاتورة جديدة من الزر أعلاه.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-subtle text-xs font-bold text-ink-muted">
                  <th className="py-4 px-6">رقم الفاتورة</th>
                  <th className="py-4 px-6">التاريخ</th>
                  <th className="py-4 px-6">{activeTab === 'sales' ? 'العميل' : 'المورد'}</th>
                  <th className="py-4 px-6">المستودع</th>
                  <th className="py-4 px-6">الضريبة</th>
                  <th className="py-4 px-6">الإجمالي</th>
                  <th className="py-4 px-6 text-center">خيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-250">
                {invoices.map((inv: Invoice) => (
                  <tr key={inv.id} className="text-sm text-ink-soft transition-colors hover:bg-surface-subtle">
                    <td className="py-4 px-6 font-mono font-bold text-action-primary">{inv.invoice_number}</td>
                    <td className="py-4 px-6">{inv.invoice_date}</td>
                    <td className="py-4 px-6">
                      {activeTab === 'sales' ? (inv.customer?.customer_name || 'عميل مجهول') : (inv.supplier?.supplier_name || 'مورد مجهول')}
                    </td>
                    <td className="py-4 px-6">{inv.warehouse?.name || 'مستودع مجهول'}</td>
                    <td className="py-4 px-6 font-bold">{parseFloat(inv.tax_amount).toLocaleString('ar-SA')} <SaudiRiyalIcon size={14} className="text-success-strong inline-block align-middle ml-1" /></td>
                    <td className="py-4 px-6 font-bold text-ink">
                      {parseFloat(inv.total_amount).toLocaleString('ar-SA')} <SaudiRiyalIcon size={14} className="text-success-strong inline-block align-middle ml-1" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openInvoiceDetails(inv)}
                          className="p-2 text-ink-muted hover:text-action-primary hover:bg-info-soft rounded-lg transition-colors"
                          title="عرض الفاتورة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-2 text-ink-muted hover:text-danger hover:bg-danger-soft rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {invoices.map((inv: Invoice) => (
              <article
                key={inv.id}
                className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-mono text-sm font-bold text-action-primary">{inv.invoice_number}</p>
                    <p className="text-sm font-semibold text-ink">
                      {activeTab === 'sales' ? (inv.customer?.customer_name || 'عميل مجهول') : (inv.supplier?.supplier_name || 'مورد مجهول')}
                    </p>
                    <p className="text-xs text-ink-muted">{inv.warehouse?.name || 'مستودع مجهول'}</p>
                  </div>
                  <div className="rounded-xl bg-surface-subtle px-3 py-2 text-right">
                    <span className="block text-xs text-ink-muted">التاريخ</span>
                    <span className="text-sm font-semibold text-ink">{inv.invoice_date}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-surface-subtle px-3 py-2">
                    <span className="block text-xs text-ink-muted">الضريبة</span>
                    <span className="font-semibold text-ink">
                      {parseFloat(inv.tax_amount || '0').toLocaleString('ar-SA')} <SaudiRiyalIcon size={14} className="ml-1 inline-block align-middle text-success-strong" />
                    </span>
                  </div>
                  <div className="rounded-xl bg-surface-subtle px-3 py-2">
                    <span className="block text-xs text-ink-muted">الإجمالي</span>
                    <span className="font-semibold text-ink">
                      {parseFloat(inv.total_amount || '0').toLocaleString('ar-SA')} <SaudiRiyalIcon size={14} className="ml-1 inline-block align-middle text-success-strong" />
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => openInvoiceDetails(inv)}
                    className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-info-soft bg-info-soft px-4 py-2 text-sm font-semibold text-action-primary"
                    title="عرض الفاتورة"
                  >
                    <Eye className="h-4 w-4" />
                    <span>عرض</span>
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-danger-soft bg-danger-soft px-4 py-2 text-danger"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex flex-col gap-3 border-t border-line bg-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <span className="text-xs text-ink-muted">
              صفحة {meta.current_page} من {meta.last_page}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={meta.current_page === 1}
                className="min-h-11 rounded-lg border border-line bg-surface px-4 py-2 text-xs font-semibold disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, meta.last_page))}
                disabled={meta.current_page === meta.last_page}
                className="min-h-11 rounded-lg border border-line bg-surface px-4 py-2 text-xs font-semibold disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <AppDialog open={showCreateModal} onClose={() => setShowCreateModal(false)} panelClassName="max-w-4xl">
          <div className="flex max-h-[90vh] w-full flex-col rounded-3xl border border-gray-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-farm-blue/10 text-farm-blue rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  إنشاء فاتورة {activeTab === 'sales' ? 'مبيعات' : 'مشتريات'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitInvoice} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formErrors.form && (
                <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
                  <Info className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm font-semibold">{formErrors.form}</p>
                </div>
              )}

              {/* Grid 1: Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">رقم الفاتورة *</label>
                  <input
                    type="text"
                    required
                    className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue ${
                      formErrors.invoice_number ? 'border-red-500' : 'border-gray-200'
                    }`}
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-00001"
                  />
                  {formErrors.invoice_number && <p className="text-xs text-red-500 mt-1">{formErrors.invoice_number}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">تاريخ الفاتورة *</label>
                  <input
                    type="date"
                    required
                    className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue ${
                      formErrors.invoice_date ? 'border-red-500' : 'border-gray-200'
                    }`}
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                  {formErrors.invoice_date && <p className="text-xs text-red-500 mt-1">{formErrors.invoice_date}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid 2: Stakeholders and Warehouses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">المستودع المحاسبي المولد للحركة *</label>
                  <select
                    required
                    className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue ${
                      formErrors.warehouse_id ? 'border-red-500' : 'border-gray-200'
                    }`}
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                  >
                    <option value="">-- اختر المستودع --</option>
                    {warehouses.map((w: Warehouse) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                  {formErrors.warehouse_id && <p className="text-xs text-red-500 mt-1">{formErrors.warehouse_id}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                    {activeTab === 'sales' ? 'العميل المدين *' : 'المورد الدائن *'}
                  </label>
                  {activeTab === 'sales' ? (
                    <select
                      required
                      className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue ${
                        formErrors.customer_id ? 'border-red-500' : 'border-gray-200'
                      }`}
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                    >
                      <option value="">-- اختر العميل --</option>
                      {customers.map((c: Customer) => (
                        <option key={c.id} value={c.id}>{c.customer_name}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      required
                      className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue ${
                        formErrors.supplier_id ? 'border-red-500' : 'border-gray-200'
                      }`}
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                    >
                      <option value="">-- اختر المورد --</option>
                      {suppliers.map((s: Supplier) => (
                        <option key={s.id} value={s.id}>{s.supplier_name}</option>
                      ))}
                    </select>
                  )}
                  {formErrors[activeTab === 'sales' ? 'customer_id' : 'supplier_id'] && (
                    <p className="text-xs text-red-500 mt-1">
                      {formErrors[activeTab === 'sales' ? 'customer_id' : 'supplier_id']}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Detail Grid */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-gray-900">أصناف الفاتورة وحركات المخازن</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-farm-blue font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة صنف</span>
                  </button>
                </div>

                {formErrors.items && <p className="text-xs text-red-500">{formErrors.items}</p>}

                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500">
                        <th className="py-3 px-4 w-1/2">الصنف</th>
                        <th className="py-3 px-4">الكمية</th>
                        <th className="py-3 px-4">سعر الوحدة</th>
                        <th className="py-3 px-4">الإجمالي</th>
                        <th className="py-3 px-4 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-250">
                      {formItems.map((item, index) => {
                        const qty = parseFloat(item.quantity) || 0
                        const price = parseFloat(item.unit_price) || 0
                        return (
                          <tr key={index} className="text-sm text-gray-700 dark:text-gray-300">
                            <td className="p-3">
                              <select
                                required
                                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-farm-blue"
                                value={item.item_id}
                                onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                              >
                                <option value="">-- اختر الصنف --</option>
                                {items.map((it: Item) => (
                                  <option key={it.id} value={it.id}>{it.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                required
                                min="0.01"
                                step="any"
                                className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-farm-blue"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                placeholder="1"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                required
                                min="0"
                                step="any"
                                className="w-28 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-farm-blue"
                                value={item.unit_price}
                                onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                placeholder="0.00"
                              />
                            </td>
                            <td className="p-3 font-mono font-bold text-gray-900">
                              {(qty * price).toLocaleString('ar-SA')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(index)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
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
              </div>

              {/* Form aggregates totals */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-400">الإجمالي الفرعي: </span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                      {calculatedSubtotal.toLocaleString('ar-SA')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" />
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">الضريبة (15%): </span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                      {calculatedTax.toLocaleString('ar-SA')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" />
                    </span>
                  </div>
                </div>
                <div className="text-md">
                  <span className="text-gray-500 font-semibold">الإجمالي النهائي المستحق: </span>
                  <span className="font-mono font-black text-farm-blue text-lg">
                    {calculatedTotal.toLocaleString('ar-SA')} <SaudiRiyalIcon size={16} className="text-emerald-700 inline-block align-middle ml-1" />
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">ملاحظات الفاتورة</label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue h-20"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اكتب أي شروط أو تفاصيل إضافية متعلقة بالربط المالي أو التسليم..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold border border-gray-250 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createInvoiceMutation.isPending}
                  className="px-5 py-2.5 text-sm font-bold bg-farm-blue hover:bg-farm-blue/90 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2 hover:scale-[1.01] disabled:opacity-50"
                >
                  {createInvoiceMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الترحيل المالي...</span>
                    </>
                  ) : (
                    <span>ترحيل الفاتورة</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </AppDialog>
      )}

      {/* VIEW DETAILS MODAL */}
      {showDetailsModal && selectedInvoice && (
        <AppDialog open={showDetailsModal && !!selectedInvoice} onClose={() => setShowDetailsModal(false)} panelClassName="max-w-4xl">
          <div className="flex max-h-[90vh] w-full flex-col rounded-3xl border border-gray-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-farm-blue/10 text-farm-blue rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    تفاصيل الفاتورة: {selectedInvoice.invoice_number}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs text-farm-blue font-semibold mt-0.5">
                    <Tag className="w-3 h-3" />
                    <span>فواتير {activeTab === 'sales' ? 'المبيعات' : 'المشتريات'}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200 text-sm">
                <div>
                  <span className="block text-xs text-gray-450 mb-1 flex items-center gap-1 font-bold">
                    <Calendar className="w-3.5 h-3.5" /> تاريخ الترحيل
                  </span>
                  <span className="font-bold text-gray-900">{selectedInvoice.invoice_date}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-450 mb-1 flex items-center gap-1 font-bold">
                    <Calendar className="w-3.5 h-3.5" /> تاريخ الاستحقاق
                  </span>
                  <span className="font-bold text-gray-900">{selectedInvoice.due_date || 'غير محدد'}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-450 mb-1 flex items-center gap-1 font-bold">
                    <WarehouseIcon className="w-3.5 h-3.5" /> المستودع المعتمد
                  </span>
                  <span className="font-bold text-gray-900">{selectedInvoice.warehouse?.name || 'مستودع مجهول'}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-450 mb-1 flex items-center gap-1 font-bold">
                    <UserIcon className="w-3.5 h-3.5" /> {activeTab === 'sales' ? 'العميل المدين' : 'المورد الدائن'}
                  </span>
                  <span className="font-bold text-gray-900">
                    {activeTab === 'sales' ? (selectedInvoice.customer?.customer_name || 'مجهول') : (selectedInvoice.supplier?.supplier_name || 'مجهول')}
                  </span>
                </div>
              </div>

              {/* Items Grid */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900">الأصناف الملحقة والقيود المخزنية</h4>
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500">
                        <th className="py-3 px-4 w-1/2">الصنف</th>
                        <th className="py-3 px-4">الكمية</th>
                        <th className="py-3 px-4">سعر الوحدة</th>
                        <th className="py-3 px-4">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-250">
                      {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.map((item) => (
                          <tr key={item.id} className="text-sm text-gray-700 dark:text-gray-300">
                            <td className="p-3 font-semibold">{item.item?.name || 'صنف مجهول'}</td>
                            <td className="p-3 font-mono">{parseFloat(item.quantity).toLocaleString('en-US')}</td>
                            <td className="p-3 font-mono">{parseFloat(item.unit_price).toLocaleString('ar-SA')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" /></td>
                            <td className="p-3 font-mono font-bold text-gray-900">
                              {parseFloat(item.total).toLocaleString('ar-SA')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-500">لا توجد تفاصيل أصناف لهذه الفاتورة</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Aggregates Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block font-bold">المجموع الفرعي الخالي من الضريبة</span>
                  <span className="text-lg font-mono font-bold text-gray-900">
                    {(parseFloat(selectedInvoice.total_amount) - parseFloat(selectedInvoice.tax_amount)).toLocaleString('ar-SA')} <SaudiRiyalIcon size={16} className="text-emerald-700 inline-block align-middle ml-1" />
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block font-bold">قيمة ضريبة القيمة المضافة (15%)</span>
                  <span className="text-lg font-mono font-bold text-gray-900">
                    {parseFloat(selectedInvoice.tax_amount).toLocaleString('ar-SA')} <SaudiRiyalIcon size={16} className="text-emerald-700 inline-block align-middle ml-1" />
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block font-bold">الإجمالي المالي النهائي الموثق</span>
                  <span className="text-xl font-mono font-black text-farm-blue">
                    {parseFloat(selectedInvoice.total_amount).toLocaleString('ar-SA')} <SaudiRiyalIcon size={18} className="text-emerald-700 inline-block align-middle ml-1" />
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/30">
                  <span className="block text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> ملاحظات أو شروط إضافية
                  </span>
                  <p className="text-sm text-blue-900 mt-1">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </AppDialog>
      )}
    </div>
  )
}
