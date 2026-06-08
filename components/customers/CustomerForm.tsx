'use client'

import React, { useState, useRef, useCallback } from 'react'
import { X, AlertCircle, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import type { Customer } from '@/lib/types'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
import AppDialog from '@/components/ui/AppDialog'
import { Button } from '@/components/ui/Button'

interface CustomerFormProps {
  editingCustomer: Customer | null
  onSubmit: (data: Partial<Customer>) => void
  onClose: () => void
  isPending: boolean
  serverErrors: Record<string, string>
}

const STEPS = [
  { key: 'basic', label: 'البيانات الأساسية' },
  { key: 'financials_address', label: 'البيانات المالية والعناوين' },
]

function getInitialForm(customer: Customer | null): Partial<Customer> {
  if (customer) {
    return {
      customer_code: customer.customer_code,
      customer_name: customer.customer_name,
      email1: customer.email1 || '',
      email2: customer.email2 || '',
      phone1: customer.phone1 || '',
      phone2: customer.phone2 || '',
      fax1: customer.fax1 || '',
      fax2: customer.fax2 || '',
      postal_code: customer.postal_code || '',
      country: customer.country || '',
      credit_limit: customer.credit_limit ?? 0,
      discount_days: customer.discount_days ?? 0,
      guarantee_amount: customer.guarantee_amount ?? 0,
      discount_rate: customer.discount_rate ?? 0,
      payment_discount: customer.payment_discount ?? 0,
      discount_limit: customer.discount_limit ?? 0,
      tax_number: customer.tax_number || '',
      commercial_record: customer.commercial_record || '',
      account_code: customer.account_code || '',
      account_name: customer.account_name || '',
      customer_type: customer.customer_type || 'company',
      company_name: customer.company_name || '',
      issue_date: customer.issue_date || '',
      salesman_number: customer.salesman_number || '',
      salesman_name: customer.salesman_name || '',
      sales_area_code: customer.sales_area_code || '',
      sales_area_name: customer.sales_area_name || '',
      po_box: customer.po_box || '',
      district: customer.district || '',
      province: customer.province || '',
      street_name: customer.street_name || '',
      building_number: customer.building_number || '',
      customer_address: customer.customer_address || '',
      additional_street: customer.additional_street || '',
      additional_number: customer.additional_number || '',
      reference1: customer.reference1 || '',
      reference2: customer.reference2 || '',
      reference1_email: customer.reference1_email || '',
      reference2_email: customer.reference2_email || '',
      reference1_phone: customer.reference1_phone || '',
      reference2_phone: customer.reference2_phone || '',
    }
  }
  return {
    customer_code: `CUST-${Date.now().toString().slice(-6)}`,
    customer_name: '',
    email1: '', email2: '', phone1: '', phone2: '', fax1: '', fax2: '',
    postal_code: '', country: 'Saudi Arabia',
    credit_limit: 0, discount_days: 0, guarantee_amount: 0, discount_rate: 0, payment_discount: 0, discount_limit: 0,
    tax_number: '', commercial_record: '', account_code: '', account_name: '',
    customer_type: 'company', company_name: '', issue_date: '',
    salesman_number: '', salesman_name: '', sales_area_code: '', sales_area_name: '',
    po_box: '', district: '', province: '', street_name: '', building_number: '', customer_address: '', additional_street: '', additional_number: '',
    reference1: '', reference2: '', reference1_email: '', reference2_email: '', reference1_phone: '', reference2_phone: '',
  }
}

export default function CustomerForm({ editingCustomer, onSubmit, onClose, isPending, serverErrors }: CustomerFormProps) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Partial<Customer>>(() => getInitialForm(editingCustomer))
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ref دايمًا بيحمل آخر نسخة من form — بيحل مشكلة stale closure في React 18
  const formRef = useRef(form)

  const updateForm = useCallback((key: keyof Customer, val: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val }
      formRef.current = next
      return next
    })
  }, [])

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const PHONE_REGEX = /^[+\d\s\-().]{7,20}$/

  const validateStep = (s: number): boolean => {
    const f = formRef.current
    const errs: Record<string, string> = {}

    if (s === 0) {
      if (!f.customer_code?.trim()) errs.customer_code = 'كود العميل مطلوب'
      if (!f.customer_name?.trim()) errs.customer_name = 'اسم العميل مطلوب'
      if (!f.customer_type) errs.customer_type = 'نوع العميل مطلوب'
      if (f.customer_type === 'company' && !f.company_name?.trim())
        errs.company_name = 'اسم الشركة مطلوب للشركات'

      if (f.email1 && !EMAIL_REGEX.test(f.email1))
        errs.email1 = 'صيغة البريد الإلكتروني غير صحيحة'
      if (f.email2 && !EMAIL_REGEX.test(f.email2))
        errs.email2 = 'صيغة البريد الإلكتروني غير صحيحة'

      if (f.phone1 && !PHONE_REGEX.test(f.phone1))
        errs.phone1 = 'صيغة رقم الهاتف غير صحيحة (أرقام ومسافات وشرطات فقط)'
      if (f.phone2 && !PHONE_REGEX.test(f.phone2))
        errs.phone2 = 'صيغة رقم الهاتف غير صحيحة (أرقام ومسافات وشرطات فقط)'
      if (f.fax1 && !PHONE_REGEX.test(f.fax1))
        errs.fax1 = 'صيغة رقم الفاكس غير صحيحة'
      if (f.fax2 && !PHONE_REGEX.test(f.fax2))
        errs.fax2 = 'صيغة رقم الفاكس غير صحيحة'
    }

    if (s === 1) {
      if (f.credit_limit === undefined || Number(f.credit_limit) < 0)
        errs.credit_limit = 'يجب إدخال حد ائتمان صحيح (صفر أو أكثر)'
      if (f.discount_days === undefined || Number(f.discount_days) < 0)
        errs.discount_days = 'يجب إدخال أيام خصم صحيحة'
      if (f.discount_rate !== undefined && (Number(f.discount_rate) < 0 || Number(f.discount_rate) > 100))
        errs.discount_rate = 'معدل الخصم يجب أن يكون بين 0 و 100'
      if (f.payment_discount !== undefined && (Number(f.payment_discount) < 0 || Number(f.payment_discount) > 100))
        errs.payment_discount = 'خصم الدفع السريع يجب أن يكون بين 0 و 100'
      if (f.guarantee_amount !== undefined && Number(f.guarantee_amount) < 0)
        errs.guarantee_amount = 'مبلغ الضمان لا يمكن أن يكون سالبًا'
      if (f.discount_limit !== undefined && Number(f.discount_limit) < 0)
        errs.discount_limit = 'حد الخصم لا يمكن أن يكون سالبًا'

      if (f.reference1_email && !EMAIL_REGEX.test(f.reference1_email))
        errs.reference1_email = 'صيغة البريد الإلكتروني غير صحيحة'
      if (f.reference2_email && !EMAIL_REGEX.test(f.reference2_email))
        errs.reference2_email = 'صيغة البريد الإلكتروني غير صحيحة'
      if (f.reference1_phone && !PHONE_REGEX.test(f.reference1_phone))
        errs.reference1_phone = 'صيغة رقم الهاتف غير صحيحة'
      if (f.reference2_phone && !PHONE_REGEX.test(f.reference2_phone))
        errs.reference2_phone = 'صيغة رقم الهاتف غير صحيحة'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0))

  const allErrors = { ...errors, ...serverErrors }

  const handleSubmit = () => {
    if (!validateStep(step)) return
    const f = formRef.current
    const payload: Partial<Customer> = {
      customer_code: f.customer_code,
      customer_name: f.customer_name,
      customer_type: f.customer_type,
      company_name: f.customer_type === 'company' ? f.company_name : '',
      email1: f.email1 || null as any,
      email2: f.email2 || null as any,
      phone1: f.phone1 || null as any,
      phone2: f.phone2 || null as any,
      fax1: f.fax1 || null as any,
      fax2: f.fax2 || null as any,
      postal_code: f.postal_code || null as any,
      country: f.country || null as any,
      credit_limit: Number(f.credit_limit ?? 0),
      discount_days: Number(f.discount_days ?? 0),
      guarantee_amount: Number(f.guarantee_amount ?? 0),
      discount_rate: Number(f.discount_rate ?? 0),
      payment_discount: Number(f.payment_discount ?? 0),
      discount_limit: Number(f.discount_limit ?? 0),
      tax_number: f.tax_number || null as any,
      commercial_record: f.commercial_record || null as any,
      account_code: f.account_code || null as any,
      account_name: f.account_name || null as any,
      issue_date: f.issue_date || null as any,
      salesman_number: f.salesman_number || null as any,
      salesman_name: f.salesman_name || null as any,
      sales_area_code: f.sales_area_code || null as any,
      sales_area_name: f.sales_area_name || null as any,
      po_box: f.po_box || null as any,
      district: f.district || null as any,
      province: f.province || null as any,
      street_name: f.street_name || null as any,
      building_number: f.building_number || null as any,
      customer_address: f.customer_address || null as any,
      additional_street: f.additional_street || null as any,
      additional_number: f.additional_number || null as any,
      reference1: f.reference1 || null as any,
      reference2: f.reference2 || null as any,
      reference1_email: f.reference1_email || null as any,
      reference2_email: f.reference2_email || null as any,
      reference1_phone: f.reference1_phone || null as any,
      reference2_phone: f.reference2_phone || null as any,
    }
    onSubmit(payload)
  }

  const inp = (key: keyof Customer, label: React.ReactNode, opts: { required?: boolean; type?: string; placeholder?: string; span?: number } = {}) => (
    <div className={opts.span ? `md:col-span-${opts.span}` : ''}>
      <label htmlFor={key} className="mb-1 flex items-center gap-1 text-xs font-semibold text-ink-soft">
        {label} {opts.required && <span className="text-danger">*</span>}
      </label>
      <input
        id={key}
        type={opts.type || 'text'}
        step={opts.type === 'number' ? '0.01' : undefined}
        placeholder={opts.placeholder}
        className={`w-full rounded-xl border bg-surface-muted px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-action-primary ${
          allErrors[key] ? 'border-danger' : 'border-line'
        }`}
        value={(form as any)[key] ?? ''}
        onChange={(e) => {
          const val = opts.type === 'number' ? (e.target.value === '' ? 0 : parseFloat(e.target.value)) : e.target.value
          updateForm(key, val)
        }}
      />
      {allErrors[key] && <p className="mt-1 text-xs text-danger">{allErrors[key]}</p>}
    </div>
  )

  return (
    <AppDialog open onClose={onClose} panelClassName="max-w-4xl animate-in fade-in zoom-in duration-200">
      <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-surface shadow-xl text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-surface-subtle p-6">
          <div>
            <h2 className="text-lg font-bold text-ink">
              {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">الخطوة {step + 1} من {STEPS.length} — {STEPS[step].label}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="إغلاق النموذج" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 border-b border-line bg-surface py-3">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <Button
                type="button"
                onClick={() => { if (i < step) setStep(i) }}
                variant={i === step ? 'primary' : i < step ? 'secondary' : 'ghost'}
                size="sm"
                disabled={i > step}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                {s.label}
              </Button>
              {i < STEPS.length - 1 && <div className="h-px w-6 bg-line" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body — div بدل form عشان نمنع أي submission عرضي */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {allErrors.non_field && (
            <div className="flex items-center gap-3 rounded-xl border border-danger-soft bg-danger-soft p-4 text-sm text-danger">
              <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
              <span>{allErrors.non_field}</span>
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {inp('customer_code', 'كود العميل', { required: true })}
                {inp('customer_name', 'اسم العميل', { required: true })}
                <div>
                  <label htmlFor="customer_type" className="mb-1 block text-xs font-semibold text-ink-soft">نوع العميل <span className="text-danger">*</span></label>
                  <select
                    id="customer_type"
                    className="w-full rounded-xl border border-line bg-surface-muted px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-action-primary"
                    value={form.customer_type}
                    onChange={(e) => updateForm('customer_type', e.target.value as any)}
                  >
                    <option value="company">شركة</option>
                    <option value="individual">فرد</option>
                  </select>
                </div>
                {form.customer_type === 'company' && inp('company_name', 'اسم الشركة', { required: true })}
                {inp('issue_date', 'تاريخ التسجيل/الإصدار', { type: 'date' })}
              </div>

              <div className="border-t border-line pt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-soft">الاتصال والتواصل</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {inp('phone1', 'الهاتف الأساسي')}
                  {inp('phone2', 'الهاتف الإضافي')}
                  {inp('email1', 'البريد الإلكتروني الأساسي')}
                  {inp('email2', 'البريد الإلكتروني الإضافي')}
                  {inp('fax1', 'الفاكس 1')}
                  {inp('fax2', 'الفاكس 2')}
                </div>
              </div>

              <div className="border-t border-line pt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-soft">مسؤول المبيعات والمنطقة</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {inp('salesman_number', 'رقم المندوب')}
                  {inp('salesman_name', 'اسم المندوب')}
                  {inp('sales_area_code', 'كود منطقة البيع')}
                  {inp('sales_area_name', 'اسم منطقة البيع')}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Financials, Address, and References */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-soft">البيانات المالية وحسابات الأستاذ</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {inp('credit_limit', <span className="flex items-center gap-0.5">الحد الائتماني (<SaudiRiyalIcon size={12} className="text-success-strong" />)</span>, { type: 'number' })}
                  {inp('discount_days', 'أيام الخصم المسموح بها', { type: 'number' })}
                  {inp('guarantee_amount', 'مبلغ الضمان', { type: 'number' })}
                  {inp('discount_rate', 'معدل الخصم (%)', { type: 'number' })}
                  {inp('payment_discount', 'خصم الدفع السريع (%)', { type: 'number' })}
                  {inp('discount_limit', 'حد الخصم الأقصى', { type: 'number' })}
                  {inp('tax_number', 'الرقم الضريبي')}
                  {inp('commercial_record', 'السجل التجاري')}
                  {inp('account_code', 'كود الحساب في الدليل')}
                  {inp('account_name', 'اسم الحساب في الدليل')}
                </div>
              </div>

              <div className="border-t border-line pt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-soft">العنوان الوطني والتفاصيل الجغرافية</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {inp('country', 'الدولة')}
                  {inp('province', 'المنطقة/المحافظة')}
                  {inp('district', 'الحي')}
                  {inp('street_name', 'اسم الشارع')}
                  {inp('building_number', 'رقم المبنى')}
                  {inp('additional_street', 'اسم الشارع الإضافي')}
                  {inp('additional_number', 'الرقم الإضافي للمبنى')}
                  {inp('po_box', 'صندوق البريد')}
                  {inp('postal_code', 'الرمز البريدي')}
                  {inp('customer_address', 'العنوان الكامل بالتفصيل', { span: 2 })}
                </div>
              </div>

              <div className="border-t border-line pt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-soft">مراجع الاتصال الإضافية</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {inp('reference1', 'المرجع الأول (الاسم)')}
                  {inp('reference1_phone', 'هاتف المرجع الأول')}
                  {inp('reference1_email', 'بريد المرجع الأول')}
                  {inp('reference2', 'المرجع الثاني (الاسم)')}
                  {inp('reference2_phone', 'هاتف المرجع الثاني')}
                  {inp('reference2_email', 'بريد المرجع الثاني')}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-line pt-6">
            <div>
              {step > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  السابق
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  التالي
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  isLoading={isPending}
                  loadingText={editingCustomer ? 'حفظ التعديلات' : 'إضافة العميل'}
                >
                  {editingCustomer ? 'حفظ التعديلات' : 'إضافة العميل'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppDialog>
  )
}
