'use client'

import React, { useMemo, useState } from 'react'
import {
  Brush,
  Eye,
  FilePlus2,
  FileText,
  Loader2,
  Paintbrush,
  PlusCircle,
  Printer,
  Save,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import {
  useCreateNurseryInvoice,
  useNurseryInvoice,
  useNurseryInvoices,
  useUpdateNurseryInvoiceSettings,
} from '@/lib/hooks/useNurseryInvoices'
import type {
  NurseryInvoice,
  NurseryInvoiceBootstrap,
  NurseryInvoiceDetails,
  NurseryInvoiceSettings,
  NurseryInvoiceStatus,
  NurseryInvoiceTreeOption,
  NurseryInvoiceType,
} from '@/lib/types/nurseryInvoices'

type ActiveTab = 'invoices' | 'design'
type FilterType = NurseryInvoiceType | 'all'
type DraftLine = {
  id: number
  treeId: string
  name: string
  qty: number
  price: number
}

const inputClass =
  'min-h-11 w-full rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm font-semibold text-ink outline-none transition-[border-color,background-color,box-shadow] duration-200 focus:border-action-primary focus:bg-surface focus:ring-2 focus:ring-action-primary/20'

const statusLabels: Record<NurseryInvoiceStatus, string> = {
  paid: 'مدفوعة',
  unpaid: 'غير مدفوعة',
  draft: 'مسودة',
}

import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function asNumber(value: string | number | null | undefined) {
  return Number(value ?? 0)
}

function formatMoney(value: string | number | null | undefined) {
  return (
    <span className="inline-flex items-center gap-1">
      <span>
        {new Intl.NumberFormat('ar-SA', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }).format(asNumber(value))}
      </span>
      <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" />
    </span>
  )
}

function formatNumber(value: string | number | null | undefined) {
  return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(asNumber(value))
}

function invoiceTypeLabel(type: NurseryInvoiceType) {
  return type === 'sale' ? 'بيع' : 'شراء'
}

function StatusBadge({ status }: { status: NurseryInvoiceStatus }) {
  const className =
    status === 'paid'
      ? 'bg-success-soft text-success-strong'
      : status === 'unpaid'
        ? 'bg-warning-soft text-warning-strong'
        : 'bg-surface-muted text-ink-soft'

  return <span className={`rounded-lg px-2.5 py-1 text-xs font-extrabold ${className}`}>{statusLabels[status]}</span>
}

function TypeBadge({ type }: { type: NurseryInvoiceType }) {
  const Icon = type === 'sale' ? ShoppingCart : Truck
  const className = type === 'sale' ? 'bg-success-soft text-success-strong' : 'bg-danger-soft text-danger'

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {invoiceTypeLabel(type)}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface-subtle p-10 text-center text-ink-muted">
      <FileText className="mx-auto h-12 w-12" />
      <p className="mt-4 text-sm font-bold">لا توجد فواتير مطابقة لخيارات البحث</p>
    </div>
  )
}

function FilterButton({
  value,
  active,
  children,
  onClick,
}: {
  value: FilterType
  active: FilterType
  children: React.ReactNode
  onClick: (value: FilterType) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`min-h-11 rounded-xl border px-4 text-sm font-extrabold transition-colors ${
        active === value
          ? 'border-action-primary bg-action-primary text-ink-inverse'
          : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function SummaryStrip({ data }: { data: NurseryInvoiceBootstrap | undefined }) {
  const items = [
    { label: 'عدد الفواتير', value: formatNumber(data?.summary.count ?? 0) },
    { label: 'المجموع الفرعي', value: formatMoney(data?.summary.subtotal ?? 0) },
    { label: 'ضريبة القيمة المضافة', value: formatMoney(data?.summary.vat ?? 0) },
    { label: 'الإجمالي', value: formatMoney(data?.summary.total ?? 0) },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-line bg-surface px-4 py-3">
          <div className="text-xs font-bold text-ink-muted">{item.label}</div>
          <div className="mt-1 text-base font-extrabold text-ink">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

function InvoiceTable({
  invoices,
  onView,
}: {
  invoices: NurseryInvoice[]
  onView: (id: number) => void
}) {
  if (invoices.length === 0) return <EmptyState />

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface lg:block">
        <table className="min-w-[760px] w-full text-right text-sm">
          <thead className="bg-surface-subtle text-xs font-bold text-ink-muted">
            <tr>
              <th className="px-4 py-3">رقم الفاتورة</th>
              <th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">العميل</th>
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3">الإجمالي</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3 font-mono text-sm font-bold text-ink">{invoice.invoice_number}</td>
                <td className="px-4 py-3"><TypeBadge type={invoice.type} /></td>
                <td className="px-4 py-3 font-semibold text-ink-soft">{invoice.client_name || '-'}</td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-ink-soft">{invoice.invoice_date || '-'}</td>
                <td className="px-4 py-3 font-extrabold text-ink">{formatMoney(invoice.total_amount)}</td>
                <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onView(invoice.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
                    title="عرض"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {invoices.map((invoice) => (
          <article key={invoice.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-sm font-extrabold text-ink">{invoice.invoice_number}</div>
                <div className="mt-1 text-xs font-semibold text-ink-muted">{invoice.client_name || '-'}</div>
              </div>
              <TypeBadge type={invoice.type} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs font-bold text-ink-muted">التاريخ</div>
                <div className="font-mono font-bold text-ink-soft">{invoice.invoice_date || '-'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-ink-muted">الإجمالي</div>
                <div className="font-extrabold text-ink">{formatMoney(invoice.total_amount)}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <StatusBadge status={invoice.status} />
              <button
                type="button"
                onClick={() => onView(invoice.id)}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-bold text-ink-soft"
              >
                <Eye className="h-4 w-4" />
                عرض
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function InvoiceDialog({
  open,
  data,
  onClose,
}: {
  open: boolean
  data: NurseryInvoiceBootstrap
  onClose: () => void
}) {
  const createMutation = useCreateNurseryInvoice()
  const [type, setType] = useState<NurseryInvoiceType>('sale')
  const [lines, setLines] = useState<DraftLine[]>([
    { id: 1, treeId: '', name: '', qty: 1, price: 0 },
  ])

  const subtotal = lines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.price || 0), 0)
  const vat = subtotal * 0.15
  const total = subtotal + vat

  function selectedTree(treeId: string): NurseryInvoiceTreeOption | undefined {
    return data.tree_options.find((tree) => String(tree.tree_id) === treeId)
  }

  function updateLine(id: number, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }

  function addLine() {
    setLines((current) => [...current, { id: Date.now(), treeId: '', name: '', qty: 1, price: 0 }])
  }

  return (
    <AppDialog open={open} onClose={onClose} labelledBy="nursery-invoice-modal-title" panelClassName="max-w-5xl">
      <form
        className="max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          createMutation.mutate(
            {
              type,
              invoice_number: String(form.get('invoice_number') || data.next_invoice_number),
              contact_id: form.get('contact_id') ? Number(form.get('contact_id')) : null,
              invoice_date: String(form.get('invoice_date') || today()),
              status: String(form.get('status') || 'unpaid') as NurseryInvoiceStatus,
              items: lines
                .filter((line) => line.treeId)
                .map((line) => ({
                  tree_id: Number(line.treeId),
                  name: line.name,
                  qty: Number(line.qty),
                  price: Number(line.price),
                })),
            },
            {
              onSuccess: () => {
                setLines([{ id: Date.now(), treeId: '', name: '', qty: 1, price: 0 }])
                onClose()
              },
            }
          )
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="nursery-invoice-modal-title" className="text-xl font-extrabold text-ink">إضافة فاتورة جديدة</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="نوع الفاتورة">
            <select className={inputClass} value={type} onChange={(event) => setType(event.target.value as NurseryInvoiceType)}>
              <option value="sale">فاتورة بيع</option>
              <option value="purchase">فاتورة شراء</option>
            </select>
          </Field>
          <Field label="رقم الفاتورة">
            <input name="invoice_number" className={inputClass} defaultValue={data.next_invoice_number} required />
          </Field>
          <Field label="العميل / المورد">
            <select name="contact_id" className={inputClass} required>
              <option value="">اختر...</option>
              {data.contacts
                .filter((contact) =>
                  type === 'sale'
                    ? contact.type === 'customer' || contact.type === 'both'
                    : contact.type === 'supplier' || contact.type === 'both'
                )
                .map((contact) => (
                  <option key={contact.id} value={contact.id}>{contact.name}</option>
                ))}
            </select>
          </Field>
          <Field label="التاريخ">
            <input name="invoice_date" className={inputClass} type="date" defaultValue={today()} required />
          </Field>
          <Field label="الحالة">
            <select name="status" className={inputClass} defaultValue="unpaid">
              <option value="unpaid">غير مدفوعة</option>
              <option value="paid">مدفوعة</option>
              <option value="draft">مسودة</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
          <table className="min-w-[760px] w-full text-right text-sm">
            <thead className="bg-surface-subtle text-xs font-bold text-ink-muted">
              <tr>
                <th className="px-3 py-3">الصنف</th>
                <th className="w-28 px-3 py-3">الكمية</th>
                <th className="w-32 px-3 py-3">سعر الوحدة</th>
                <th className="w-32 px-3 py-3">الإجمالي</th>
                <th className="w-14 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-3 py-3">
                    <select
                      className={inputClass}
                      value={line.treeId}
                      required
                      onChange={(event) => {
                        const tree = selectedTree(event.target.value)
                        updateLine(line.id, {
                          treeId: event.target.value,
                          name: tree ? `${tree.tree_name}${tree.pot_size ? ` (${tree.pot_size})` : ''}` : '',
                        })
                      }}
                    >
                      <option value="">اختر الصنف...</option>
                      {data.tree_options.map((tree) => (
                        <option key={tree.tree_id} value={tree.tree_id}>
                          {tree.basin_name} / خط {tree.line_number} - {tree.tree_name}
                          {tree.pot_size ? ` (${tree.pot_size})` : ''} - متوفر: {formatNumber(tree.quantity)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <input className={inputClass} type="number" min={1} value={line.qty} onChange={(event) => updateLine(line.id, { qty: Number(event.target.value) })} required />
                  </td>
                  <td className="px-3 py-3">
                    <input className={inputClass} type="number" min={0} step="0.01" value={line.price} onChange={(event) => updateLine(line.id, { price: Number(event.target.value) })} required />
                  </td>
                  <td className="px-3 py-3">
                    <input className={`${inputClass} font-mono`} readOnly value={(Number(line.qty || 0) * Number(line.price || 0)).toFixed(2)} />
                  </td>
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))} className="rounded-lg p-2 text-danger transition-colors hover:bg-danger-soft">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" onClick={addLine} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-muted px-4 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-subtle">
          <PlusCircle className="h-4 w-4" />
          إضافة سطر
        </button>

        <div className="mt-4 rounded-2xl bg-surface-subtle p-4 text-left text-sm font-semibold text-ink-soft">
          <div>المجموع الفرعي: <span className="font-mono text-ink">{subtotal.toFixed(2)}</span> <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" /></div>
          <div>ضريبة القيمة المضافة (15%): <span className="font-mono text-ink">{vat.toFixed(2)}</span> <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" /></div>
          <div className="mt-1 text-lg font-extrabold text-ink">الإجمالي: <span className="font-mono">{total.toFixed(2)}</span> <SaudiRiyalIcon size={16} className="text-emerald-700 inline-block align-middle ml-1" /></div>
        </div>

        {createMutation.isError ? (
          <p className="mt-3 rounded-xl bg-danger-soft px-4 py-3 text-sm font-bold text-danger">
            {errorMessage(createMutation.error)}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-line bg-surface px-5 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-muted">إلغاء</button>
          <button type="submit" disabled={createMutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-action-primary px-5 text-sm font-bold text-ink-inverse transition-colors hover:bg-action-primary-hover disabled:opacity-60">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ الفاتورة
          </button>
        </div>
      </form>
    </AppDialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-ink-soft">{label}</span>
      {children}
    </label>
  )
}

function errorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return 'حدث خطأ أثناء حفظ الفاتورة.'
  const maybe = error as { message?: string; errors?: Record<string, string[]> }
  if (maybe.message) return maybe.message
  const first = maybe.errors ? Object.values(maybe.errors)[0]?.[0] : null
  return first || 'حدث خطأ أثناء حفظ الفاتورة.'
}

function InvoicePreview({
  invoice,
  settings,
  livePreview = false,
}: {
  invoice: NurseryInvoiceDetails
  settings: NurseryInvoiceSettings
  livePreview?: boolean
}) {
  const color = settings.primary_color || '#10b981'
  const titleColor = livePreview ? color : invoice.type === 'sale' ? '#10b981' : '#ef4444'
  const logoSrc = settings.logo_path || 'https://via.placeholder.com/150'
  const headerLine = Boolean(settings.header_line)
  const footerLine = Boolean(settings.footer_line)
  const striped = Boolean(settings.table_striped)
  const tableBorderStyle = {
    borderBottom: `${Number(settings.table_border_width ?? 1)}px solid #e2e8f0`,
  }

  return (
    <div
      id="nursery-invoice-print-area"
      className="bg-surface p-8 text-ink"
      dir="rtl"
      style={{
        border: Number(settings.frame_border_width || 0) > 0
          ? `${Number(settings.frame_border_width)}px solid ${color}`
          : '1px solid #e2e8f0',
        fontSize: `${settings.font_size || 14}px`,
        fontFamily: `${settings.font_family || 'Tajawal'}, sans-serif`,
        minHeight: livePreview ? 600 : undefined,
      }}
    >
      <div className={`flex justify-between gap-6 pb-4 ${headerLine ? 'border-b' : ''}`} style={{ borderColor: color }}>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: titleColor }}>{invoice.type === 'sale' ? 'فاتورة بيع' : 'فاتورة شراء'}</h1>
          <div className="mt-2 font-mono text-sm text-ink-soft">رقم: {invoice.invoice_number}</div>
          <div className="font-mono text-sm text-ink-soft">التاريخ: {invoice.invoice_date || '-'}</div>
        </div>
        <div className="text-left">
          <img src={logoSrc} alt="" className="max-h-24 max-w-36 object-contain" />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-extrabold">{settings.company_name}</h2>
        <div className="mt-1 text-sm font-semibold text-ink-soft">{settings.company_address}</div>
        <div className="mt-1 text-sm font-semibold text-ink-soft">الرقم الضريبي: {settings.tax_number || '-'}</div>
      </div>

      <div className="mt-8 text-sm font-semibold text-ink-soft">
        <strong className="text-ink">فاتورة إلى:</strong><br />
        <span className="whitespace-pre-line">
          {livePreview ? 'اسم العميل المثال\nعنوان العميل المثال، الرياض' : invoice.client_name || '-'}
        </span>
      </div>

      <table className="mt-8 w-full border-collapse text-right text-sm">
        <thead>
          <tr className="bg-surface-subtle">
            <th className="px-3 py-3" style={tableBorderStyle}>الصنف</th>
            <th className="px-3 py-3" style={tableBorderStyle}>الكمية</th>
            <th className="px-3 py-3" style={tableBorderStyle}>السعر</th>
            <th className="px-3 py-3" style={tableBorderStyle}>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.id} className={striped && index % 2 === 1 ? 'bg-surface-subtle' : ''}>
              <td className="px-3 py-3" style={tableBorderStyle}>{item.item_name || '-'}</td>
              <td className="px-3 py-3 font-mono" style={tableBorderStyle}>{formatNumber(item.quantity)}</td>
              <td className="px-3 py-3 font-mono" style={tableBorderStyle}>{formatMoney(item.unit_price)}</td>
              <td className="px-3 py-3 font-mono" style={tableBorderStyle}>{formatMoney(item.total_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 text-left text-sm font-semibold">
        <div>المجموع الفرعي: {formatMoney(invoice.subtotal)}</div>
        <div className="mt-1">ضريبة القيمة المضافة (15%): {formatMoney(invoice.vat_amount)}</div>
        <div className="mt-2 text-lg font-extrabold" style={{ color }}>الإجمالي: {formatMoney(invoice.total_amount)}</div>
      </div>

      <div className={`mt-12 pt-4 text-center text-sm font-semibold text-ink-muted ${footerLine ? 'border-t border-line' : ''}`}>
        {settings.footer_text}
      </div>
    </div>
  )
}

function ViewInvoiceDialog({
  invoiceId,
  onClose,
}: {
  invoiceId: number | null
  onClose: () => void
}) {
  const { data, isLoading } = useNurseryInvoice(invoiceId)
  const payload = data?.data

  function printInvoice() {
    window.print()
  }

  return (
    <AppDialog open={Boolean(invoiceId)} onClose={onClose} labelledBy="view-invoice-title" panelClassName="max-w-5xl">
      <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-surface-subtle p-3">
          <h2 id="view-invoice-title" className="text-lg font-extrabold text-ink">عرض الفاتورة</h2>
          <div className="flex gap-2">
            <button type="button" onClick={printInvoice} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-action-primary px-4 text-sm font-bold text-ink-inverse">
              <Printer className="h-4 w-4" />
              طباعة A4
            </button>
            <button type="button" onClick={onClose} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-bold text-ink-soft">
              <X className="h-4 w-4" />
              إغلاق
            </button>
          </div>
        </div>
        {isLoading || !payload ? (
          <div className="flex min-h-64 items-center justify-center text-ink-muted">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <InvoicePreview invoice={payload.invoice} settings={payload.settings} />
        )}
      </div>
    </AppDialog>
  )
}

function DesignTab({ settings }: { settings: NurseryInvoiceSettings }) {
  const updateMutation = useUpdateNurseryInvoiceSettings()
  const [draft, setDraft] = useState<NurseryInvoiceSettings>(settings)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  function patch<K extends keyof NurseryInvoiceSettings>(key: K, value: NurseryInvoiceSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const sampleInvoice = useMemo<NurseryInvoiceDetails>(() => ({
    id: 0,
    invoice_number: 'INV-2026-001',
    type: 'sale',
    client_name: 'اسم العميل المثال',
    invoice_date: today(),
    status: 'unpaid',
    subtotal: 550,
    vat_amount: 82.5,
    total_amount: 632.5,
    created_by: null,
    created_at: null,
    items: [
      { id: 1, invoice_id: 0, item_name: 'شجرة ليمون', quantity: 2, unit_price: 150, total_price: 300, tree_id: null, basin_id: null },
      { id: 2, invoice_id: 0, item_name: 'ياسمين هندي', quantity: 5, unit_price: 50, total_price: 250, tree_id: null, basin_id: null },
    ],
  }), [])

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form
        className="rounded-2xl border border-line bg-surface p-5"
        onSubmit={(event) => {
          event.preventDefault()
          const formData = new FormData()
          Object.entries(draft).forEach(([key, value]) => {
            formData.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value ?? ''))
          })
          if (logoFile) formData.set('logo', logoFile)
          updateMutation.mutate(formData)
        }}
      >
        <h2 className="mb-5 flex items-center gap-2 text-lg font-extrabold text-ink">
          <Brush className="h-5 w-5 text-action-primary" />
          خيارات التصميم
        </h2>
        <div className="grid gap-4">
          <Field label="شعار الشركة">
            <input
              className={inputClass}
              type="file"
              accept="image/*"
              onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
            />
          </Field>
          <Field label="اسم الشركة">
            <input className={inputClass} value={draft.company_name || ''} onChange={(event) => patch('company_name', event.target.value)} />
          </Field>
          <Field label="عنوان الشركة">
            <input className={inputClass} value={draft.company_address || ''} onChange={(event) => patch('company_address', event.target.value)} />
          </Field>
          <Field label="الرقم الضريبي">
            <input className={inputClass} value={draft.tax_number || ''} onChange={(event) => patch('tax_number', event.target.value)} />
          </Field>
          <Field label="نص التذييل">
            <textarea className={`${inputClass} min-h-24 resize-y`} value={draft.footer_text || ''} onChange={(event) => patch('footer_text', event.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-surface-subtle p-4">
              <div className="mb-3 text-sm font-extrabold text-ink">التنسيق العام</div>
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3 text-sm font-bold text-ink-soft">
                  <span>لون الإطار</span>
                  <input className="h-8 w-14 rounded border border-line bg-surface p-0.5" type="color" value={draft.primary_color || '#10b981'} onChange={(event) => patch('primary_color', event.target.value)} />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm font-bold text-ink-soft">
                  <span>سماكة الإطار</span>
                  <input className={`${inputClass} w-20 px-2 py-1`} type="number" min={0} max={20} value={draft.frame_border_width || 0} onChange={(event) => patch('frame_border_width', Number(event.target.value))} />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm font-bold text-ink-soft">
                  <span>حجم الخط</span>
                  <input className={`${inputClass} w-20 px-2 py-1`} type="number" min={10} max={24} value={draft.font_size || 14} onChange={(event) => patch('font_size', Number(event.target.value))} />
                </label>
              </div>
            </div>

            <div className="rounded-xl bg-surface-subtle p-4">
              <div className="mb-3 text-sm font-extrabold text-ink">خيارات إضافية</div>
              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm font-bold text-ink-soft">
                  خط فاصل للرأس
                  <input type="checkbox" checked={Boolean(draft.header_line)} onChange={(event) => patch('header_line', event.target.checked)} />
                </label>
                <label className="flex items-center justify-between text-sm font-bold text-ink-soft">
                  خط فاصل للتذييل
                  <input type="checkbox" checked={Boolean(draft.footer_line)} onChange={(event) => patch('footer_line', event.target.checked)} />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-surface-subtle p-4">
            <div className="mb-3 text-sm font-extrabold text-ink">تنسيق الجدول</div>
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 text-sm font-bold text-ink-soft">
                <span>سماكة حدود الجدول</span>
                <input className={`${inputClass} w-20 px-2 py-1`} type="number" min={0} max={10} value={draft.table_border_width || 1} onChange={(event) => patch('table_border_width', Number(event.target.value))} />
              </label>
              <label className="flex items-center justify-between text-sm font-bold text-ink-soft">
                تسطير الجدول
                <input type="checkbox" checked={Boolean(draft.table_striped)} onChange={(event) => patch('table_striped', event.target.checked)} />
              </label>
            </div>
          </div>
        </div>
        <button type="submit" disabled={updateMutation.isPending} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-action-primary px-5 text-sm font-bold text-ink-inverse transition-colors hover:bg-action-primary-hover disabled:opacity-60">
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ التصميم
        </button>
      </form>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-extrabold text-ink">
          <Paintbrush className="h-5 w-5 text-action-primary" />
          معاينة مباشرة
        </h2>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <InvoicePreview invoice={sampleInvoice} settings={draft} livePreview />
          </div>
        </div>
      </section>
    </div>
  )
}

export default function NurseryInvoicesPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('invoices')
  const [filter, setFilter] = useState<FilterType>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewInvoiceId, setViewInvoiceId] = useState<number | null>(null)
  const { data, isLoading, isError, error } = useNurseryInvoices(filter)
  const payload = data?.data

  return (
    <main className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">إدارة الفواتير</h1>
          <p className="mt-1 text-sm font-semibold text-ink-muted">فواتير المشتل المرتبطة بعمليات البيع والشراء داخل الأحواض.</p>
        </div>
        {activeTab === 'invoices' && payload ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action-primary px-5 text-sm font-extrabold text-ink-inverse transition-colors hover:bg-action-primary-hover"
          >
            <FilePlus2 className="h-4 w-4" />
            إضافة فاتورة جديدة
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 border-b border-line pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-extrabold transition-colors ${activeTab === 'invoices' ? 'bg-action-primary text-ink-inverse' : 'bg-surface text-ink-soft hover:bg-surface-muted'}`}
        >
          <FileText className="h-4 w-4" />
          الفواتير
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('design')}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-extrabold transition-colors ${activeTab === 'design' ? 'bg-action-primary text-ink-inverse' : 'bg-surface text-ink-soft hover:bg-surface-muted'}`}
        >
          <Paintbrush className="h-4 w-4" />
          تصميم الفاتورة
        </button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-line bg-surface text-ink-muted">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : isError || !payload ? (
        <div className="rounded-2xl border border-danger-soft bg-danger-soft p-5 text-sm font-bold text-danger">
          {errorMessage(error)}
        </div>
      ) : activeTab === 'invoices' ? (
        <>
          <SummaryStrip data={payload} />
          <section className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-4 flex flex-wrap gap-3">
              <FilterButton value="all" active={filter} onClick={setFilter}>الكل</FilterButton>
              <FilterButton value="sale" active={filter} onClick={setFilter}>بيع</FilterButton>
              <FilterButton value="purchase" active={filter} onClick={setFilter}>شراء</FilterButton>
            </div>
            <InvoiceTable invoices={payload.invoices} onView={setViewInvoiceId} />
          </section>
        </>
      ) : (
        <DesignTab settings={payload.settings} />
      )}

      {payload ? <InvoiceDialog open={createOpen} data={payload} onClose={() => setCreateOpen(false)} /> : null}
      <ViewInvoiceDialog invoiceId={viewInvoiceId} onClose={() => setViewInvoiceId(null)} />
    </main>
  )
}
