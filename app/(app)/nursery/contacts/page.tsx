'use client'

import React, { useState } from 'react'
import { useNurseryContacts } from '@/lib/hooks/useNurseryContacts'
import { Plus, Pencil, Trash2, Phone, Mail, MapPin, FileText, Loader2 } from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import ContactForm from '@/components/nursery/ContactForm'
import { Skeleton } from '@/components/ui/Skeleton'
import type { NurseryContact, NurseryContactType } from '@/lib/api/nurseryContacts'

type ContactFormData = {
  name: string
  type: 'customer' | 'supplier' | 'both'
  phone?: string
  email?: string
  tax_number?: string
  address?: string
}

export default function NurseryContactsPage() {
  const { contacts, counters, isLoading, error, createContact, updateContact, deleteContact, isCreating, isUpdating, isDeleting } = useNurseryContacts()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<NurseryContact | null>(null)
  const [deletingContactId, setDeletingContactId] = useState<number | null>(null)

  const handleOpenCreateModal = () => {
    setEditingContact(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (contact: NurseryContact) => {
    setEditingContact(contact)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingContact(null)
  }

  const handleSubmit = (data: ContactFormData) => {
    if (editingContact) {
      updateContact({ id: editingContact.id, data })
    } else {
      createContact(data)
    }
    handleCloseModal()
  }

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من حذف جهة الاتصال هذه؟')) {
      setDeletingContactId(id)
      deleteContact(id)
      setDeletingContactId(null)
    }
  }

  const getTypeBadgeStyles = (type: NurseryContactType) => {
    switch (type) {
      case 'customer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'supplier':
        return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'both':
        return 'bg-purple-50 text-purple-700 border-purple-100'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100'
    }
  }

  const getTypeLabel = (type: NurseryContactType) => {
    switch (type) {
      case 'customer':
        return 'عميل'
      case 'supplier':
        return 'مورد'
      case 'both':
        return 'عميل ومورد'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Control Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">العملاء والموردين</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة جهات الاتصال التجارية الخاصة بالمشتل فقط</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#c2410c] text-white rounded-lg hover:bg-[#a33508] active:scale-[0.98] transition-all font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة جهة اتصال جديدة</span>
        </button>
      </div>

      {/* Counters */}
      {counters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">إجمالي العملاء</div>
            <div className="text-2xl font-bold text-emerald-600">{counters.total_customers}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">إجمالي الموردين</div>
            <div className="text-2xl font-bold text-blue-600">{counters.total_suppliers}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">عميل ومورد</div>
            <div className="text-2xl font-bold text-purple-600">{counters.total_both}</div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold mb-2">خطأ في تحميل البيانات:</p>
          <p className="text-sm">{String(error)}</p>
          <p className="text-xs mt-2 text-red-600">
            تأكد من تسجيل الدخول وأن لديك صلاحية الوصول إلى جهات الاتصال
          </p>
        </div>
      )}

      {/* Contacts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
          <div className="text-gray-400 mb-4">
            <FileText className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد جهات اتصال</h3>
          <p className="text-gray-500 mb-4">ابدأ بإضافة جهة اتصال جديدة للمشتل</p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#c2410c] text-white rounded-lg hover:bg-[#a33508] active:scale-[0.98] transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة جهة اتصال</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{contact.name}</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeStyles(contact.type)}`}
                  >
                    {getTypeLabel(contact.type)}
                  </span>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-2 mb-4">
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span dir="ltr">{contact.phone}</span>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.tax_number && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span dir="ltr">{contact.tax_number}</span>
                  </div>
                )}
                {contact.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{contact.address}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleOpenEditModal(contact)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md active:scale-[0.98] transition-all"
                  disabled={isUpdating}
                >
                  <Pencil className="w-4 h-4" />
                  <span>تعديل</span>
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md active:scale-[0.98] transition-all"
                  disabled={isDeleting || deletingContactId === contact.id}
                >
                  {deletingContactId === contact.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact Form Modal */}
      <AppDialog
        open={isModalOpen}
        onClose={handleCloseModal}
        panelClassName="max-w-lg w-full"
        labelledBy="contact-modal-title"
      >
        <ContactForm
          contact={editingContact}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isSubmitting={isCreating || isUpdating}
        />
      </AppDialog>
    </div>
  )
}
