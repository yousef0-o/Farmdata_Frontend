'use client'

import React, { useState } from 'react'
import { X, Loader2, AlertCircle, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import AssetPolymorphicFields from './AssetPolymorphicFields'
import { CATEGORY_CONFIG } from './AssetTypeBadge'
import { STATUS_CONFIG } from './AssetStatusBadge'
import type { Asset } from '@/lib/types'

interface AssetWizardFormProps {
  editingAsset: Asset | null
  onSubmit: (data: Partial<Asset>) => void
  onClose: () => void
  isPending: boolean
  serverErrors: Record<string, string>
}

const STEPS = [
  { key: 'basic', label: 'البيانات الأساسية' },
  { key: 'finance', label: 'البيانات المالية' },
  { key: 'details', label: 'المواصفات الفرعية' },
]

function getInitialForm(asset: Asset | null): Partial<Asset> {
  if (asset) {
    return {
      ...asset,
      value_as_of: asset.value_as_of ? asset.value_as_of.split('T')[0] : '',
      additional_details: asset.additional_details || {},
    }
  }
  return {
    asset_code: `AST-${Date.now().toString().slice(-6)}`,
    name: '', name_en: '', category: 'equipment', sub_category: '',
    calculation_type: 'قسط ثابت', calculated_by: 'النظام الآلي',
    calculation_rate: 0, purchase_value: 0, book_value: 0,
    value_as_of: new Date().toISOString().split('T')[0],
    location_code: '', location_name: '', cost_center_code: '', cost_center_name: '',
    asset_account: '', asset_account_name: '',
    depreciation_ac: '', depreciation_ac_name: '',
    accumulated_depreciation_ac: '', accumulated_depreciation_ac_name: '',
    status: 'active', additional_details: {},
  }
}

export default function AssetWizardForm({ editingAsset, onSubmit, onClose, isPending, serverErrors }: AssetWizardFormProps) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Partial<Asset>>(() => getInitialForm(editingAsset))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const allErrors = { ...errors, ...serverErrors }

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {}
    if (s === 0) {
      if (!form.asset_code) errs.asset_code = 'كود الأصل مطلوب'
      if (!form.name) errs.name = 'الاسم العربي مطلوب'
      if (!form.category) errs.category = 'الفئة مطلوبة'
    }
    if (s === 1) {
      if (!form.purchase_value || form.purchase_value < 0) errs.purchase_value = 'قيمة الشراء مطلوبة'
      if (form.book_value === undefined || form.book_value < 0) errs.book_value = 'القيمة الدفترية مطلوبة'
      if (form.calculation_rate === undefined || form.calculation_rate < 0) errs.calculation_rate = 'معدل الإهلاك يجب أن يكون صفر أو أكبر'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 2))
  }
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(step)) return
    onSubmit(form)
  }

  const inp = (key: keyof Asset, label: string, opts: { required?: boolean; type?: string; placeholder?: string; span?: number } = {}) => (
    <div className={opts.span ? `md:col-span-${opts.span}` : ''}>
      <label className="text-xs font-semibold text-gray-700 block mb-1">
        {label} {opts.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={opts.type || 'text'}
        step={opts.type === 'number' ? '0.01' : undefined}
        placeholder={opts.placeholder}
        className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:ring-2 focus:ring-farm-blue focus:outline-none text-sm ${
          allErrors[key] ? 'border-red-500' : 'border-gray-200'
        }`}
        value={(form as any)[key] ?? ''}
        onChange={(e) => {
          const val = opts.type === 'number' ? (e.target.value === '' ? 0 : parseFloat(e.target.value)) : e.target.value
          setForm({ ...form, [key]: val })
        }}
      />
      {allErrors[key] && <p className="text-xxs text-red-500 mt-1">{allErrors[key]}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {editingAsset ? 'تعديل بيانات الأصل' : 'إضافة أصل رأسمالي جديد'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">الخطوة {step + 1} من 3 — {STEPS[step].label}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-250 rounded-full transition-all text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 py-3 border-b border-gray-100 bg-white">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <button
                type="button"
                onClick={() => { if (i < step) setStep(i) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  i === step
                    ? 'bg-farm-blue text-white'
                    : i < step
                    ? 'bg-emerald-100 text-emerald-700 cursor-pointer'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                {s.label}
              </button>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-250" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {allErrors.non_field && (
            <div className="p-4 bg-red-100 border border-red-200 text-red-650 text-sm rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-550" />
              <span>{allErrors.non_field}</span>
            </div>
          )}

          {/* STEP 1: Basic info */}
          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {inp('asset_code', 'كود الأصل', { required: true })}
              {inp('name', 'اسم الأصل (عربي)', { required: true })}
              {inp('name_en', 'الاسم بالإنجليزية')}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">فئة الأصل <span className="text-red-500">*</span></label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-farm-blue focus:outline-none text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as any, additional_details: {} })}
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, c]) => (
                    <option key={key} value={key}>{c.label}</option>
                  ))}
                </select>
              </div>
              {inp('sub_category', 'التصنيف الفرعي')}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">الحالة التشغيلية</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-farm-blue focus:outline-none text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                >
                  {Object.entries(STATUS_CONFIG).map(([key, s]) => (
                    <option key={key} value={key}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Finance */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">البيانات المالية والإهلاك</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {inp('purchase_value', 'قيمة الشراء', { required: true, type: 'number' })}
                  {inp('book_value', 'القيمة الدفترية المتبقية', { required: true, type: 'number' })}
                  {inp('calculation_rate', 'معدل الإهلاك السنوي (ريال)', { required: true, type: 'number' })}
                  {inp('value_as_of', 'تاريخ القيمة الختامي', { type: 'date' })}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">الموقع ومركز التكلفة</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {inp('location_code', 'كود الموقع')}
                  {inp('location_name', 'اسم الموقع')}
                  {inp('cost_center_code', 'كود مركز التكلفة')}
                  {inp('cost_center_name', 'اسم مركز التكلفة')}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">حسابات دفتر الأستاذ</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {inp('asset_account', 'حساب الأصل', { placeholder: 'كود الحساب' })}
                  {inp('asset_account_name', 'اسم حساب الأصل')}
                  {inp('depreciation_ac', 'حساب مصاريف الإهلاك', { placeholder: 'كود الحساب' })}
                  {inp('depreciation_ac_name', 'اسم حساب مصروف الإهلاك')}
                  {inp('accumulated_depreciation_ac', 'حساب مجمع الإهلاك')}
                  {inp('accumulated_depreciation_ac_name', 'اسم حساب مجمع الإهلاك')}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Polymorphic additional details */}
          {step === 2 && (
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                المواصفات والخصائص الفرعية ({CATEGORY_CONFIG[form.category ?? '']?.label})
              </h3>
              <AssetPolymorphicFields
                category={form.category ?? 'equipment'}
                additionalDetails={form.additional_details ?? {}}
                onChange={(details) => setForm({ ...form, additional_details: details })}
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div>
              {step > 0 && (
                <button type="button" onClick={handlePrev}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium">
                  <ChevronRight className="w-4 h-4" /> السابق
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="bg-gray-100 hover:bg-gray-250 text-gray-600 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
                إلغاء
              </button>
              {step < 2 ? (
                <button type="button" onClick={handleNext}
                  className="bg-farm-blue hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  التالي <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={isPending}
                  className="bg-farm-blue hover:bg-blue-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAsset ? 'حفظ التعديلات' : 'إضافة الأصل للموازنة'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
