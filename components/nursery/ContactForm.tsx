'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { NurseryContact, NurseryContactType } from '@/lib/api/nurseryContacts'

const contactSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب').max(255, 'الاسم يجب أن لا يتجاوز 255 حرف'),
  type: z.enum(['customer', 'supplier', 'both'], {
    message: 'النوع مطلوب',
  }),
  phone: z.string().max(50, 'رقم الهاتف يجب أن لا يتجاوز 50 حرف').optional().or(z.literal('')),
  email: z.string().email('البريد الإلكتروني يجب أن يكون صحيحاً').max(100, 'البريد الإلكتروني يجب أن لا يتجاوز 100 حرف').optional().or(z.literal('')),
  tax_number: z.string().regex(/^[0-9]{10,15}$/, 'الرقم الضريبي يجب أن يكون أرقاماً فقط بين 10 و 15 رقم').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
})

type ContactFormData = z.infer<typeof contactSchema>

type ContactFormProps = {
  contact?: NurseryContact | null
  onSubmit: (data: ContactFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export default function ContactForm({ contact, onSubmit, onCancel, isSubmitting = false }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact
      ? {
          name: contact.name,
          type: contact.type,
          phone: contact.phone || '',
          email: contact.email || '',
          tax_number: contact.tax_number || '',
          address: contact.address || '',
        }
      : {
          name: '',
          type: 'customer' as NurseryContactType,
          phone: '',
          email: '',
          tax_number: '',
          address: '',
        },
  })

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 id="contact-modal-title" className="text-lg font-semibold text-gray-900">
          {contact ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة'}
        </h2>
        <Button
          type="button"
          onClick={onCancel}
          variant="ghost"
          size="icon"
          aria-label="إغلاق النموذج"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            الاسم <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            {...register('name')}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c2410c] focus:border-[#c2410c] transition-colors text-right"
            placeholder="أدخل اسم جهة الاتصال"
            disabled={isSubmitting}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1.5">
            النوع <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            {...register('type')}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c2410c] focus:border-[#c2410c] transition-colors text-right bg-white"
            disabled={isSubmitting}
          >
            <option value="customer">عميل</option>
            <option value="supplier">مورد</option>
            <option value="both">عميل ومورد</option>
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
            الهاتف
          </label>
          <input
            type="text"
            id="phone"
            {...register('phone')}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c2410c] focus:border-[#c2410c] transition-colors text-right"
            placeholder="أدخل رقم الهاتف"
            dir="ltr"
            disabled={isSubmitting}
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            id="email"
            {...register('email')}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c2410c] focus:border-[#c2410c] transition-colors text-right"
            placeholder="أدخل البريد الإلكتروني"
            dir="ltr"
            disabled={isSubmitting}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        {/* Tax Number */}
        <div>
          <label htmlFor="tax_number" className="block text-sm font-medium text-gray-700 mb-1.5">
            الرقم الضريبي
          </label>
          <input
            type="text"
            id="tax_number"
            {...register('tax_number')}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c2410c] focus:border-[#c2410c] transition-colors text-right"
            placeholder="أدخل الرقم الضريبي (10-15 رقم)"
            dir="ltr"
            disabled={isSubmitting}
          />
          {errors.tax_number && <p className="mt-1 text-sm text-red-600">{errors.tax_number.message}</p>}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
            العنوان
          </label>
          <textarea
            id="address"
            {...register('address')}
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c2410c] focus:border-[#c2410c] transition-colors text-right resize-none"
            placeholder="أدخل العنوان"
            disabled={isSubmitting}
          />
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="جاري الحفظ..."
          >
            {contact ? 'حفظ التغييرات' : 'إضافة جهة الاتصال'}
          </Button>
        </div>
      </form>
    </div>
  )
}
