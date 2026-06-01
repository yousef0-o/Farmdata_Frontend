'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  BarChart3,
  Bot,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  Edit,
  FileText,
  HeartPulse,
  Layers3,
  Loader2,
  MoreVertical,
  Pill,
  Plus,
  PowerOff,
  Printer,
  RotateCcw,
  Save,
  ShieldAlert,
  Sprout,
  Stethoscope,
  Thermometer,
  Trash2,
  Upload,
  Wheat,
  X,
} from 'lucide-react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { dailyOpsApi, expensesApi, flockApi, organizationApi } from '@/lib/api/organization'
import { useBarnExpenses, useCreateBarnExpense } from '@/lib/hooks/useExpenses'
import { useItems } from '@/lib/hooks/useInventory'
import type {
  BreedingEntry,
  Flock,
  FlockMedication,
  FlockMedicalRecord,
  FlockSummary,
  Item,
  ProductionEntry,
} from '@/lib/types'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
import AppDialog from '@/components/ui/AppDialog'
import { apiRequest } from '@/lib/api/client'

type OperationsTab = 'breeding' | 'entries' | 'mortality' | 'feed' | 'medicine' | 'other'
type DailyEntry = BreedingEntry | ProductionEntry
type MedicineRow = {
  flock: Flock
  record: FlockMedicalRecord
  medication: FlockMedication | null
}
type FlockLedgerRow = {
  flock: Flock
  chickCost: number
  feedCost: number
  vetCost: number
  otherCost: number
  totalValue: number
  birdValue: number
}
type FeedAllocation = {
  id: string
  time: string
  itemId: string
  quantityTon: string
  pricePerTon: string
}
type FeedBatchDisplayRow = {
  id: string
  flock: Flock
  entry: DailyEntry
  logTime: string | null
  feedType: string
  itemId: number | null
  quantityTon: number
  quantityKg: number
  pricePerTon: number
  amount: number
}

const typeLabels: Record<string, string> = {
  production: 'إنتاج',
  breeding: 'تربية',
}

const statusLabels: Record<string, string> = {
  active: 'نشط',
  completed: 'مغلق',
  cancelled: 'ملغي',
}

const statusColors: Record<string, string> = {
  active: 'bg-success-soft text-success-strong border-success-soft',
  completed: 'bg-surface-muted text-ink-soft border-line',
  cancelled: 'bg-danger-soft text-danger-strong border-danger-soft',
}

const operationsTabs: {
  key: OperationsTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { key: 'breeding', label: 'بيانات التربية', icon: BarChart3 },
  { key: 'entries', label: 'ملخص دخول الأفواج', icon: ClipboardList },
  { key: 'mortality', label: 'سجلات النافق', icon: HeartPulse },
  { key: 'feed', label: 'سجلات الأعلاف', icon: Wheat },
  { key: 'medicine', label: 'سجلات الأدوية', icon: Pill },
  { key: 'other', label: 'سجلات أخرى', icon: Layers3 },
]

const clinicalSigns = [
  'خمول',
  'مشاكل تنفسية',
  'انخفاض سحب العلف',
  'عطس / سعال',
  'إفرازات عين / أنف',
  'تورم الرأس',
  'تلون العرف',
  'أعراض عصبية',
  'عرج / مشاكل مفاصل',
  'إسهال مدمم',
  'إسهال أبيض / أخضر',
]

const formatNumber = (value: number, digits = 0) =>
  Number.isFinite(value)
    ? value.toLocaleString('ar-EG', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : '0'

const formatCurrency = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString('ar-EG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00'

const parseNumeric = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const isoToday = () => new Date().toISOString().split('T')[0]

const toDisplayDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const flockCode = (flock: Flock) => {
  if (flock.flock_number) return flock.flock_number
  const compactDate = flock.entry_date?.replaceAll('-', '') || String(flock.id)
  return compactDate || String(flock.id)
}

const getEntryFeedKg = (entry: DailyEntry) => parseNumeric(entry.feed_quantity_kg)

const getEntryFeedBatches = (flock: Flock, entry: DailyEntry): FeedBatchDisplayRow[] => {
  if (entry.feed_batches && entry.feed_batches.length > 0) {
    return entry.feed_batches
      .filter((batch) => parseNumeric(batch.quantity_kg) > 0 || parseNumeric(batch.quantity_ton) > 0)
      .map((batch, index) => {
        const quantityTon = parseNumeric(batch.quantity_ton) || parseNumeric(batch.quantity_kg) / 1000
        const quantityKg = parseNumeric(batch.quantity_kg) || quantityTon * 1000
        const pricePerTon = parseNumeric(batch.price_per_ton)
        return {
          id: `${flock.id}-${entry.id}-${batch.id ?? index}`,
          flock,
          entry,
          logTime: batch.log_time ?? null,
          feedType: batch.feed_type || 'علف تشغيلي',
          itemId: batch.item_id ?? batch.inventory_item_id ?? null,
          quantityTon,
          quantityKg,
          pricePerTon,
          amount: parseNumeric(batch.amount) || quantityTon * pricePerTon,
        }
      })
  }

  const quantityKg = getEntryFeedKg(entry)
  if (quantityKg <= 0) return []

  return [{
    id: `${flock.id}-${entry.id}-summary`,
    flock,
    entry,
    logTime: null,
    feedType: 'إجمالي يومي',
    itemId: null,
    quantityTon: quantityKg / 1000,
    quantityKg,
    pricePerTon: 0,
    amount: 0,
  }]
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

export default function BarnDetailPage() {
  const { id } = useParams()
  const barnId = Number(id)
  const router = useRouter()
  const queryClient = useQueryClient()

  const [activeOperationsTab, setActiveOperationsTab] = useState<OperationsTab>('breeding')
  const [flockFilter, setFlockFilter] = useState<'all' | 'active' | 'completed'>('active')
  const [expandedFlocks, setExpandedFlocks] = useState<Record<number, boolean>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  const [expenseDate, setExpenseDate] = useState(isoToday())
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('صيانة')
  const [description, setDescription] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState('')

  const [selectedFlockId, setSelectedFlockId] = useState('')
  const [recordDate, setRecordDate] = useState(isoToday())
  const [dailyMortality, setDailyMortality] = useState('')
  const [waterConsumption, setWaterConsumption] = useState('')
  const [temperature, setTemperature] = useState('')
  const [humidity, setHumidity] = useState('')
  const [uniformity, setUniformity] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedSigns, setSelectedSigns] = useState<string[]>([])
  const [dailyError, setDailyError] = useState('')
  const [feedAllocations, setFeedAllocations] = useState<FeedAllocation[]>([
    { id: 'feed-1', time: '08:00', itemId: '', quantityTon: '', pricePerTon: '' },
  ])

  const { data, isLoading } = useQuery({
    queryKey: ['barn', barnId],
    queryFn: () => organizationApi.getBarn(barnId),
  })

  const deleteBarnMutation = useMutation({
    mutationFn: (id: number) => organizationApi.deleteBarn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section', barn?.section_id] })
      router.push(`/sections/${barn?.section_id}`)
    },
  })

  const { data: expensesData, isLoading: isExpensesLoading } = useBarnExpenses(barnId)
  const createExpenseMutation = useCreateBarnExpense(barnId)
  const { data: itemsData } = useItems(1, 100)

  const barn = data?.data
  const allFlocksForQueries: Flock[] = useMemo(
    () => barn?.flocks || barn?.active_flocks || [],
    [barn?.active_flocks, barn?.flocks]
  )

  const summaryQueries = useQueries({
    queries: allFlocksForQueries.map((flock) => ({
      queryKey: ['flock-summary', flock.id],
      queryFn: () => flockApi.getFlockSummary(flock.id),
      enabled: Boolean(barn),
      staleTime: 60_000,
    })),
  })

  const dailyEntryQueries = useQueries({
    queries: allFlocksForQueries.map((flock) => ({
      queryKey: ['barn-daily-ledger', flock.id, flock.flock_type],
      queryFn: () =>
        flock.flock_type === 'production'
          ? dailyOpsApi.listProductionEntries(flock.id, 1)
          : dailyOpsApi.listBreedingEntries(flock.id, 1),
      enabled: Boolean(barn),
      staleTime: 60_000,
    })),
  })

  const medicalRecordQueries = useQueries({
    queries: allFlocksForQueries.map((flock) => ({
      queryKey: ['flock-medical-records', flock.id, 1],
      queryFn: () =>
        apiRequest<{ data: FlockMedicalRecord[] } | { data: FlockMedicalRecord[]; meta?: unknown }>(
          `/flocks/${flock.id}/medical-records?page=1`
        ),
      enabled: Boolean(barn),
      staleTime: 60_000,
    })),
  })

  const flockExpenseQueries = useQueries({
    queries: allFlocksForQueries.map((flock) => ({
      queryKey: ['flock-expenses', flock.id],
      queryFn: () => expensesApi.listFlockExpenses(flock.id),
      enabled: Boolean(barn),
      staleTime: 60_000,
    })),
  })

  const summariesByFlock = useMemo(() => {
    const map = new Map<number, FlockSummary>()
    summaryQueries.forEach((query, index) => {
      const flock = allFlocksForQueries[index]
      if (flock && query.data) map.set(flock.id, query.data)
    })
    return map
  }, [allFlocksForQueries, summaryQueries])

  const dailyEntriesByFlock = useMemo(() => {
    const map = new Map<number, DailyEntry[]>()
    dailyEntryQueries.forEach((query, index) => {
      const flock = allFlocksForQueries[index]
      if (!flock) return
      map.set(flock.id, ((query.data?.data ?? []) as DailyEntry[]).slice())
    })
    return map
  }, [allFlocksForQueries, dailyEntryQueries])

  const medicalRecordsByFlock = useMemo(() => {
    const map = new Map<number, FlockMedicalRecord[]>()
    medicalRecordQueries.forEach((query, index) => {
      const flock = allFlocksForQueries[index]
      if (!flock) return
      map.set(flock.id, query.data?.data ?? [])
    })
    return map
  }, [allFlocksForQueries, medicalRecordQueries])

  const flockExpensesByFlock = useMemo(() => {
    const map = new Map<number, NonNullable<Awaited<ReturnType<typeof expensesApi.listFlockExpenses>>['data']>>()
    flockExpenseQueries.forEach((query, index) => {
      const flock = allFlocksForQueries[index]
      if (!flock) return
      map.set(flock.id, query.data?.data ?? [])
    })
    return map
  }, [allFlocksForQueries, flockExpenseQueries])

  const activeStockItems = useMemo(() => {
    const items = itemsData?.data ?? []
    const activeItems = items.filter((item) => item.is_active !== false)
    const feedItems = activeItems.filter((item) => {
      const descriptor = `${item.name ?? ''} ${item.category ?? ''}`.toLowerCase()
      return descriptor.includes('feed') || descriptor.includes('علف') || descriptor.includes('أعلاف')
    })
    return feedItems.length > 0 ? feedItems : activeItems
  }, [itemsData])

  const allFlocks: Flock[] = allFlocksForQueries
  const activeFlocks = allFlocks.filter((flock) => flock.status === 'active' || !flock.status)
  const filteredFlocks = allFlocks.filter((flock) => {
    if (flockFilter === 'all') return true
    if (flockFilter === 'active') return flock.status === 'active' || !flock.status
    if (flockFilter === 'completed') return flock.status === 'completed'
    return true
  })

  const selectedFlock = activeFlocks.find((flock) => String(flock.id) === selectedFlockId) ?? activeFlocks[0]
  const selectedSummary = selectedFlock ? summariesByFlock.get(selectedFlock.id) : undefined
  const selectedEntries = selectedFlock ? dailyEntriesByFlock.get(selectedFlock.id) ?? [] : []
  const selectedPreviousBirdCount =
    selectedEntries[0]?.bird_count ?? selectedSummary?.current_count ?? selectedFlock?.current_count ?? 0
  const selectedEntryBirds = selectedFlock?.entry_birds ?? 0
  const mortalityToday = Math.max(0, parseNumeric(dailyMortality))
  const currentBirdsAfterMortality = Math.max(0, selectedPreviousBirdCount - mortalityToday)
  const birdUnitValue = selectedFlock ? parseNumeric(selectedFlock.chick_unit_cost) : 0
  const mortalityValueToday = mortalityToday * birdUnitValue
  const totalMortalityCount = (selectedSummary?.cumulative_mortality ?? Math.max(0, selectedEntryBirds - selectedPreviousBirdCount)) + mortalityToday
  const totalMortalityValue = totalMortalityCount * birdUnitValue

  const dailyFeedTotalTon = feedAllocations.reduce(
    (total, row) => total + Math.max(0, parseNumeric(row.quantityTon)),
    0
  )
  const dailyFeedTotalCost = feedAllocations.reduce(
    (total, row) => total + Math.max(0, parseNumeric(row.quantityTon)) * Math.max(0, parseNumeric(row.pricePerTon)),
    0
  )

  const expenses = expensesData?.data ?? []

  const backHref = barn?.section_id ? `/sections/${barn.section_id}` : '/companies'

  useEffect(() => {
    if (!selectedFlockId && activeFlocks[0]) {
      setSelectedFlockId(String(activeFlocks[0].id))
    }
  }, [activeFlocks, selectedFlockId])

  const resetDailySheet = () => {
    setRecordDate(isoToday())
    setDailyMortality('')
    setWaterConsumption('')
    setTemperature('')
    setHumidity('')
    setUniformity('')
    setNotes('')
    setSelectedSigns([])
    setDailyError('')
    setFeedAllocations([{ id: `feed-${Date.now()}`, time: '08:00', itemId: '', quantityTon: '', pricePerTon: '' }])
  }

  const dailySheetMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFlock) {
        throw new Error('يرجى اختيار فوج نشط قبل الحفظ')
      }

      if (dailyFeedTotalTon <= 0) {
        throw new Error('كمية العلف اليومية مطلوبة ويجب أن تكون أكبر من صفر')
      }

      const firstAllocation = feedAllocations.find((row) => parseNumeric(row.quantityTon) > 0)
      const feedBatches = feedAllocations
        .filter((row) => parseNumeric(row.quantityTon) > 0)
        .map((row) => {
          const quantityTon = Number(parseNumeric(row.quantityTon).toFixed(3))
          const pricePerTon = Math.max(0, parseNumeric(row.pricePerTon))
          return {
            log_time: row.time || null,
            feed_type: activeStockItems.find((stockItem) => String(stockItem.id) === row.itemId)?.name ?? 'علف تشغيلي',
            quantity_ton: quantityTon,
            quantity_kg: Number((quantityTon * 1000).toFixed(2)),
            price_per_ton: pricePerTon,
            amount: Number((quantityTon * pricePerTon).toFixed(2)),
            item_id: row.itemId ? Number(row.itemId) : undefined,
            inventory_item_id: row.itemId ? Number(row.itemId) : undefined,
          }
        })
      const feedQuantityKg = Number((dailyFeedTotalTon * 1000).toFixed(3))
      const observation = [
        `مياه: ${waterConsumption || 'غير مدخل'} لتر`,
        `حرارة: ${temperature || 'غير مدخل'} °م`,
        `رطوبة: ${humidity || 'غير مدخل'}%`,
        `انتظام الوزن: ${uniformity || 'غير مدخل'}%`,
        `العلامات السريرية: ${selectedSigns.length > 0 ? selectedSigns.join('، ') : 'لا يوجد'}`,
        `توزيع العلف: ${feedAllocations
          .filter((row) => parseNumeric(row.quantityTon) > 0)
          .map((row) => {
            const item = activeStockItems.find((stockItem) => String(stockItem.id) === row.itemId)
            return `${row.time || 'بدون وقت'} / ${item?.name ?? 'غير محدد'} / ${row.quantityTon} طن`
          })
          .join(' | ')}`,
        notes ? `ملاحظات: ${notes}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      if (selectedFlock.flock_type === 'production') {
        return dailyOpsApi.createProductionEntry(selectedFlock.id, {
          record_date: recordDate,
          mortality: mortalityToday,
          feed_quantity_kg: feedQuantityKg,
          feed_batches: feedBatches,
          feed_rows: feedBatches,
          inventory_item_id: firstAllocation?.itemId ? Number(firstAllocation.itemId) : undefined,
          ai_observation: observation,
        })
      }

      return dailyOpsApi.createBreedingEntry(selectedFlock.id, {
        record_date: recordDate,
        mortality: mortalityToday,
        feed_quantity_kg: feedQuantityKg,
        feed_batches: feedBatches,
        feed_rows: feedBatches,
        item_id: firstAllocation?.itemId ? Number(firstAllocation.itemId) : undefined,
        uniformity_pct: uniformity ? Number(uniformity) : undefined,
        ai_observation: observation,
      })
    },
    onSuccess: () => {
      if (selectedFlock) {
        queryClient.invalidateQueries({ queryKey: ['barn', barnId] })
        queryClient.invalidateQueries({ queryKey: ['flock-summary', selectedFlock.id] })
        queryClient.invalidateQueries({ queryKey: ['barn-daily-ledger', selectedFlock.id] })
      }
      resetDailySheet()
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-action-primary" />
      </div>
    )
  }

  if (!barn) {
    return <div className="py-20 text-center text-ink-muted">العنبر غير موجود.</div>
  }

  const handleAddExpense = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMsg('')

    if (!amount || Number(amount) <= 0) {
      setErrorMsg('يرجى إدخال مبلغ صحيح')
      return
    }

    try {
      await createExpenseMutation.mutateAsync({
        expense_date: expenseDate,
        amount: Number(amount),
        category,
        description,
      })
      setShowAddModal(false)
      setAmount('')
      setDescription('')
      setExpenseDate(isoToday())
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, 'فشل في حفظ المصروف'))
    }
  }

  const handleDeleteBarn = async () => {
    if (confirm('هل أنت متأكد من حذف هذه الحظيرة نهائياً؟ هذا الإجراء سيحذف كافة الأفواج والبيانات المرتبطة بها ولن يمكن التراجع عنه.')) {
      deleteBarnMutation.mutate(barnId)
    }
  }

  const handleImportSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setImportError('')
    if (!importFile) {
      setImportError('الرجاء اختيار ملف إكسل')
      return
    }

    setIsImporting(true)
    try {
      await flockApi.importFlocks(barnId, importFile)
      queryClient.invalidateQueries({ queryKey: ['barn', barnId] })
      setShowImportModal(false)
      setImportFile(null)
    } catch (err: unknown) {
      setImportError(getErrorMessage(err, 'فشل في استيراد الملف'))
    } finally {
      setIsImporting(false)
    }
  }

  const handleDeleteFlock = async (flockId: number) => {
    if (confirm('هل أنت متأكد من حذف هذا القطيع؟')) {
      try {
        await flockApi.deleteFlock(flockId)
        queryClient.invalidateQueries({ queryKey: ['barn', barnId] })
      } catch {
        alert('حدث خطأ أثناء الحذف')
      }
    }
  }

  const handleDailySheetSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setDailyError('')
    dailySheetMutation.mutate(undefined, {
      onError: (error) => setDailyError(error instanceof Error ? error.message : 'فشل في حفظ البيان اليومي'),
    })
  }

  const toggleClinicalSign = (sign: string) => {
    setSelectedSigns((current) =>
      current.includes(sign) ? current.filter((item) => item !== sign) : [...current, sign]
    )
  }

  const addFeedAllocation = () => {
    setFeedAllocations((current) => [
      ...current,
      {
        id: `feed-${Date.now()}-${current.length}`,
        time: '',
        itemId: '',
        quantityTon: '',
        pricePerTon: '',
      },
    ])
  }

  const updateFeedAllocation = (id: string, key: keyof FeedAllocation, value: string) => {
    setFeedAllocations((current) =>
      current.map((row) => (row.id === id ? { ...row, [key]: value } : row))
    )
  }

  const removeFeedAllocation = (id: string) => {
    setFeedAllocations((current) =>
      current.length === 1 ? current : current.filter((row) => row.id !== id)
    )
  }

  const deleteFlockWithoutConfirm = async (flockId: number) => {
    try {
      await flockApi.deleteFlock(flockId)
      queryClient.invalidateQueries({ queryKey: ['barn', barnId] })
    } catch {
      alert('حدث خطأ أثناء الحذف')
    }
  }

  const breedingRows: FlockLedgerRow[] = allFlocks.map((flock) => {
    const summary = summariesByFlock.get(flock.id)
    const chickCost = parseNumeric(flock.chick_unit_cost) * flock.entry_birds
    const feedCost = (summary?.total_feed_kg ?? 0) * 1.25
    const vetCost = (medicalRecordsByFlock.get(flock.id) ?? []).length * 0
    const otherCost = (flockExpensesByFlock.get(flock.id) ?? []).reduce(
      (total, expense) => total + parseNumeric(expense.amount),
      0
    )
    const totalValue = chickCost + feedCost + vetCost + otherCost
    return {
      flock,
      chickCost,
      feedCost,
      vetCost,
      otherCost,
      totalValue,
      birdValue: flock.current_count > 0 ? totalValue / flock.current_count : 0,
    }
  })

  const breedingSummary = breedingRows.reduce(
    (total, row) => ({
      entryBirds: total.entryBirds + row.flock.entry_birds,
      chickCost: total.chickCost + row.chickCost,
      feedCost: total.feedCost + row.feedCost,
      vetCost: total.vetCost + row.vetCost,
      otherCost: total.otherCost + row.otherCost,
      totalValue: total.totalValue + row.totalValue,
      currentBirds: total.currentBirds + row.flock.current_count,
    }),
    { entryBirds: 0, chickCost: 0, feedCost: 0, vetCost: 0, otherCost: 0, totalValue: 0, currentBirds: 0 }
  )

  const medicineRows: MedicineRow[] = allFlocks.flatMap((flock): MedicineRow[] =>
    (medicalRecordsByFlock.get(flock.id) ?? []).flatMap((record): MedicineRow[] =>
      record.medications.length > 0
        ? record.medications.map((medication): MedicineRow => ({
            flock,
            record,
            medication,
          }))
        : [
            {
              flock,
              record,
              medication: null,
            },
          ]
    )
  )

  const otherRows = [
    ...expenses.map((expense) => ({
      id: `barn-${expense.id}`,
      date: expense.expense_date,
      name: expense.description || expense.category,
      type: `مصروف حظيرة / ${expense.category}`,
      quantity: '—',
      amount: parseNumeric(expense.amount),
      source: 'barn',
    })),
    ...allFlocks.flatMap((flock) =>
      (flockExpensesByFlock.get(flock.id) ?? []).map((expense) => ({
        id: `flock-${flock.id}-${expense.id}`,
        date: expense.expense_date,
        name: expense.description || expense.category,
        type: `فوج ${flockCode(flock)} / ${expense.category}`,
        quantity: '—',
        amount: parseNumeric(expense.amount),
        source: 'flock',
      }))
    ),
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <Link href="/companies" className="transition-colors hover:text-action-primary">
                الشركات
              </Link>
              <ChevronRight className="h-4 w-4 opacity-60" />
              {barn.section?.project?.company ? (
                <>
                  <span className="text-ink-soft">{barn.section.project.company.name}</span>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </>
              ) : null}
              {barn.section?.project ? (
                <>
                  <Link
                    href={`/projects/${barn.section.project.id}`}
                    className="transition-colors hover:text-action-primary"
                  >
                    {barn.section.project.project_name}
                  </Link>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </>
              ) : null}
              {barn.section ? (
                <>
                  <Link
                    href={backHref}
                    className="transition-colors hover:text-action-primary"
                  >
                    {barn.section.section_name}
                  </Link>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </>
              ) : null}
              <span className="font-semibold text-ink">{barn.barn_name}</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface-subtle text-action-secondary">
                <Sprout className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-ink">{barn.barn_name}</h1>
                  <span className="rounded-full border border-line bg-surface-muted px-2.5 py-1 text-xs font-bold text-ink-soft">
                    {typeLabels[barn.barn_type]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  {barn.capacity ? `السعة الاستيعابية: ${formatNumber(barn.capacity)} طير` : 'السعة غير محددة'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/barns/${barnId}/health-log`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface-muted px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-subtle hover:text-ink"
            >
              <Bot className="h-4 w-4" />
              السجل الصحي والتحليل
            </Link>
            <button
              onClick={handleDeleteBarn}
              disabled={deleteBarnMutation.isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-danger-soft bg-danger-soft px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft/70 disabled:opacity-60"
            >
              {deleteBarnMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              حذف الحظيرة
            </button>
          </div>
        </div>
      </section>

      <FlockCardsGrid
        flocks={allFlocks}
        rows={breedingRows}
        summariesByFlock={summariesByFlock}
        onDeleteFlock={deleteFlockWithoutConfirm}
      />

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {operationsTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeOperationsTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveOperationsTab(tab.key)}
                className={`relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-action-primary text-ink-inverse'
                    : 'bg-surface-muted text-ink-soft hover:bg-surface-subtle hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="mt-5">
          {activeOperationsTab === 'breeding' ? (
            <BreedingLedgerTable rows={breedingRows} summary={breedingSummary} />
          ) : null}

          {activeOperationsTab === 'entries' ? (
            <FlockEntrySummary
              flocks={filteredFlocks}
              allFlocksCount={allFlocks.length}
              flockFilter={flockFilter}
              setFlockFilter={setFlockFilter}
              barnId={barnId}
              onImport={() => setShowImportModal(true)}
              onDeleteFlock={handleDeleteFlock}
            />
          ) : null}

          {activeOperationsTab === 'mortality' ? (
            <MortalityAccordion
              flocks={allFlocks}
              entriesByFlock={dailyEntriesByFlock}
              summariesByFlock={summariesByFlock}
              expandedFlocks={expandedFlocks}
              setExpandedFlocks={setExpandedFlocks}
            />
          ) : null}

          {activeOperationsTab === 'feed' ? (
            <FeedLedgerTable flocks={allFlocks} entriesByFlock={dailyEntriesByFlock} stockItems={activeStockItems} />
          ) : null}

          {activeOperationsTab === 'medicine' ? (
            <MedicineLedgerTable rows={medicineRows} />
          ) : null}

          {activeOperationsTab === 'other' ? (
            <OtherLedgerTable
              rows={otherRows}
              isLoading={isExpensesLoading}
              onAddExpense={() => setShowAddModal(true)}
            />
          ) : null}
        </div>
      </section>

      <SmartDailySheet
        activeFlocks={activeFlocks}
        selectedFlock={selectedFlock}
        selectedFlockId={selectedFlockId}
        setSelectedFlockId={setSelectedFlockId}
        recordDate={recordDate}
        setRecordDate={setRecordDate}
        selectedEntryBirds={selectedEntryBirds}
        previousBirdCount={selectedPreviousBirdCount}
        currentBirdsAfterMortality={currentBirdsAfterMortality}
        mortalityToday={dailyMortality}
        setMortalityToday={setDailyMortality}
        mortalityValueToday={mortalityValueToday}
        totalMortalityCount={totalMortalityCount}
        totalMortalityValue={totalMortalityValue}
        feedAllocations={feedAllocations}
        addFeedAllocation={addFeedAllocation}
        updateFeedAllocation={updateFeedAllocation}
        removeFeedAllocation={removeFeedAllocation}
        activeStockItems={activeStockItems}
        dailyFeedTotalTon={dailyFeedTotalTon}
        dailyFeedTotalCost={dailyFeedTotalCost}
        waterConsumption={waterConsumption}
        setWaterConsumption={setWaterConsumption}
        temperature={temperature}
        setTemperature={setTemperature}
        humidity={humidity}
        setHumidity={setHumidity}
        uniformity={uniformity}
        setUniformity={setUniformity}
        selectedSigns={selectedSigns}
        toggleClinicalSign={toggleClinicalSign}
        notes={notes}
        setNotes={setNotes}
        dailyError={dailyError}
        isSaving={dailySheetMutation.isPending}
        onSubmit={handleDailySheetSubmit}
        onReset={resetDailySheet}
      />

      {showAddModal ? (
        <AppDialog open={showAddModal} onClose={() => setShowAddModal(false)} panelClassName="max-w-md animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full space-y-6 rounded-3xl bg-surface p-6 shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute left-4 top-4 rounded-lg p-2 text-ink-muted transition-colors hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-success-soft bg-success-soft p-3 text-success-strong">
                <SaudiRiyalIcon size={24} className="text-success-strong" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">إضافة مصروف حظيرة</h3>
                <p className="text-xs text-ink-muted">سيتم تدوينه في السجل المالي للحظيرة</p>
              </div>
            </div>

            {errorMsg ? (
              <div className="rounded-xl bg-danger-soft p-4 text-sm font-medium text-danger">
                {errorMsg}
              </div>
            ) : null}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <FormField label="التاريخ">
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(event) => setExpenseDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-surface-muted px-4 text-sm text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
              </FormField>

              <FormField label="المبلغ">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-surface-muted px-4 text-left text-sm font-bold text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
              </FormField>

              <FormField label="الفئة">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-surface-muted px-4 text-sm font-semibold text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  <option value="صيانة">صيانة</option>
                  <option value="كهرباء">كهرباء</option>
                  <option value="مياه">مياه</option>
                  <option value="تعقيم وتجهيز">تعقيم وتجهيز</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </FormField>

              <FormField label="الوصف والتفاصيل">
                <textarea
                  rows={3}
                  placeholder="اكتب تفاصيل المصروف هنا..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full resize-none rounded-xl border border-line bg-surface-muted px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
              </FormField>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-11 flex-1 rounded-xl bg-surface-muted px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-subtle"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-action-primary px-4 py-2 text-sm font-semibold text-ink-inverse transition-colors hover:bg-action-primary-hover disabled:opacity-60"
                >
                  {createExpenseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ المصروف'}
                </button>
              </div>
            </form>
          </div>
        </AppDialog>
      ) : null}

      {showImportModal ? (
        <AppDialog open={showImportModal} onClose={() => setShowImportModal(false)} panelClassName="max-w-md animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full space-y-6 rounded-3xl bg-surface p-6 shadow-2xl">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute left-4 top-4 rounded-lg p-2 text-ink-muted transition-colors hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-info-soft bg-info-soft p-3 text-info">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">استيراد أفواج</h3>
                <p className="text-xs text-ink-muted">ارفع ملف إكسل يحتوي على بيانات الأفواج</p>
              </div>
            </div>

            {importError ? (
              <div className="flex items-center gap-2 rounded-xl bg-danger-soft p-4 text-sm font-medium text-danger">
                <ShieldAlert className="h-5 w-5" />
                {importError}
              </div>
            ) : null}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="rounded-2xl border-2 border-dashed border-line-strong p-8 text-center transition-colors hover:bg-surface-muted">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                  className="hidden"
                  id="flock-import-file"
                />
                <label htmlFor="flock-import-file" className="flex cursor-pointer flex-col items-center gap-3">
                  <FileText className="h-10 w-10 text-ink-muted" />
                  <span className="text-sm font-semibold text-action-primary">اختر ملف إكسل (.xlsx, .csv)</span>
                  {importFile ? <span className="text-xs font-medium text-success">{importFile.name}</span> : null}
                </label>
              </div>

              <div className="flex justify-center">
                <a href="#" className="inline-flex items-center gap-1 text-xs text-ink-muted underline transition-colors hover:text-action-primary">
                  <Download className="h-3.5 w-3.5" />
                  تحميل النموذج المعتمد
                </a>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="min-h-11 flex-1 rounded-xl bg-surface-muted px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-subtle"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !importFile}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-action-primary px-4 py-2 text-sm font-semibold text-ink-inverse transition-colors hover:bg-action-primary-hover disabled:opacity-60"
                >
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'استيراد'}
                </button>
              </div>
            </form>
          </div>
        </AppDialog>
      ) : null}
    </div>
  )
}

function FlockCardsGrid({
  flocks,
  rows,
  summariesByFlock,
  onDeleteFlock,
}: {
  flocks: Flock[]
  rows: FlockLedgerRow[]
  summariesByFlock: Map<number, FlockSummary>
  onDeleteFlock: (flockId: number) => Promise<void>
}) {
  const [deleteConfirmFlockId, setDeleteConfirmFlockId] = useState<number | null>(null)
  const valueByFlock = useMemo(
    () => new Map(rows.map((row) => [row.flock.id, row.totalValue])),
    [rows]
  )

  if (flocks.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-line-strong bg-surface-subtle p-8 text-center">
        <Sprout className="mx-auto h-10 w-10 text-ink-muted" />
        <h2 className="mt-3 text-base font-bold text-ink">لا توجد أفواج مرتبطة بهذه الحظيرة</h2>
        <p className="mt-1 text-sm text-ink-muted">يمكن إضافة أو استيراد الأفواج من تبويب ملخص دخول الأفواج.</p>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">كروت الأفواج</h2>
          <p className="text-sm text-ink-muted">نظرة تشغيلية سريعة على الأفواج المرتبطة بهذه الحظيرة.</p>
        </div>
        <span className="rounded-full border border-line bg-surface-muted px-3 py-1 text-xs font-bold text-ink-soft">
          {formatNumber(flocks.length)} فوج
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {flocks.map((flock) => {
          const summary = summariesByFlock.get(flock.id)
          const isActive = flock.status === 'active' || !flock.status
          const isConfirmingDelete = deleteConfirmFlockId === flock.id
          const totalFeedTon = (summary?.total_feed_kg ?? 0) / 1000
          const flockValue = valueByFlock.get(flock.id) ?? parseNumeric(flock.chick_unit_cost) * flock.entry_birds

          return (
            <article
              key={flock.id}
              className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-sm ring-1 ring-line/60 transition-colors hover:border-line-strong hover:bg-surface-subtle"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/flocks/${flock.id}`}
                      className="truncate text-lg font-bold text-ink transition-colors hover:text-action-primary"
                    >
                      فوج {flockCode(flock)}
                    </Link>
                    <FlockCardStatusBadge status={flock.status} />
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                    <Calendar className="h-3.5 w-3.5" />
                    تاريخ الدخول: {toDisplayDate(flock.entry_date)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 rounded-xl border border-line bg-surface-muted p-1">
                  <Link
                    href={`/flocks/${flock.id}/edit`}
                    title="تحديث البيانات"
                    aria-label="تحديث البيانات"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface hover:text-action-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmFlockId(flock.id)}
                    title="حذف"
                    aria-label="حذف"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <FlockCardInfo label="السلالة" value={flock.breed || 'غير محددة'} />
                <FlockCardInfo label="المورد" value={flock.supplier || 'غير محدد'} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-surface-muted px-3 py-2">
                  <p className="text-xs font-bold text-ink-muted">إجمالي العلف</p>
                  <p className="mt-1 font-mono text-base font-bold text-ink">{formatNumber(totalFeedTon, 3)} طن</p>
                </div>
                <div className="rounded-xl border border-line bg-surface-muted px-3 py-2">
                  <p className="text-xs font-bold text-ink-muted">قيمة الفوج</p>
                  <p className="mt-1 font-mono text-base font-bold text-action-primary">{formatCurrency(flockValue)}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                <div className="text-xs text-ink-muted">
                  <span className="font-bold text-ink">{formatNumber(flock.current_count)}</span>
                  <span className="mx-1">/</span>
                  <span>{formatNumber(flock.entry_birds)} طير</span>
                </div>
                <span className="rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-bold text-ink-soft">
                  {typeLabels[flock.flock_type]}
                </span>
              </div>

              {isConfirmingDelete ? (
                <div className="absolute inset-x-3 bottom-3 rounded-xl border border-danger-soft bg-surface p-3 shadow-lg">
                  <p className="text-xs font-bold text-danger">تأكيد حذف الفوج {flockCode(flock)}؟</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await onDeleteFlock(flock.id)
                        setDeleteConfirmFlockId(null)
                      }}
                      className="min-h-9 flex-1 rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-ink-inverse transition-colors hover:bg-danger-strong"
                    >
                      تأكيد الحذف
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmFlockId(null)}
                      className="min-h-9 flex-1 rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:bg-surface-subtle"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : null}

              {isActive ? (
                <span className="pointer-events-none absolute -left-12 top-6 h-16 w-16 rounded-full bg-success/10 blur-2xl" />
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function FlockCardStatusBadge({ status }: { status: Flock['status'] }) {
  const isActive = status === 'active' || !status
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-success-soft bg-success-soft px-2.5 py-1 text-xs font-bold text-success-strong shadow-[0_0_0_4px_rgba(22,163,74,0.10)]">
        <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_12px_rgba(22,163,74,0.55)]" />
        نشط
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-muted px-2.5 py-1 text-xs font-bold text-ink-muted">
      <span className="h-2 w-2 rounded-full bg-ink-muted" />
      {statusLabels[status] ?? 'مغلق'}
    </span>
  )
}

function FlockCardInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-subtle px-3 py-2">
      <p className="text-xs font-bold text-ink-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

function BreedingLedgerTable({
  rows,
  summary,
}: {
  rows: FlockLedgerRow[]
  summary: {
    entryBirds: number
    chickCost: number
    feedCost: number
    vetCost: number
    otherCost: number
    totalValue: number
    currentBirds: number
  }
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-right text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-muted text-xs font-bold text-ink-soft">
              {['رقم الفوج', 'تاريخ دخول التربية', 'الداخل للتربية', 'قيمة الصوص', 'قيمة الأعلاف', 'قيمة البيطرة', 'قيمة أخرى', 'قيمة الفوج', 'قيمة الطير'].map((column) => (
                <th key={column} className="px-4 py-3">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-ink-muted">
                  لا توجد أفواج مسجلة لهذه الحظيرة.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.flock.id} className="transition-colors hover:bg-surface-subtle">
                  <td className="px-4 py-3 font-mono font-semibold text-ink">{flockCode(row.flock)}</td>
                  <td className="px-4 py-3 text-ink-soft">{toDisplayDate(row.flock.entry_date)}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatNumber(row.flock.entry_birds)}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatCurrency(row.chickCost)}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatCurrency(row.feedCost)}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatCurrency(row.vetCost)}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatCurrency(row.otherCost)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-ink">{formatCurrency(row.totalValue)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-action-primary">{formatCurrency(row.birdValue)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-line-strong bg-surface-subtle text-sm font-bold text-ink">
              <td className="px-4 py-4">الإجمالي</td>
              <td className="px-4 py-4">—</td>
              <td className="px-4 py-4 font-mono">{formatNumber(summary.entryBirds)}</td>
              <td className="px-4 py-4 font-mono">{formatCurrency(summary.chickCost)}</td>
              <td className="px-4 py-4 font-mono">{formatCurrency(summary.feedCost)}</td>
              <td className="px-4 py-4 font-mono">{formatCurrency(summary.vetCost)}</td>
              <td className="px-4 py-4 font-mono">{formatCurrency(summary.otherCost)}</td>
              <td className="px-4 py-4 font-mono text-action-primary">{formatCurrency(summary.totalValue)}</td>
              <td className="px-4 py-4 font-mono text-action-primary">
                {formatCurrency(summary.currentBirds > 0 ? summary.totalValue / summary.currentBirds : 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function FlockEntrySummary({
  flocks,
  allFlocksCount,
  flockFilter,
  setFlockFilter,
  barnId,
  onImport,
  onDeleteFlock,
}: {
  flocks: Flock[]
  allFlocksCount: number
  flockFilter: 'all' | 'active' | 'completed'
  setFlockFilter: (filter: 'all' | 'active' | 'completed') => void
  barnId: number
  onImport: () => void
  onDeleteFlock: (flockId: number) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            ['all', 'الكل'],
            ['active', 'النشطة'],
            ['completed', 'المغلقة'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFlockFilter(key as 'all' | 'active' | 'completed')}
              className={`min-h-10 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                flockFilter === key
                  ? 'bg-action-secondary text-ink-inverse'
                  : 'bg-surface-muted text-ink-soft hover:bg-surface-subtle hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onImport}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface-muted px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-subtle"
          >
            <Upload className="h-4 w-4" />
            استيراد أفواج
          </button>
          <Link
            href={`/flocks/new?barn_id=${barnId}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action-primary px-4 py-2 text-sm font-semibold text-ink-inverse transition-colors hover:bg-action-primary-hover"
          >
            <Plus className="h-4 w-4" />
            إضافة فوج
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-right text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-muted text-xs font-bold text-ink-soft">
                {['رقم الفوج', 'تاريخ الدخول', 'عدد الداخل', 'قيمة الفوج', 'المورد', 'السلالة', 'إجراءات (إغلاق الفوج)'].map((column) => (
                  <th key={column} className="px-4 py-3">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {flocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-muted">
                    لا توجد أفواج {allFlocksCount === 0 ? 'مسجلة' : 'مطابقة للتصفية الحالية'}.
                  </td>
                </tr>
              ) : (
                flocks.map((flock) => {
                  const flockValue = parseNumeric(flock.chick_unit_cost) * flock.entry_birds
                  return (
                    <tr key={flock.id} className="transition-colors hover:bg-surface-subtle">
                      <td className="px-4 py-3">
                        <Link href={`/flocks/${flock.id}`} className="font-mono font-bold text-action-primary transition-colors hover:text-action-primary-hover">
                          {flockCode(flock)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{toDisplayDate(flock.entry_date)}</td>
                      <td className="px-4 py-3 font-mono text-ink">{formatNumber(flock.entry_birds)}</td>
                      <td className="px-4 py-3 font-mono text-ink">{formatCurrency(flockValue)}</td>
                      <td className="px-4 py-3 text-ink-soft">{flock.supplier || '—'}</td>
                      <td className="px-4 py-3 text-ink-soft">{flock.breed || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusColors[flock.status] ?? statusColors.active}`}>
                            {statusLabels[flock.status] ?? 'نشط'}
                          </span>
                          {flock.status === 'active' || !flock.status ? (
                            <Link
                              href={`/flocks/${flock.id}/closure`}
                              className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-warning-soft bg-warning-soft px-3 py-1 text-xs font-bold text-warning-strong transition-colors hover:bg-warning-soft/70"
                            >
                              <PowerOff className="h-3.5 w-3.5" />
                              إغلاق الفوج
                            </Link>
                          ) : null}
                          <details className="relative">
                            <summary className="list-none rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink">
                              <MoreVertical className="h-4 w-4" />
                            </summary>
                            <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-line bg-surface py-1 shadow-xl">
                              <Link href={`/flocks/${flock.id}/edit`} className="flex items-center gap-2 px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink">
                                <Edit className="h-4 w-4" />
                                تعديل البيانات
                              </Link>
                              <button
                                onClick={() => onDeleteFlock(flock.id)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-right text-sm text-danger transition-colors hover:bg-danger-soft"
                              >
                                <Trash2 className="h-4 w-4" />
                                حذف الفوج
                              </button>
                            </div>
                          </details>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MortalityAccordion({
  flocks,
  entriesByFlock,
  summariesByFlock,
  expandedFlocks,
  setExpandedFlocks,
}: {
  flocks: Flock[]
  entriesByFlock: Map<number, DailyEntry[]>
  summariesByFlock: Map<number, FlockSummary>
  expandedFlocks: Record<number, boolean>
  setExpandedFlocks: React.Dispatch<React.SetStateAction<Record<number, boolean>>>
}) {
  if (flocks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-surface-subtle py-12 text-center text-sm text-ink-muted">
        لا توجد أفواج لعرض سجلات النافق.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {flocks.map((flock, index) => {
        const isExpanded = expandedFlocks[flock.id] ?? index === 0
        const entries = entriesByFlock.get(flock.id) ?? []
        const cumulativeMortality = summariesByFlock.get(flock.id)?.cumulative_mortality ?? 0
        return (
          <article key={flock.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <button
              onClick={() =>
                setExpandedFlocks((current) => ({
                  ...current,
                  [flock.id]: !isExpanded,
                }))
              }
              className="flex w-full items-center justify-between gap-4 bg-surface-muted px-4 py-3 text-right transition-colors hover:bg-surface-subtle"
            >
              <div>
                <p className="text-sm font-bold text-ink">فوج {flockCode(flock)}</p>
                <p className="text-xs text-ink-muted">
                  {formatNumber(entries.length)} سجل، النافق التراكمي {formatNumber(cumulativeMortality)}
                </p>
              </div>
              <ChevronDown className={`h-5 w-5 text-ink-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-right text-sm">
                  <thead>
                    <tr className="border-y border-line bg-surface-subtle text-xs font-bold text-ink-soft">
                      {['التاريخ', 'العمر / باليوم', 'الأسبوع', 'العدد الحالي', 'النافق', 'نسبة النافق', 'قيمة النافق', 'النافق تراكمي', 'نسبة النافق التراكمي'].map((column) => (
                        <th key={column} className="px-4 py-3">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-sm text-ink-muted">
                          لا توجد سجلات نافق لهذا الفوج.
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry, entryIndex) => {
                        const cumulative = entries
                          .slice(entryIndex)
                          .reduce((total, item) => total + parseNumeric(item.mortality), 0)
                        const mortalityRate = entry.bird_count > 0 ? (parseNumeric(entry.mortality) / entry.bird_count) * 100 : 0
                        const cumulativeRate = flock.entry_birds > 0 ? (cumulative / flock.entry_birds) * 100 : 0
                        return (
                          <tr key={entry.id} className="transition-colors hover:bg-surface-subtle">
                            <td className="px-4 py-3 font-mono text-ink">{toDisplayDate(entry.record_date)}</td>
                            <td className="px-4 py-3 font-mono text-ink">{formatNumber(entry.age_days)}</td>
                            <td className="px-4 py-3 font-mono text-ink">{formatNumber('week_number' in entry ? entry.week_number : Math.max(1, Math.ceil((entry.age_days + 1) / 7)))}</td>
                            <td className="px-4 py-3 font-mono text-ink">{formatNumber(entry.bird_count)}</td>
                            <td className="px-4 py-3 font-mono font-bold text-danger">{formatNumber(parseNumeric(entry.mortality))}</td>
                            <td className="px-4 py-3 font-mono text-ink">{formatNumber(mortalityRate, 2)}%</td>
                            <td className="px-4 py-3 font-mono text-ink">{formatCurrency(parseNumeric(entry.mortality) * parseNumeric(flock.chick_unit_cost))}</td>
                            <td className="px-4 py-3 font-mono font-bold text-ink">{formatNumber(cumulative)}</td>
                            <td className="px-4 py-3 font-mono font-bold text-action-primary">{formatNumber(cumulativeRate, 2)}%</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

function FeedLedgerTable({
  flocks,
  entriesByFlock,
  stockItems,
}: {
  flocks: Flock[]
  entriesByFlock: Map<number, DailyEntry[]>
  stockItems: Item[]
}) {
  const rows = flocks.flatMap((flock) =>
    (entriesByFlock.get(flock.id) ?? []).flatMap((entry) => getEntryFeedBatches(flock, entry))
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-right text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-muted text-xs font-bold text-ink-soft">
              {['رقم الفوج', 'التاريخ', 'الوقت', 'العمر (يوم)', 'الأسبوع', 'نوع العلف', 'الكمية (طن)', 'الكمية (كجم)', 'السعر / طن', 'المبلغ'].map((column) => (
                <th key={column} className="px-4 py-3">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-ink-muted">
                  لا توجد سجلات أعلاف مسجلة بعد.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const itemName = stockItems.find((item) => item.id === row.itemId)?.name ?? row.feedType
                return (
                  <tr key={row.id} className="transition-colors hover:bg-surface-subtle">
                    <td className="px-4 py-3">
                      <Link href={`/flocks/${row.flock.id}`} className="inline-flex rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1 font-mono text-xs font-bold text-[#c2410c] transition-colors hover:bg-orange-100">
                        {flockCode(row.flock)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-ink">{toDisplayDate(row.entry.record_date)}</td>
                    <td className="px-4 py-3 font-mono text-ink">{row.logTime ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-ink">{formatNumber(row.entry.age_days)}</td>
                    <td className="px-4 py-3 font-mono text-ink">{formatNumber('week_number' in row.entry ? row.entry.week_number : Math.max(1, Math.ceil((row.entry.age_days + 1) / 7)))}</td>
                    <td className="px-4 py-3 text-ink-soft">{itemName}</td>
                    <td className="px-4 py-3 font-mono font-bold text-ink">{formatNumber(row.quantityTon, 3)}</td>
                    <td className="px-4 py-3 font-mono text-ink">{formatNumber(row.quantityKg, 2)}</td>
                    <td className="px-4 py-3 font-mono text-ink-muted">{row.pricePerTon > 0 ? formatCurrency(row.pricePerTon) : '—'}</td>
                    <td className="px-4 py-3 font-mono text-emerald-700">{row.amount > 0 ? formatCurrency(row.amount) : '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MedicineLedgerTable({
  rows,
}: {
  rows: MedicineRow[]
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-right text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-muted text-xs font-bold text-ink-soft">
              {['التاريخ', 'الاسم', 'النوع', 'العدد', 'المبلغ'].map((column) => (
                <th key={column} className="px-4 py-3">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-muted">
                  لا توجد سجلات أدوية مسجلة.
                </td>
              </tr>
            ) : (
              rows.map(({ flock, record, medication }) => (
                <tr key={`${record.id}-${medication?.id ?? 'case'}`} className="transition-colors hover:bg-surface-subtle">
                  <td className="px-4 py-3 font-mono text-ink">{toDisplayDate(record.record_date)}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{medication?.medicine_name || record.diagnosis || 'حالة طبية'}</td>
                  <td className="px-4 py-3 text-ink-soft">{medication?.method_of_administration || record.severity || `فوج ${flockCode(flock)}`}</td>
                  <td className="px-4 py-3 font-mono text-ink">{medication?.quantity != null ? formatNumber(medication.quantity, 2) : '—'}</td>
                  <td className="px-4 py-3 font-mono text-ink-muted">—</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OtherLedgerTable({
  rows,
  isLoading,
  onAddExpense,
}: {
  rows: { id: string; date: string; name: string; type: string; quantity: string; amount: number; source: string }[]
  isLoading: boolean
  onAddExpense: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onAddExpense}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action-primary px-4 py-2 text-sm font-semibold text-ink-inverse transition-colors hover:bg-action-primary-hover"
        >
          <Plus className="h-4 w-4" />
          إضافة بند آخر
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-muted text-xs font-bold text-ink-soft">
                {['التاريخ', 'اسم البند', 'النوع', 'الكمية', 'المبلغ'].map((column) => (
                  <th key={column} className="px-4 py-3">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-action-primary" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-muted">
                    لا توجد سجلات أخرى.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-surface-subtle">
                    <td className="px-4 py-3 font-mono text-ink">{toDisplayDate(row.date)}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{row.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{row.type}</td>
                    <td className="px-4 py-3 font-mono text-ink-muted">{row.quantity}</td>
                    <td className="px-4 py-3 font-mono font-bold text-ink">{formatCurrency(row.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SmartDailySheet({
  activeFlocks,
  selectedFlock,
  selectedFlockId,
  setSelectedFlockId,
  recordDate,
  setRecordDate,
  selectedEntryBirds,
  previousBirdCount,
  currentBirdsAfterMortality,
  mortalityToday,
  setMortalityToday,
  mortalityValueToday,
  totalMortalityCount,
  totalMortalityValue,
  feedAllocations,
  addFeedAllocation,
  updateFeedAllocation,
  removeFeedAllocation,
  activeStockItems,
  dailyFeedTotalTon,
  dailyFeedTotalCost,
  waterConsumption,
  setWaterConsumption,
  temperature,
  setTemperature,
  humidity,
  setHumidity,
  uniformity,
  setUniformity,
  selectedSigns,
  toggleClinicalSign,
  notes,
  setNotes,
  dailyError,
  isSaving,
  onSubmit,
  onReset,
}: {
  activeFlocks: Flock[]
  selectedFlock?: Flock
  selectedFlockId: string
  setSelectedFlockId: (value: string) => void
  recordDate: string
  setRecordDate: (value: string) => void
  selectedEntryBirds: number
  previousBirdCount: number
  currentBirdsAfterMortality: number
  mortalityToday: string
  setMortalityToday: (value: string) => void
  mortalityValueToday: number
  totalMortalityCount: number
  totalMortalityValue: number
  feedAllocations: FeedAllocation[]
  addFeedAllocation: () => void
  updateFeedAllocation: (id: string, key: keyof FeedAllocation, value: string) => void
  removeFeedAllocation: (id: string) => void
  activeStockItems: Item[]
  dailyFeedTotalTon: number
  dailyFeedTotalCost: number
  waterConsumption: string
  setWaterConsumption: (value: string) => void
  temperature: string
  setTemperature: (value: string) => void
  humidity: string
  setHumidity: (value: string) => void
  uniformity: string
  setUniformity: (value: string) => void
  selectedSigns: string[]
  toggleClinicalSign: (sign: string) => void
  notes: string
  setNotes: (value: string) => void
  dailyError: string
  isSaving: boolean
  onSubmit: (event: React.FormEvent) => void
  onReset: () => void
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-4 shadow-sm lg:p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">البيان اليومي الذكي</h2>
          <p className="mt-1 text-sm text-ink-muted">إدخال موحد للنافق، العلف، العوامل البيئية، والملاحظات السريرية.</p>
        </div>
        {dailyError ? (
          <div className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
            {dailyError}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4">
        <section className="rounded-2xl border border-line bg-surface-subtle p-4">
          <SectionTitle icon={ClipboardList} label="Identity" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <FormField label="اختر الفوج">
              <select
                value={selectedFlockId}
                onChange={(event) => setSelectedFlockId(event.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                {activeFlocks.length === 0 ? (
                  <option value="">لا توجد أفواج نشطة</option>
                ) : (
                  activeFlocks.map((flock) => (
                    <option key={flock.id} value={flock.id}>
                      فوج {flockCode(flock)}، {typeLabels[flock.flock_type]}
                    </option>
                  ))
                )}
              </select>
            </FormField>
            <FormField label="التاريخ">
              <input
                type="date"
                value={recordDate}
                max={isoToday()}
                onChange={(event) => setRecordDate(event.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </FormField>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4">
          <SectionTitle icon={Calendar} label="البيانات الأساسية" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <ReadOnlyMetric label="تاريخ اليوم" value={toDisplayDate(recordDate)} />
            <ReadOnlyMetric label="عدد الداخل للفوج" value={formatNumber(selectedEntryBirds)} />
            <ReadOnlyMetric label="عدد الدجاج السابق" value={formatNumber(previousBirdCount)} />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4">
          <SectionTitle icon={HeartPulse} label="بيانات النافق" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <FormField label="النافق اليومي">
              <input
                type="number"
                min="0"
                step="1"
                value={mortalityToday}
                onChange={(event) => setMortalityToday(event.target.value)}
                placeholder="0"
                className="h-11 w-full rounded-xl border border-line bg-surface-muted px-4 text-left text-sm font-bold text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </FormField>
            <ReadOnlyMetric label="عدد الدجاج الحالي" value={formatNumber(currentBirdsAfterMortality)} tone="success" />
            <ReadOnlyMetric
              label="قيمة النافق اليومي"
              value={
                <span className="flex items-center gap-1 font-sans justify-end">
                  <span>{formatCurrency(mortalityValueToday)}</span>
                  <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" />
                </span>
              }
              tone="warning"
            />
          </div>
          <div className="mt-4 grid gap-3 rounded-xl border border-line bg-surface-subtle p-3 md:grid-cols-2">
            <ReadOnlyMetric label="إجماليات النافق للفوج: إجمالي العدد" value={formatNumber(totalMortalityCount)} />
            <ReadOnlyMetric
              label="إجماليات النافق للفوج: إجمالي القيمة"
              value={
                <span className="flex items-center gap-1 font-sans justify-end">
                  <span>{formatCurrency(totalMortalityValue)}</span>
                  <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" />
                </span>
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <SectionTitle icon={Wheat} label="استهلاك العلف" />
            <button
              type="button"
              onClick={addFeedAllocation}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-action-secondary px-4 py-2 text-sm font-semibold text-ink-inverse transition-colors hover:bg-action-secondary-hover"
            >
              <Plus className="h-4 w-4" />
              زر إضافة
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {feedAllocations.map((row) => (
              <div key={row.id} className="grid gap-3 rounded-xl border border-line bg-surface-subtle p-3 lg:grid-cols-[130px_minmax(180px,1fr)_140px_140px_44px]">
                <FormField label="الوقت">
                  <input
                    type="time"
                    value={row.time}
                    onChange={(event) => updateFeedAllocation(row.id, 'time', event.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </FormField>
                <FormField label="نوع العلف">
                  <select
                    value={row.itemId}
                    onChange={(event) => updateFeedAllocation(row.id, 'itemId', event.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
                  >
                    <option value="">اختر من المخزون النشط</option>
                    {activeStockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="الكمية (طن)">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={row.quantityTon}
                    onChange={(event) => updateFeedAllocation(row.id, 'quantityTon', event.target.value)}
                    placeholder="0.000"
                    className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-left text-sm font-bold text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </FormField>
                <FormField label="السعر/طن">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.pricePerTon}
                    onChange={(event) => updateFeedAllocation(row.id, 'pricePerTon', event.target.value)}
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-left text-sm font-bold text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </FormField>
                <button
                  type="button"
                  onClick={() => removeFeedAllocation(row.id)}
                  className="mt-5 flex h-11 w-11 items-center justify-center rounded-xl border border-danger-soft bg-danger-soft text-danger transition-colors hover:bg-danger-soft/70"
                  aria-label="حذف تخصيص علف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 rounded-xl border border-line-strong bg-surface-muted p-3 md:grid-cols-2">
            <ReadOnlyMetric label="الإجمالي اليومي بالطن" value={formatNumber(dailyFeedTotalTon, 3)} tone="success" />
            <ReadOnlyMetric
              label="إجمالي التكلفة"
              value={
                <span className="flex items-center gap-1 font-sans justify-end">
                  <span>{formatCurrency(dailyFeedTotalCost)}</span>
                  <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" />
                </span>
              }
              tone="warning"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4">
          <SectionTitle icon={Thermometer} label="AI Analytics Environmental Factors Grid" />
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <PrecisionInput label="استهلاك المياه (لتر)" value={waterConsumption} onChange={setWaterConsumption} />
            <PrecisionInput label="درجة الحرارة (°م)" value={temperature} onChange={setTemperature} />
            <PrecisionInput label="الرطوبة النسبية (%)" value={humidity} onChange={setHumidity} max={100} />
            <PrecisionInput label="انتظام الوزن (%)" value={uniformity} onChange={setUniformity} max={100} />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4">
          <SectionTitle icon={Stethoscope} label="العلامات السريرية" />
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {clinicalSigns.map((sign) => {
              const isChecked = selectedSigns.includes(sign)
              return (
                <label
                  key={sign}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                    isChecked
                      ? 'border-action-primary bg-surface-subtle text-action-primary'
                      : 'border-line bg-surface-muted text-ink-soft hover:bg-surface-subtle hover:text-ink'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleClinicalSign(sign)}
                    className="h-4 w-4 accent-[var(--action-primary)]"
                  />
                  {sign}
                </label>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-4">
          <SectionTitle icon={FileText} label="Notes & Execution Footer" />
          <div className="mt-4">
            <textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="ملاحظات إضافية"
              className="w-full resize-none rounded-xl border border-line bg-surface-muted px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>
        </section>
      </div>

      <div className="sticky bottom-4 z-10 mt-5 rounded-2xl border border-line-strong bg-surface/95 p-3 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={isSaving || !selectedFlock}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action-primary px-5 py-3 text-sm font-bold text-ink-inverse transition-colors hover:bg-action-primary-hover disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            حفظ البيان اليومي
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface-muted px-5 py-3 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-subtle hover:text-ink"
          >
            <Printer className="h-5 w-5" />
            طباعة
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface-muted px-5 py-3 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-subtle hover:text-ink"
          >
            <RotateCcw className="h-5 w-5" />
            إعادة تعيين
          </button>
        </div>
      </div>
    </form>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted text-action-secondary">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="text-base font-bold text-ink">{label}</h3>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-ink-soft">{label}</span>
      {children}
    </label>
  )
}

function ReadOnlyMetric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: React.ReactNode
  tone?: 'neutral' | 'success' | 'warning'
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success-strong'
      : tone === 'warning'
        ? 'text-warning-strong'
        : 'text-ink'
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-xs font-bold text-ink-muted">{label}</p>
      <p className={`mt-1 font-mono text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}

function PrecisionInput({
  label,
  value,
  onChange,
  max,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  max?: number
}) {
  return (
    <FormField label={label}>
      <input
        type="number"
        min="0"
        max={max}
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0.00"
        className="h-11 w-full rounded-xl border border-line bg-surface-muted px-4 text-left text-sm font-bold text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
      />
    </FormField>
  )
}
