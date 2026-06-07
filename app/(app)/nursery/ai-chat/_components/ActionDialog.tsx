'use client'

import React from 'react'
import {
  Sparkles,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import type { ActiveAction, KnownActionType } from '../_lib/types'

interface BasinOption { id: number; name: string }
interface FertilizerOption { id: number; name: string; quantity: number; unit: string }

const inputClass = 'min-h-11 w-full rounded-xl border border-line bg-surface-muted/50 px-3 py-2 text-sm font-semibold text-ink outline-none transition-all focus:border-action-primary focus:bg-surface focus:ring-2 focus:ring-action-primary/15'

export default function ActionDialog({
  activeAction,
  actionSubmitting,
  actionError,
  onCancel,
  onSubmit,
  // Irrigation fields
  irrigationDate, setIrrigationDate,
  irrigationPeriod, setIrrigationPeriod,
  irrigationStartTime, setIrrigationStartTime,
  irrigationEndTime, setIrrigationEndTime,
  // Mortality fields
  mortalityLine, setMortalityLine,
  mortalityQuantity, setMortalityQuantity,
  mortalityDate, setMortalityDate,
  // Fertilization fields
  fertilizationDate, setFertilizationDate,
  fertilizerId, setFertilizerId,
  fertilizationQuantity, setFertilizationQuantity,
  fertilizers,
  // Transfer fields
  transferSuccessCount, setTransferSuccessCount,
  transferMarkRemainingFailed, setTransferMarkRemainingFailed,
  transferDate, setTransferDate,
  transferBasinId, setTransferBasinId,
  transferLineNumber, setTransferLineNumber,
  basins,
}: {
  activeAction: ActiveAction | null
  actionSubmitting: boolean
  actionError: string | null
  onCancel: () => void
  onSubmit: () => void
  irrigationDate: string; setIrrigationDate: (v: string) => void
  irrigationPeriod: 'morning' | 'evening'; setIrrigationPeriod: (v: 'morning' | 'evening') => void
  irrigationStartTime: string; setIrrigationStartTime: (v: string) => void
  irrigationEndTime: string; setIrrigationEndTime: (v: string) => void
  mortalityLine: number; setMortalityLine: (v: number) => void
  mortalityQuantity: number; setMortalityQuantity: (v: number) => void
  mortalityDate: string; setMortalityDate: (v: string) => void
  fertilizationDate: string; setFertilizationDate: (v: string) => void
  fertilizerId: number; setFertilizerId: (v: number) => void
  fertilizationQuantity: number; setFertilizationQuantity: (v: number) => void
  fertilizers: FertilizerOption[]
  transferSuccessCount: number; setTransferSuccessCount: (v: number) => void
  transferMarkRemainingFailed: boolean; setTransferMarkRemainingFailed: (v: boolean) => void
  transferDate: string; setTransferDate: (v: string) => void
  transferBasinId: number; setTransferBasinId: (v: number) => void
  transferLineNumber: number; setTransferLineNumber: (v: number) => void
  basins: BasinOption[]
}) {
  const actionLabels: Record<string, string> = {
    log_irrigation: 'تأكيد عملية الري',
    log_mortality: 'تأكيد تسجيل النفوق',
    log_fertilization: 'تأكيد عملية التسميد',
    transfer_cycle: 'تأكيد نقل الدورة',
  }

  return (
    <AppDialog
      open={activeAction !== null}
      onClose={onCancel}
      panelClassName="max-w-md bg-surface rounded-3xl overflow-hidden shadow-2xl ring-1 ring-line"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line pb-4 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-action-primary/10 text-action-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-ink">
              {activeAction ? (actionLabels[activeAction.action] || 'تأكيد العملية') : 'تأكيد العملية'}
            </h2>
            {activeAction?.human_summary && (
              <p className="text-xs text-ink-muted mt-0.5">{activeAction.human_summary}</p>
            )}
          </div>
        </div>

        {/* Error */}
        {actionError && (
          <div className="p-3 mb-4 rounded-xl bg-danger-soft border border-danger/20 flex items-start gap-2 text-xs font-bold text-danger">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Irrigation form */}
        {activeAction?.action === 'log_irrigation' && (
          <div className="space-y-4">
            <Field label="تاريخ عملية الري">
              <input type="date" value={irrigationDate} onChange={e => setIrrigationDate(e.target.value)} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="فترة الري">
                <select
                  value={irrigationPeriod}
                  onChange={e => setIrrigationPeriod(e.target.value === 'evening' ? 'evening' : 'morning')}
                  className={inputClass}
                >
                  <option value="morning">صباحية</option>
                  <option value="evening">مسائية</option>
                </select>
              </Field>
              <Field label="وقت البدء">
                <input type="time" value={irrigationStartTime} onChange={e => setIrrigationStartTime(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field label="وقت الانتهاء">
              <input type="time" value={irrigationEndTime} onChange={e => setIrrigationEndTime(e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}

        {/* Mortality form */}
        {activeAction?.action === 'log_mortality' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="رقم الخط">
                <input type="number" value={mortalityLine} onChange={e => setMortalityLine(Number(e.target.value))} className={inputClass} />
              </Field>
              <Field label="الكمية النافقة">
                <input type="number" value={mortalityQuantity} onChange={e => setMortalityQuantity(Number(e.target.value))} className={inputClass} />
              </Field>
            </div>
            <Field label="تاريخ النفوق">
              <input type="date" value={mortalityDate} onChange={e => setMortalityDate(e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}

        {/* Fertilization form */}
        {activeAction?.action === 'log_fertilization' && (
          <div className="space-y-4">
            <Field label="نوع السماد المستخدم">
              <select value={fertilizerId} onChange={e => setFertilizerId(Number(e.target.value))} className={inputClass}>
                <option value={0}>اختر سماد...</option>
                {fertilizers.map(f => (
                  <option key={f.id} value={f.id}>{f.name} (المتوفر: {f.quantity} {f.unit})</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الكمية لكل حوض">
                <input type="number" step="0.01" value={fertilizationQuantity} onChange={e => setFertilizationQuantity(Number(e.target.value))} className={inputClass} />
              </Field>
              <Field label="تاريخ التسميد">
                <input type="date" value={fertilizationDate} onChange={e => setFertilizationDate(e.target.value)} className={inputClass} />
              </Field>
            </div>
          </div>
        )}

        {/* Transfer form */}
        {activeAction?.action === 'transfer_cycle' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="عدد الشتلات الناجحة">
                <input type="number" value={transferSuccessCount} onChange={e => setTransferSuccessCount(Number(e.target.value))} className={inputClass} />
              </Field>
              <Field label="تاريخ النقل">
                <input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الحوض المستهدف">
                <select value={transferBasinId} onChange={e => setTransferBasinId(Number(e.target.value))} className={inputClass}>
                  <option value={0}>اختر حوض...</option>
                  {basins.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="رقم خط النقل">
                <input type="number" value={transferLineNumber} onChange={e => setTransferLineNumber(Number(e.target.value))} className={inputClass} />
              </Field>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-surface-muted/50 border border-line p-3">
              <input
                type="checkbox"
                id="markRemainingFailed"
                checked={transferMarkRemainingFailed}
                onChange={e => setTransferMarkRemainingFailed(e.target.checked)}
                className="h-4 w-4 rounded text-action-primary focus:ring-action-primary/50 border-line"
              />
              <label htmlFor="markRemainingFailed" className="text-xs font-bold text-ink-soft">
                اعتبار باقي البذور غير ناجحة وإنهاء الدورة
              </label>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 border-t border-line pt-4">
          <button
            onClick={onCancel}
            className="min-h-11 px-5 py-2 rounded-xl text-sm font-bold text-ink-soft hover:bg-surface-muted transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onSubmit}
            disabled={actionSubmitting}
            className="min-h-11 px-6 py-2 rounded-xl text-sm font-bold text-white bg-action-primary hover:bg-action-primary-hover disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {actionSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span>تأكيد وتسجيل</span>
          </button>
        </div>
      </div>
    </AppDialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-ink-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}
