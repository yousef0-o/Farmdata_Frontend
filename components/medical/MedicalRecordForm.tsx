'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Calendar, Stethoscope, ArrowRight, Save, Loader2 } from 'lucide-react'
import { useWarehouses } from '@/lib/hooks/useInventory'
import { apiRequest } from '@/lib/api/client'
import type { FlockMedicalRecord } from '@/lib/types'

interface MedicalRecordFormProps {
  flockId: number
  initialData?: FlockMedicalRecord
  onSubmit: (data: any) => Promise<any>
  isPending: boolean
}

export default function MedicalRecordForm({ flockId, initialData, onSubmit, isPending }: MedicalRecordFormProps) {
  const router = useRouter()
  
  // Load raw warehouses
  const { data: warehousesResponse, isLoading: isLoadingWarehouses } = useWarehouses(1, 100)
  const allWarehouses = Array.isArray(warehousesResponse)
    ? warehousesResponse
    : (warehousesResponse as any)?.data || []

  const [recordDate, setRecordDate] = useState('')
  const [clinicalSigns, setClinicalSigns] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('low')
  const [veterinarian, setVeterinarian] = useState('')
  const [notes, setNotes] = useState('')

  // State for pre-fetched and filtered warehouses & balances containing medicines ('أدوية')
  const [validWarehouses, setValidWarehouses] = useState<any[]>([])
  const [warehouseBalancesMap, setWarehouseBalancesMap] = useState<Record<number, any[]>>([])
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)

  // State for medications list
  const [medications, setMedications] = useState<{
    id?: number
    sourceType: 'warehouse' | 'external'
    warehouseId: string
    itemId: string
    medicineName: string
    quantity: string
    dosage: string
    method: string
  }[]>([])

  // Pre-fetch warehouse balances and filter only warehouses & items containing 'أدوية'
  useEffect(() => {
    if (allWarehouses.length > 0) {
      setIsLoadingBalances(true)
      Promise.all(
        allWarehouses.map((wh: any) =>
          apiRequest<{ data: any[] }>(`/warehouses/${wh.id}/balances`)
            .then((res) => ({ warehouseId: wh.id, balances: res.data || [] }))
            .catch(() => ({ warehouseId: wh.id, balances: [] }))
        )
      ).then((results) => {
        const newMap: Record<number, any[]> = {}
        const filteredWhs: any[] = []

        results.forEach((r) => {
          // Filter balances to only include items under the medicine category ('أدوية') with a positive quantity
          const medicineBalances = r.balances.filter(
            (b: any) => b.item_category === 'أدوية' && b.quantity_on_hand > 0
          )
          newMap[r.warehouseId] = medicineBalances
          
          if (medicineBalances.length > 0) {
            const whObj = allWarehouses.find((wh: any) => wh.id === r.warehouseId)
            if (whObj) {
              filteredWhs.push(whObj)
            }
          }
        })

        setWarehouseBalancesMap(newMap)
        setValidWarehouses(filteredWhs)
        setIsLoadingBalances(false)
      })
    }
  }, [allWarehouses])

  useEffect(() => {
    if (initialData) {
      setRecordDate(initialData.record_date)
      setClinicalSigns(initialData.clinical_signs || '')
      setDiagnosis(initialData.diagnosis || '')
      setSeverity(initialData.severity || 'low')
      setVeterinarian(initialData.veterinarian || '')
      setNotes(initialData.notes || '')

      if (initialData.medications && initialData.medications.length > 0) {
        setMedications(
          initialData.medications.map((med) => ({
            id: med.id,
            sourceType: med.inventory_item_id ? 'warehouse' : 'external',
            warehouseId: String(med.warehouse_id || ''),
            itemId: String(med.inventory_item_id || ''),
            medicineName: med.medicine_name || '',
            quantity: String(med.quantity || ''),
            dosage: med.dosage || '',
            method: med.method_of_administration || '',
          }))
        )
      }
    } else {
      // Default date is today
      setRecordDate(new Date().toISOString().split('T')[0])
    }
  }, [initialData])

  const addMedicationRow = () => {
    setMedications((prev) => [
      ...prev,
      {
        sourceType: 'warehouse',
        warehouseId: '',
        itemId: '',
        medicineName: '',
        quantity: '',
        dosage: '',
        method: '',
      },
    ])
  }

  const removeMedicationRow = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index))
  }

  const updateMedicationRow = (index: number, key: string, value: any) => {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [key]: value } : med))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate date
    if (!recordDate) {
      alert('الرجاء اختيار التاريخ')
      return
    }

    // Format medications for API
    const formattedMedications = medications.map((med) => {
      const isWarehouse = med.sourceType === 'warehouse'
      return {
        medicine_name: isWarehouse ? undefined : med.medicineName,
        warehouse_id: isWarehouse && med.warehouseId ? Number(med.warehouseId) : undefined,
        inventory_item_id: isWarehouse && med.itemId ? Number(med.itemId) : undefined,
        quantity: isWarehouse && med.quantity ? Number(med.quantity) : undefined,
        dosage: med.dosage || undefined,
        method_of_administration: med.method || undefined,
      }
    })

    const payload = {
      record_date: recordDate,
      clinical_signs: clinicalSigns || undefined,
      diagnosis: diagnosis || undefined,
      severity,
      veterinarian: veterinarian || undefined,
      notes: notes || undefined,
      medications: formattedMedications,
    }

    try {
      await onSubmit(payload)
      router.push(`/flocks/${flockId}`)
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ أثناء حفظ السجل الطبي')
    }
  }

  const isLoading = isLoadingWarehouses || isLoadingBalances

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-red-600" />
          بيانات الفحص والتشخيص الطبي
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              التاريخ *
            </label>
            <div className="relative">
              <input
                type="date"
                required
                disabled={!!initialData} // Date shouldn't be edited
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              الطبيب البيطري المعالج
            </label>
            <input
              type="text"
              placeholder="اسم الطبيب"
              value={veterinarian}
              onChange={(e) => setVeterinarian(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              درجة الخطورة والحالة العامة
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
            >
              <option value="low">منخفضة (فحص روتيني / تحصين)</option>
              <option value="medium">متوسطة (أعراض خفيفة)</option>
              <option value="high">مرتفعة جداً (إصابة حادة / تفشي)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              الأعراض الإكلينيكية المرصودة
            </label>
            <textarea
              rows={3}
              placeholder="مثال: خمول، إسهال، عطس، نقص في استهلاك العلف..."
              value={clinicalSigns}
              onChange={(e) => setClinicalSigns(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              التشخيص النهائي
            </label>
            <textarea
              rows={3}
              placeholder="مثال: نيوكاسل، التهاب معوي، برد حاد..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            ملاحظات إضافية
          </label>
          <input
            type="text"
            placeholder="أي تفاصيل أو توصيات إضافية للمشرفين"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
          />
        </div>
      </div>

      {/* Medications Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            صرف الأدوية واللقاحات
          </h3>
          <button
            type="button"
            onClick={addMedicationRow}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-xl transition-all font-semibold border border-red-100 text-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            إضافة دواء / لقاح
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6 items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
            جاري تحميل المستودعات وأرصدة الأدوية المتوفرة...
          </div>
        ) : medications.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            لم يتم صرف أي دواء أو تحصين مع هذا الفحص. اضغط على "إضافة دواء" إذا لزم الأمر.
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((med, index) => (
              <MedicationRow
                key={index}
                index={index}
                med={med}
                warehouses={validWarehouses}
                balances={warehouseBalancesMap[Number(med.warehouseId)] || []}
                onUpdate={updateMedicationRow}
                onRemove={removeMedicationRow}
              />
            ))}
          </div>
        )}
      </div>

      {/* Submit / Cancel Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || isLoading}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-md disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          حفظ السجل وصرف العلاج
        </button>

        <button
          type="button"
          onClick={() => router.push(`/flocks/${flockId}`)}
          className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl transition-all font-semibold"
        >
          <ArrowRight className="w-5 h-5" />
          إلغاء
        </button>
      </div>
    </form>
  )
}

interface MedicationRowProps {
  index: number
  med: any
  warehouses: any[]
  balances: any[]
  onUpdate: (index: number, key: string, value: any) => void
  onRemove: (index: number) => void
}

function MedicationRow({ index, med, warehouses, balances, onUpdate, onRemove }: MedicationRowProps) {
  // Track the selected stock balance to display unit and maximum available
  const selectedBalance = balances.find((b) => String(b.item_id) === med.itemId)

  return (
    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3 relative">
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
        title="حذف هذا الدواء"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pr-2">
        {/* Source type selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            مصدر الدواء
          </label>
          <select
            value={med.sourceType}
            onChange={(e) => {
              onUpdate(index, 'sourceType', e.target.value)
              onUpdate(index, 'warehouseId', '')
              onUpdate(index, 'itemId', '')
              onUpdate(index, 'medicineName', '')
              onUpdate(index, 'quantity', '')
            }}
            className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 text-gray-900"
          >
            <option value="warehouse">من مستودعات المزرعة (خصم تلقائي)</option>
            <option value="external">دواء خارجي (بدون خصم مخزني)</option>
          </select>
        </div>

        {/* Dynamic input depending on source type */}
        {med.sourceType === 'warehouse' ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                المستودع
              </label>
              <select
                required
                value={med.warehouseId}
                onChange={(e) => {
                  onUpdate(index, 'warehouseId', e.target.value)
                  onUpdate(index, 'itemId', '')
                  onUpdate(index, 'quantity', '')
                }}
                className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 text-gray-900"
              >
                <option value="">اختر المستودع...</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                الدواء / الصنف بالمستودع
              </label>
              <select
                required
                value={med.itemId}
                onChange={(e) => {
                  onUpdate(index, 'itemId', e.target.value)
                  const bal = balances.find((b) => String(b.item_id) === e.target.value)
                  if (bal) {
                    onUpdate(index, 'medicineName', bal.item_name)
                  }
                }}
                disabled={!med.warehouseId}
                className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 text-gray-900 disabled:opacity-50"
              >
                <option value="">اختر الصنف من المخزن...</option>
                {balances.map((bal) => (
                  <option key={bal.item_id} value={bal.item_id}>
                    {bal.item_name} (المتاح: {bal.quantity_on_hand})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                الكمية المصروفة
                {selectedBalance && (
                  <span className="text-gray-400 mr-1">
                    (أقصى حد: {selectedBalance.quantity_on_hand})
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.001"
                required
                placeholder="الكمية"
                value={med.quantity}
                max={selectedBalance ? selectedBalance.quantity_on_hand : undefined}
                onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
                disabled={!med.itemId}
                className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 text-gray-900 disabled:opacity-50"
              />
            </div>
          </>
        ) : (
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              اسم الدواء الخارجي *
            </label>
            <input
              type="text"
              required
              placeholder="مثال: بانادول بيطري، مضاد سموم مستورد..."
              value={med.medicineName}
              onChange={(e) => onUpdate(index, 'medicineName', e.target.value)}
              className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 text-gray-900"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-2">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            الجرعة وطريقة التخفيف
          </label>
          <input
            type="text"
            placeholder="مثال: 2 مل لكل لتر ماء لمدة 5 أيام"
            value={med.dosage}
            onChange={(e) => onUpdate(index, 'dosage', e.target.value)}
            className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            طريقة إعطاء العلاج
          </label>
          <input
            type="text"
            placeholder="مثال: مياه شرب، حقن عضلي، رش..."
            value={med.method}
            onChange={(e) => onUpdate(index, 'method', e.target.value)}
            className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 text-gray-900"
          />
        </div>
      </div>
    </div>
  )
}
