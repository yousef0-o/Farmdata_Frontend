'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ChevronLeft,
  ClipboardCheck,
  Droplets,
  FlaskConical,
  History,
  Info,
  Layers3,
  ListOrdered,
  Loader2,
  MoveRight,
  PlusCircle,
  RefreshCw,
  Route,
  Settings,
  ShoppingCart,
  Skull,
  Sprout,
  Trash2,
  Trees,
  Truck,
  X,
  Zap,
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
import { nurseryManagementApi } from '@/lib/api/nurseryManagement'
import type { ApiError } from '@/lib/types'
import type {
  NurseryBasinActivity,
  NurseryBasinActivityType,
  NurseryBasinDashboardPayload,
  NurseryBasinOperationOptions,
  NurseryBasinTreeOption,
} from '@/lib/types/nurseryManagement'

const activityMeta: Record<
  NurseryBasinActivityType,
  { icon: typeof Activity; tone: string }
> = {
  sale: { icon: ShoppingCart, tone: 'bg-warning-soft text-warning' },
  purchase: { icon: Truck, tone: 'bg-purple-50 text-purple-700' },
  procedure: { icon: ClipboardCheck, tone: 'bg-success-soft text-success' },
  irrigation: { icon: Droplets, tone: 'bg-info-soft text-info' },
  fertilization: { icon: FlaskConical, tone: 'bg-success-soft text-success' },
  mortality: { icon: Skull, tone: 'bg-danger-soft text-danger' },
  transfer: { icon: RefreshCw, tone: 'bg-indigo-50 text-indigo-700' },
  cycle: { icon: Sprout, tone: 'bg-pink-50 text-pink-700' },
  tree_add: { icon: PlusCircle, tone: 'bg-success-soft text-success' },
  basin_transfer: { icon: MoveRight, tone: 'bg-info-soft text-info' },
}

type OperationAction = {
  label: string
  icon: typeof Activity
  tone?: 'green' | 'danger' | 'blue'
  href?: (id: number) => string
  invoiceType?: 'sale' | 'purchase'
  operation?: OperationKey
}

const operationActions: OperationAction[] = [
  { label: 'إضافة شجر', icon: PlusCircle, operation: 'trees' },
  { label: 'عرض الخطوط', icon: ListOrdered, href: (id: number) => `/nursery/lines?basin_id=${id}` },
  { label: 'إضافة إجراء', icon: ClipboardCheck, operation: 'procedure' },
  { label: 'تنظيف الحوض', icon: Trees, tone: 'green', operation: 'procedure' },
  { label: 'تسجيل ري', icon: Droplets, operation: 'irrigation' },
  { label: 'تسجيل تسميد', icon: FlaskConical, operation: 'fertilization' },
  { label: 'تسجيل موت', icon: Skull, tone: 'danger', operation: 'mortality' },
  { label: 'نقل مركن', icon: RefreshCw, operation: 'pot-transfer' },
  { label: 'نقل لحوض آخر', icon: MoveRight, tone: 'blue', operation: 'basin-transfer' },
  { label: 'تسجيل بيع', icon: ShoppingCart, invoiceType: 'sale' as const },
  { label: 'تسجيل شراء', icon: Truck, invoiceType: 'purchase' as const },
  { label: 'دورة إنتاج', icon: Sprout, operation: 'cycle' },
]

const fieldInputClass =
  'min-h-11 w-full rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm font-semibold text-ink outline-none transition-[border-color,background-color,box-shadow] duration-200 focus:border-action-primary focus:bg-surface focus:ring-2 focus:ring-action-primary/20'

type InvoiceLine = {
  id: number
  treeId: string
  name: string
  basinId: string
  qty: number
  price: number
}

type OperationKey =
  | 'trees'
  | 'procedure'
  | 'irrigation'
  | 'fertilization'
  | 'mortality'
  | 'pot-transfer'
  | 'basin-transfer'
  | 'cycle'

type DialogState =
  | { kind: 'operation'; operation: OperationKey; title: string }
  | { kind: 'invoice'; type: 'sale' | 'purchase' }
  | null

function formatNumber(value: number | string | null | undefined, digits = 0) {
  return new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value ?? 0))
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function invoiceNumber() {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
  return `INV-${stamp}`
}

function formatDateRange(activity: NurseryBasinActivity) {
  if (!activity.date) return '-'
  if (activity.end_date && activity.end_date !== activity.date) {
    return `${activity.date} ← ${activity.end_date}`
  }
  return activity.date
}

function timeLabel(value: string | null) {
  if (!value) return ''
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return ''
  const diff = Math.max(0, Date.now() - time)
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `منذ ${formatNumber(days)} يوم`
  const hours = Math.floor(diff / 3600000)
  if (hours > 0) return `منذ ${formatNumber(hours)} ساعة`
  return 'اليوم'
}

function Card({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string
  icon: typeof Info
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center gap-2 text-base font-extrabold text-ink">
        <Icon className="h-5 w-5 text-action-primary" />
        {title}
      </div>
      {children}
    </section>
  )
}

function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode; danger?: boolean; accent?: string }>
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-line bg-surface-subtle px-4 py-3 text-center"
        >
          <div className="text-xs font-bold text-ink-muted">{item.label}</div>
          <div
            className={`mt-1 text-base font-extrabold ${
              item.danger ? 'text-danger' : item.accent ?? 'text-ink'
            }`}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function OperationButton({
  action,
  basinId,
  onInvoice,
  onOperation,
}: {
  action: OperationAction
  basinId: number
  onInvoice: (type: 'sale' | 'purchase') => void
  onOperation: (operation: OperationKey, title: string) => void
}) {
  const Icon = action.icon
  const tone =
    action.tone === 'danger'
      ? 'text-danger hover:border-danger'
      : action.tone === 'green'
        ? 'text-success hover:border-success'
        : action.tone === 'blue'
          ? 'text-info hover:border-info'
          : 'text-action-primary hover:border-action-primary'

  const className = `flex min-h-[108px] flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-5 text-center text-sm font-extrabold text-ink shadow-sm outline-none transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-4 focus-visible:ring-action-primary/15 active:scale-[0.98] ${tone}`

  const content = (
    <>
      <Icon className="h-6 w-6" />
      <span>{action.label}</span>
    </>
  )

  if (action.href) {
    return (
      <Link href={action.href(basinId)} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (action.invoiceType) onInvoice(action.invoiceType)
        if (action.operation) onOperation(action.operation, action.label)
      }}
    >
      {content}
    </button>
  )
}

function ActivityRow({ activity, compact = false }: { activity: NurseryBasinActivity; compact?: boolean }) {
  const meta = activityMeta[activity.type]
  const Icon = meta.icon

  return (
    <div className={`flex items-center gap-3 border-b border-line last:border-b-0 ${compact ? 'py-3' : 'py-4'}`}>
      <span className={`flex shrink-0 items-center justify-center rounded-full ${compact ? 'h-8 w-8' : 'h-10 w-10'} ${meta.tone}`}>
        <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold text-ink">{compact ? activity.detail : activity.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-muted">
          <span>{formatDateRange(activity)}</span>
          {activity.created_at ? <span>({timeLabel(activity.created_at)})</span> : null}
        </div>
      </div>
    </div>
  )
}

function InvoiceDialog({
  open,
  type,
  treeOptions,
  options,
  onClose,
  onSave,
  pending,
}: {
  open: boolean
  type: 'sale' | 'purchase'
  treeOptions: NurseryBasinTreeOption[]
  options: NurseryBasinOperationOptions
  onClose: () => void
  onSave: (payload: unknown) => void
  pending: boolean
}) {
  const [lines, setLines] = useState<InvoiceLine[]>([
    { id: 1, treeId: '', name: '', basinId: '', qty: 1, price: 0 },
  ])

  const subtotal = lines.reduce((total, line) => total + Number(line.qty || 0) * Number(line.price || 0), 0)
  const vat = subtotal * 0.15
  const total = subtotal + vat

  function addLine() {
    setLines((current) => [
      ...current,
      { id: Date.now(), treeId: '', name: '', basinId: '', qty: 1, price: 0 },
    ])
  }

  function updateLine(id: number, patch: Partial<InvoiceLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }

  return (
    <AppDialog open={open} onClose={onClose} labelledBy="invoice-dialog-title" panelClassName="max-w-4xl">
      <form
        className="max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          onSave({
            type,
            invoice_number: String(form.get('invoice_number') || invoiceNumber()),
            contact_id: form.get('contact_id') ? Number(form.get('contact_id')) : null,
            status: form.get('status') || 'unpaid',
            invoice_date: form.get('invoice_date'),
            items: lines
              .filter((line) => line.treeId)
              .map((line) => ({
                tree_id: Number(line.treeId),
                name: line.name,
                qty: Number(line.qty),
                price: Number(line.price),
              })),
          })
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="invoice-dialog-title" className="text-xl font-extrabold text-ink">
            {type === 'sale' ? 'إضافة فاتورة بيع' : 'إضافة فاتورة شراء'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="نوع الفاتورة">
            <select className={fieldInputClass} value={type} onChange={() => undefined}>
              <option value="sale">فاتورة بيع</option>
              <option value="purchase">فاتورة شراء</option>
            </select>
          </Field>
          <Field label="رقم الفاتورة">
            <input name="invoice_number" className={fieldInputClass} defaultValue={invoiceNumber()} required />
          </Field>
          <Field label="العميل / المورد">
            <select name="contact_id" className={fieldInputClass}>
              <option value="">اختر...</option>
              {options.contacts
                .filter((contact) =>
                  type === 'sale'
                    ? contact.type === 'customer' || contact.type === 'both'
                    : contact.type === 'supplier' || contact.type === 'both'
                )
                .map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="التاريخ">
            <input name="invoice_date" className={fieldInputClass} type="date" defaultValue={today()} required />
          </Field>
          <Field label="الحالة">
            <select name="status" className={fieldInputClass} defaultValue="unpaid">
              <option value="unpaid">غير مدفوعة</option>
              <option value="paid">مدفوعة</option>
              <option value="draft">مسودة</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:hidden">
          {lines.map((line) => (
            <article key={line.id} className="rounded-xl border border-line bg-surface p-4 shadow-sm">
              <div className="space-y-3">
                <Field label="الصنف">
                  <select
                    className={fieldInputClass}
                    value={line.treeId}
                    onChange={(event) => {
                      const selected = treeOptions.find((item) => String(item.tree_id) === event.target.value)
                      updateLine(line.id, {
                        treeId: event.target.value,
                        name: selected?.tree_name ?? '',
                        basinId: selected ? String(selected.basin_id) : '',
                      })
                    }}
                  >
                    <option value="">اختر الصنف...</option>
                    {treeOptions.map((tree) => (
                      <option key={tree.tree_id} value={tree.tree_id}>
                        {tree.tree_name} - متوفر: {formatNumber(tree.quantity)}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="الكمية">
                    <input className={fieldInputClass} type="number" min={1} value={line.qty} onChange={(event) => updateLine(line.id, { qty: Number(event.target.value) })} />
                  </Field>
                  <Field label="سعر الوحدة">
                    <input className={fieldInputClass} type="number" min={0} step="0.01" value={line.price} onChange={(event) => updateLine(line.id, { price: Number(event.target.value) })} />
                  </Field>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-surface-subtle px-3 py-2 text-sm">
                  <span className="text-xs font-bold text-ink-muted">الإجمالي</span>
                  <span className="font-mono font-bold text-ink">{(Number(line.qty || 0) * Number(line.price || 0)).toFixed(2)}</span>
                </div>

                <button type="button" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-danger-soft px-4 py-2 text-sm font-bold text-danger" onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}>
                  <Trash2 className="h-4 w-4" />
                  حذف السطر
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 hidden overflow-x-auto rounded-xl border border-line lg:block">
          <table className="min-w-[720px] w-full text-right text-sm">
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
                      className={fieldInputClass}
                      value={line.treeId}
                      onChange={(event) => {
                        const selected = treeOptions.find((item) => String(item.tree_id) === event.target.value)
                        updateLine(line.id, {
                          treeId: event.target.value,
                          name: selected?.tree_name ?? '',
                          basinId: selected ? String(selected.basin_id) : '',
                        })
                      }}
                    >
                      <option value="">اختر الصنف...</option>
                      {treeOptions.map((tree) => (
                        <option key={tree.tree_id} value={tree.tree_id}>
                          {tree.tree_name} - متوفر: {formatNumber(tree.quantity)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <input className={fieldInputClass} type="number" min={1} value={line.qty} onChange={(event) => updateLine(line.id, { qty: Number(event.target.value) })} />
                  </td>
                  <td className="px-3 py-3">
                    <input className={fieldInputClass} type="number" min={0} step="0.01" value={line.price} onChange={(event) => updateLine(line.id, { price: Number(event.target.value) })} />
                  </td>
                  <td className="px-3 py-3">
                    <input className={`${fieldInputClass} bg-surface-subtle`} readOnly value={(Number(line.qty || 0) * Number(line.price || 0)).toFixed(2)} />
                  </td>
                  <td className="px-3 py-3">
                    <button type="button" className="rounded-lg p-2 text-danger transition-colors hover:bg-danger-soft" onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" onClick={addLine} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-muted px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-subtle">
          <PlusCircle className="h-4 w-4" />
          إضافة سطر
        </button>

        <div className="mt-4 rounded-xl bg-surface-subtle p-4 text-left text-sm font-semibold text-ink-soft">
          <div>المجموع الفرعي: <span className="font-mono text-ink">{subtotal.toFixed(2)}</span> <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" /></div>
          <div>ضريبة القيمة المضافة (15%): <span className="font-mono text-ink">{vat.toFixed(2)}</span> <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" /></div>
          <div className="mt-1 text-lg font-extrabold text-ink">الإجمالي: <span className="font-mono">{total.toFixed(2)}</span> <SaudiRiyalIcon size={16} className="text-emerald-700 inline-block align-middle ml-1" /></div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-line bg-surface px-5 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-muted">إلغاء</button>
          <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-action-primary px-5 text-sm font-bold text-ink-inverse transition-colors hover:bg-action-primary-hover disabled:opacity-60">
            {pending ? 'جار الحفظ...' : 'حفظ الفاتورة'}
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

function OperationDialog({
  state,
  options,
  onClose,
  onSave,
  pending,
}: {
  state: Extract<DialogState, { kind: 'operation' }> | null
  options: NurseryBasinOperationOptions
  onClose: () => void
  onSave: (operation: OperationKey, payload: unknown) => void
  pending: boolean
}) {
  const operation = state?.operation

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!operation) return
    const form = new FormData(event.currentTarget)
    const value = (key: string) => form.get(key)
    const checked = (key: string) => form.getAll(key).map((item) => String(item))

    if (operation === 'trees') {
      onSave(operation, {
        lines: [
          {
            line_number: Number(value('line_number')),
            tree_type_id: Number(value('tree_type_id')),
            quantity: Number(value('quantity')),
            pot_size: value('pot_size') || null,
            height: Number(value('height') || 0),
            thickness: Number(value('thickness') || 0),
            birth_date: value('birth_date') || null,
          },
        ],
      })
    } else if (operation === 'procedure') {
      const actions = checked('actions').map((type) => ({
        type,
        detail: String(value(`${type}_detail`) || procedureDefaultDetail(type)),
      }))
      onSave(operation, {
        procedure_date: value('procedure_date'),
        end_date: value('end_date') || null,
        scope: value('scope'),
        selected_lines: checked('selected_lines').map(Number),
        actions,
      })
    } else if (operation === 'irrigation') {
      onSave(operation, {
        irrigation_date: value('irrigation_date'),
        irrigation_date_to: value('irrigation_date_to') || null,
        period: value('period'),
        start_time: value('start_time') || null,
        end_time: value('end_time') || null,
      })
    } else if (operation === 'fertilization') {
      onSave(operation, {
        fertilization_date: value('fertilization_date'),
        fertilizer_id: Number(value('fertilizer_id')),
        quantity: Number(value('quantity')),
      })
    } else if (operation === 'mortality') {
      onSave(operation, {
        line_number: Number(value('line_number')),
        mortality_date: value('mortality_date'),
        quantity: Number(value('quantity')),
      })
    } else if (operation === 'pot-transfer') {
      onSave(operation, {
        transfer_date: value('transfer_date'),
        source_line: Number(value('source_line')),
        quantity: Number(value('quantity')),
        damaged_pots: Number(value('damaged_pots') || 0),
        new_pot_size: value('new_pot_size'),
        tree_height: Number(value('tree_height') || 0),
        tree_thickness: Number(value('tree_thickness') || 0),
        is_moved: value('is_moved') === 'yes',
        transfer_type: value('transfer_type'),
      })
    } else if (operation === 'basin-transfer') {
      onSave(operation, {
        transfer_date: value('transfer_date'),
        source_line: Number(value('source_line')),
        quantity: Number(value('quantity')),
        target_basin_id: Number(value('target_basin_id')),
        merge_mode: value('merge_mode'),
        target_line_number: value('target_line_number') ? Number(value('target_line_number')) : null,
        notes: value('notes') || null,
      })
    } else if (operation === 'cycle') {
      onSave(operation, {
        name: value('name'),
        tree_type_id: Number(value('tree_type_id')),
        propagation_type: value('propagation_type') || null,
        source: value('source') || null,
        count: Number(value('count')),
        pot_size: value('pot_size') || null,
        start_date: value('start_date'),
        end_date: value('end_date') || null,
      })
    }
  }

  return (
    <AppDialog open={Boolean(state)} onClose={onClose} labelledBy="operation-dialog-title" panelClassName="max-w-3xl">
      <form onSubmit={submit} className="max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="operation-dialog-title" className="text-xl font-extrabold text-ink">
            {state?.title}
          </h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {operation === 'trees' ? <TreesFields options={options} /> : null}
          {operation === 'procedure' ? <ProcedureFields options={options} /> : null}
          {operation === 'irrigation' ? <IrrigationFields /> : null}
          {operation === 'fertilization' ? <FertilizationFields options={options} /> : null}
          {operation === 'mortality' ? <MortalityFields options={options} /> : null}
          {operation === 'pot-transfer' ? <PotTransferFields options={options} /> : null}
          {operation === 'basin-transfer' ? <BasinTransferFields options={options} /> : null}
          {operation === 'cycle' ? <CycleFields options={options} /> : null}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-line bg-surface px-5 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-muted">إلغاء</button>
          <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-action-primary px-5 text-sm font-bold text-ink-inverse transition-colors hover:bg-action-primary-hover disabled:opacity-60">
            {pending ? 'جار الحفظ...' : 'حفظ العملية'}
          </button>
        </div>
      </form>
    </AppDialog>
  )
}

function LineSelect({ options, name = 'line_number' }: { options: NurseryBasinOperationOptions; name?: string }) {
  return (
    <Field label="اختر الخط">
      <select name={name} className={fieldInputClass} required>
        <option value="">اختر الخط...</option>
        {options.lines.map((line) => (
          <option key={line.id} value={line.line_number}>
            خط {line.line_number} - {line.tree_name} ({formatNumber(line.quantity)})
          </option>
        ))}
      </select>
    </Field>
  )
}

function TreesFields({ options }: { options: NurseryBasinOperationOptions }) {
  return (
    <>
      <Field label="رقم الخط"><input name="line_number" className={fieldInputClass} type="number" min={1} required /></Field>
      <Field label="نوع الشجرة">
        <select name="tree_type_id" className={fieldInputClass} required>
          <option value="">اختر النوع</option>
          {options.varieties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </Field>
      <Field label="الكمية"><input name="quantity" className={fieldInputClass} type="number" min={1} required /></Field>
      <Field label="مقاس المركن">
        <select name="pot_size" className={fieldInputClass}>
          <option value="">بدون</option>
          {options.pot_sizes.map((item) => <option key={item.id} value={item.name}>{item.name} - متوفر: {formatNumber(item.quantity)}</option>)}
        </select>
      </Field>
      <Field label="الارتفاع"><input name="height" className={fieldInputClass} type="number" min={0} step="0.01" /></Field>
      <Field label="السماكة"><input name="thickness" className={fieldInputClass} type="number" min={0} step="0.01" /></Field>
      <Field label="تاريخ الميلاد"><input name="birth_date" className={fieldInputClass} type="date" /></Field>
    </>
  )
}

function ProcedureFields({ options }: { options: NurseryBasinOperationOptions }) {
  return (
    <>
      <Field label="تاريخ الإجراء"><input name="procedure_date" className={fieldInputClass} type="date" defaultValue={today()} required /></Field>
      <Field label="تاريخ الانتهاء"><input name="end_date" className={fieldInputClass} type="date" /></Field>
      <Field label="النطاق">
        <select name="scope" className={fieldInputClass} defaultValue="basin">
          <option value="basin">الحوض بالكامل</option>
          <option value="lines">خطوط محددة</option>
        </select>
      </Field>
      <div className="md:col-span-2 rounded-xl border border-line bg-surface-subtle p-4">
        <div className="mb-3 text-xs font-bold text-ink-soft">الإجراءات</div>
        {['pruning', 'moving', 'hardening', 'cleaning'].map((type) => (
          <label key={type} className="mb-3 grid gap-2 md:grid-cols-[140px_1fr]">
            <span className="flex items-center gap-2 text-sm font-bold text-ink"><input type="checkbox" name="actions" value={type} /> {procedureLabel(type)}</span>
            <input name={`${type}_detail`} className={fieldInputClass} defaultValue={procedureDefaultDetail(type)} />
          </label>
        ))}
      </div>
      <div className="md:col-span-2 rounded-xl border border-line bg-surface-subtle p-4">
        <div className="mb-3 text-xs font-bold text-ink-soft">الخطوط المتأثرة</div>
        <div className="grid gap-2 md:grid-cols-2">
          {options.lines.map((line) => (
            <label key={line.id} className="flex items-center gap-2 text-sm font-bold text-ink">
              <input type="checkbox" name="selected_lines" value={line.line_number} />
              خط {line.line_number} - {line.tree_name}
            </label>
          ))}
        </div>
      </div>
    </>
  )
}

function IrrigationFields() {
  return (
    <>
      <Field label="تاريخ الري (من)"><input name="irrigation_date" className={fieldInputClass} type="date" defaultValue={today()} required /></Field>
      <Field label="تاريخ الري (إلى)"><input name="irrigation_date_to" className={fieldInputClass} type="date" /></Field>
      <Field label="فترة الري"><select name="period" className={fieldInputClass} defaultValue="morning"><option value="morning">صبحية</option><option value="evening">مسائية</option></select></Field>
      <Field label="من الساعة"><input name="start_time" className={fieldInputClass} type="time" defaultValue="06:00" /></Field>
      <Field label="إلى الساعة"><input name="end_time" className={fieldInputClass} type="time" defaultValue="08:00" /></Field>
    </>
  )
}

function FertilizationFields({ options }: { options: NurseryBasinOperationOptions }) {
  return (
    <>
      <Field label="تاريخ التسميد"><input name="fertilization_date" className={fieldInputClass} type="date" defaultValue={today()} required /></Field>
      <Field label="نوع السماد">
        <select name="fertilizer_id" className={fieldInputClass} required>
          <option value="">اختر نوع السماد</option>
          {options.fertilizers.map((item) => <option key={item.id} value={item.id}>{item.name} - متوفر: {formatNumber(item.quantity)} {item.unit}</option>)}
        </select>
      </Field>
      <Field label="كمية التسميد"><input name="quantity" className={fieldInputClass} type="number" min="0.01" step="0.01" required /></Field>
    </>
  )
}

function MortalityFields({ options }: { options: NurseryBasinOperationOptions }) {
  return (
    <>
      <LineSelect options={options} />
      <Field label="تاريخ التسجيل"><input name="mortality_date" className={fieldInputClass} type="date" defaultValue={today()} required /></Field>
      <Field label="الكمية"><input name="quantity" className={fieldInputClass} type="number" min={1} required /></Field>
    </>
  )
}

function PotTransferFields({ options }: { options: NurseryBasinOperationOptions }) {
  return (
    <>
      <LineSelect options={options} name="source_line" />
      <Field label="تاريخ النقل"><input name="transfer_date" className={fieldInputClass} type="date" defaultValue={today()} required /></Field>
      <Field label="الكمية"><input name="quantity" className={fieldInputClass} type="number" min={1} required /></Field>
      <Field label="مراكن تالفة"><input name="damaged_pots" className={fieldInputClass} type="number" min={0} defaultValue={0} /></Field>
      <Field label="المركن الجديد"><select name="new_pot_size" className={fieldInputClass} required><option value="">اختر المركن</option>{options.pot_sizes.map((item) => <option key={item.id} value={item.name}>{item.name} - متوفر: {formatNumber(item.quantity)}</option>)}</select></Field>
      <Field label="طريقة النقل"><select name="transfer_type" className={fieldInputClass} defaultValue="merge"><option value="merge">دمج مع خط مشابه</option><option value="new_line">إنشاء خط جديد</option></select></Field>
      <Field label="الارتفاع الجديد"><input name="tree_height" className={fieldInputClass} type="number" min={0} step="0.01" /></Field>
      <Field label="السماكة الجديدة"><input name="tree_thickness" className={fieldInputClass} type="number" min={0} step="0.01" /></Field>
      <Field label="تم تحريك الشتلات؟"><select name="is_moved" className={fieldInputClass} defaultValue="no"><option value="no">لا</option><option value="yes">نعم</option></select></Field>
    </>
  )
}

function BasinTransferFields({ options }: { options: NurseryBasinOperationOptions }) {
  return (
    <>
      <LineSelect options={options} name="source_line" />
      <Field label="تاريخ النقل"><input name="transfer_date" className={fieldInputClass} type="date" defaultValue={today()} required /></Field>
      <Field label="الكمية"><input name="quantity" className={fieldInputClass} type="number" min={1} required /></Field>
      <Field label="الحوض المستهدف"><select name="target_basin_id" className={fieldInputClass} required><option value="">اختر الحوض</option>{options.basins.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
      <Field label="طريقة الدمج"><select name="merge_mode" className={fieldInputClass} defaultValue="merge"><option value="merge">دمج تلقائي</option><option value="new_line">خط جديد</option></select></Field>
      <Field label="رقم خط مستهدف اختياري"><input name="target_line_number" className={fieldInputClass} type="number" min={1} /></Field>
      <label className="block md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-ink-soft">ملاحظات</span><textarea name="notes" className={`${fieldInputClass} min-h-24`} /></label>
    </>
  )
}

function CycleFields({ options }: { options: NurseryBasinOperationOptions }) {
  return (
    <>
      <Field label="اسم دورة الإنتاج"><input name="name" className={fieldInputClass} placeholder="مثال: دورة الربيع 2025" required /></Field>
      <Field label="نوع الشجرة">
        <select name="tree_type_id" className={fieldInputClass} required>
          <option value="">اختر نوع الشجرة...</option>
          {options.varieties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </Field>
      <Field label="نوع التكاثر">
        <select name="propagation_type" className={fieldInputClass} defaultValue="seeds">
          <option value="seeds">بذور</option>
          <option value="cuttings">عقل</option>
          <option value="grafting">تطعيم</option>
          <option value="layering">ترقيد</option>
        </select>
      </Field>
      <Field label="مصدر العقل أو البذور"><input name="source" className={fieldInputClass} placeholder="مثال: مشتل خارجي، إنتاج ذاتي" /></Field>
      <Field label="عدد البذور أو العقل"><input name="count" className={fieldInputClass} type="number" min={1} required /></Field>
      <Field label="نوع المركن">
        <select name="pot_size" className={fieldInputClass}>
          <option value="">اختر مقاس المركن...</option>
          {options.pot_sizes.map((item) => <option key={item.id} value={item.name}>{item.name} - متوفر: {formatNumber(item.quantity)}</option>)}
        </select>
      </Field>
      <Field label="تاريخ البداية"><input name="start_date" className={fieldInputClass} type="date" defaultValue={today()} required /></Field>
      <Field label="تاريخ النهاية المتوقع"><input name="end_date" className={fieldInputClass} type="date" /></Field>
    </>
  )
}

function procedureLabel(type: string) {
  return ({ pruning: 'تقليم', moving: 'نقل', hardening: 'تصليب', cleaning: 'تنظيف' } as Record<string, string>)[type] ?? type
}

function procedureDefaultDetail(type: string) {
  return ({ pruning: 'تقليم جوانب', moving: 'تم التحريك', hardening: 'تصليب و تربيط', cleaning: 'تنظيف الحوض' } as Record<string, string>)[type] ?? ''
}

export default function BasinManagementPage() {
  const params = useParams<{ id: string }>()
  const basinId = Number(params.id)
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const query = useQuery({
    queryKey: ['nursery-basin-dashboard', basinId],
    queryFn: () => nurseryManagementApi.basinDashboard(basinId),
    enabled: Number.isFinite(basinId) && basinId > 0,
  })

  const operationMutation = useMutation({
    mutationFn: ({ operation, payload }: { operation: string; payload: unknown }) =>
      nurseryManagementApi.createBasinOperation(basinId, operation, payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(['nursery-basin-dashboard', basinId], response)
      await queryClient.invalidateQueries({ queryKey: ['nursery-basin-dashboard', basinId] })
      setDialog(null)
      setFeedback({ type: 'success', message: 'تم حفظ العملية وتحديث بيانات الحوض.' })
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError
      const firstError = apiError.errors ? Object.values(apiError.errors)[0] : null
      setFeedback({
        type: 'error',
        message: Array.isArray(firstError) ? firstError[0] : apiError.message || 'فشل حفظ العملية.',
      })
    },
  })

  const payload: NurseryBasinDashboardPayload | undefined = query.data?.data
  const operationStats = payload?.operations_stats
  const breadcrumbItems = useMemo(() => {
    if (!payload) return []
    return [
      { label: 'الرئيسية', href: '/nursery/manage' },
      { label: payload.breadcrumbs.nursery.name },
      { label: payload.breadcrumbs.location.name },
      { label: payload.breadcrumbs.section.name },
      { label: payload.breadcrumbs.basin.name, current: true },
    ]
  }, [payload])

  if (query.isLoading) {
    return (
      <main className="flex min-h-[55vh] items-center justify-center bg-background text-ink" dir="rtl">
        <Loader2 className="h-7 w-7 animate-spin text-action-primary" />
      </main>
    )
  }

  if (query.isError || !payload) {
    return (
      <main className="bg-background p-4 text-ink sm:p-6 lg:p-8" dir="rtl">
        <section className="rounded-2xl border border-line bg-surface p-10 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-danger" />
          <h1 className="text-xl font-extrabold text-ink">لم يتم العثور على الحوض</h1>
          <Link href="/nursery/manage" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface-muted px-5 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-subtle">
            عودة للرئيسية
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="bg-background px-4 py-5 text-ink sm:px-6 lg:px-8" dir="rtl">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold text-ink-muted">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <ChevronLeft className="h-3.5 w-3.5" /> : null}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-action-primary">
                {item.label}
              </Link>
            ) : (
              <span className={item.current ? 'text-action-primary' : ''}>{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-ink">إدارة الحوض: {payload.basin.name}</h1>
        <Link href={`/nursery/manage?section_id=${payload.basin.section_id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-bold text-ink-soft shadow-sm transition-[background-color,transform] duration-200 hover:bg-surface-muted active:scale-[0.98]">
          <ArrowRight className="h-4 w-4" />
          العودة للقسم
        </Link>
      </header>
      {feedback ? (
        <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-bold ${feedback.type === 'success' ? 'border-success-soft bg-success-soft text-success' : 'border-danger-soft bg-danger-soft text-danger'}`}>
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-6">
          <Card title="تفاصيل الحوض" icon={Info}>
            <InfoGrid
              items={[
                { label: 'السعة الكلية', value: `${formatNumber(payload.basin.capacity)} شجرة` },
                { label: 'النوع', value: payload.basin.type || '-' },
                { label: 'المحتوى', value: payload.basin.content || '-' },
                { label: 'طريقة الري', value: payload.basin.irrigation_method || '-' },
              ]}
            />
          </Card>

          <Card title="إحصائيات الحوض" icon={BarChart3}>
            <InfoGrid
              items={[
                { label: 'إجمالي الأشجار', value: formatNumber(payload.stats.total_trees) },
                { label: 'عدد الخطوط', value: formatNumber(payload.stats.line_count) },
                { label: 'أنواع الأشجار', value: formatNumber(payload.stats.variety_count) },
              ]}
            />
          </Card>

          <Card title="إحصائيات الهيكل التنظيمي" icon={Route}>
            <InfoGrid
              items={[
                { label: `إجمالي القسم (${payload.breadcrumbs.section.name})`, value: formatNumber(payload.stats.section_total), accent: 'text-purple-700' },
                { label: `إجمالي الموقع (${payload.breadcrumbs.location.name})`, value: formatNumber(payload.stats.location_total), accent: 'text-indigo-700' },
                { label: `إجمالي المشتل (${payload.breadcrumbs.nursery.name})`, value: formatNumber(payload.stats.nursery_total), accent: 'text-info' },
              ]}
            />
          </Card>

          <Card title="إحصائيات العمليات" icon={ClipboardCheck}>
            <InfoGrid
              items={[
                { label: 'عمليات التقليم', value: formatNumber(operationStats?.pruning) },
                { label: 'عمليات النقل', value: formatNumber(operationStats?.moving) },
                { label: 'عمليات التصليب', value: formatNumber(operationStats?.hardening) },
                { label: 'عمليات الري', value: formatNumber(operationStats?.irrigation) },
                { label: 'عمليات التسميد', value: formatNumber(operationStats?.fertilization) },
                { label: 'إجمالي الموت', value: formatNumber(operationStats?.mortality), danger: true },
              ]}
            />
          </Card>

          <Card title="إجراءات سريعة" icon={Zap}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
              <OperationButton action={operationActions[4]} basinId={basinId} onInvoice={(type) => setDialog({ kind: 'invoice', type })} onOperation={(operation, title) => setDialog({ kind: 'operation', operation, title })} />
              <OperationButton action={operationActions[5]} basinId={basinId} onInvoice={(type) => setDialog({ kind: 'invoice', type })} onOperation={(operation, title) => setDialog({ kind: 'operation', operation, title })} />
            </div>
          </Card>

          {payload.variety_stats.length > 0 ? (
            <Card title="إحصائيات الأصناف حسب المقاس" icon={Layers3}>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {payload.variety_stats.map((variety) => (
                  <article key={variety.variety_id} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-subtle p-4">
                      <h3 className="text-base font-extrabold text-ink">{variety.variety_name}</h3>
                      <span className="rounded-full bg-action-primary px-3 py-1 text-xs font-bold text-ink-inverse">
                        {formatNumber(variety.total_quantity)} شجرة
                      </span>
                    </div>
                    <div className="p-4">
                      {variety.sizes.map((size) => (
                        <div key={`${variety.variety_id}-${size.pot_size}`} className="flex items-center justify-between gap-3 border-b border-dashed border-line py-3 last:border-b-0">
                          <div className="flex items-center gap-2 text-sm font-bold text-ink">
                            <Layers3 className="h-4 w-4 text-ink-muted" />
                            {size.pot_size || '-'}
                          </div>
                          <div className="text-left text-xs font-semibold text-ink-muted">
                            <span className="block font-mono text-base font-extrabold text-action-primary">{formatNumber(size.total_quantity)}</span>
                            {size.avg_height > 0 ? <span>ط: {formatNumber(size.avg_height, 1)}m</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          ) : null}

          <Card title="العمليات" icon={Settings}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
              {operationActions.map((action) => (
                <OperationButton
                  key={action.label}
                  action={action}
                  basinId={basinId}
                  onInvoice={(type) => setDialog({ kind: 'invoice', type })}
                  onOperation={(operation, title) => setDialog({ kind: 'operation', operation, title })}
                />
              ))}
            </div>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <Card title="آخر النشاطات" icon={History}>
            <div className="min-h-[120px]">
              {payload.recent_activities.length > 0 ? (
                payload.recent_activities.map((activity) => (
                  <ActivityRow key={`${activity.type}-${activity.id}`} activity={activity} />
                ))
              ) : (
                <div className="py-8 text-center text-sm font-semibold text-ink-muted">لا توجد نشاطات حديثة</div>
              )}
            </div>
            <div className="mt-4 border-t border-line pt-4 text-center">
              <Link href={`/nursery/manage/basins/${basinId}/activities`} className="inline-flex items-center gap-1 text-sm font-extrabold text-action-primary">
                عرض الكل
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        </aside>
      </div>

      <section id="activity-groups" className="mt-10">
        <h2 className="mb-5 text-xl font-extrabold text-ink">سجلات النشاطات حسب النوع</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
          {payload.activity_groups.map((group) => (
            <Card
              key={group.type}
              title={group.title}
              icon={activityMeta[group.type].icon}
              className="mb-0"
            >
              {group.records.length > 0 ? (
                group.records.map((record) => (
                  <ActivityRow key={`${group.type}-${record.id}`} activity={record} compact />
                ))
              ) : (
                <div className="py-6 text-center text-sm font-semibold text-ink-muted">لا توجد سجلات</div>
              )}
            </Card>
          ))}
        </div>
      </section>

      <InvoiceDialog
        open={dialog?.kind === 'invoice'}
        type={dialog?.kind === 'invoice' ? dialog.type : 'sale'}
        treeOptions={payload.tree_options}
        options={payload.operation_options}
        onClose={() => setDialog(null)}
        pending={operationMutation.isPending}
        onSave={(payload) => operationMutation.mutate({ operation: 'invoice', payload })}
      />
      <OperationDialog
        state={dialog?.kind === 'operation' ? dialog : null}
        options={payload.operation_options}
        onClose={() => setDialog(null)}
        pending={operationMutation.isPending}
        onSave={(operation, payload) => operationMutation.mutate({ operation, payload })}
      />
    </main>
  )
}
