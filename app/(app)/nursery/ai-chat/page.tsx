'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { 
  User, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Send, 
  Paperclip, 
  Mic, 
  MicOff,
  Loader2, 
  Waves, 
  Sprout, 
  AlertCircle, 
  Leaf, 
  Layers3, 
  FileText,
  HelpCircle,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  Activity,
  Copy,
  ChevronDown,
  MapPin,
  BarChart2,
  Menu
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import { apiRequest } from '@/lib/api/client'
import { nurseryManagementApi } from '@/lib/api/nurseryManagement'
import { actionRegistry, actionTitles } from './_lib/actionRegistry'
import { contextHintsFromPath } from './_lib/contextHints'
import { sendNurseryMessageStream } from './_lib/streaming'
import { supportsMediaRecorder, transcribeAudio } from './_lib/voice'
import type { TelemetryEvent } from './_lib/types'
import { useToast } from './_lib/useToast'
import ToastContainer from './_components/Toast'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
type KnownActionType = 'log_irrigation' | 'log_fertilization' | 'log_mortality' | 'transfer_cycle' | 'start_cycle' | 'create_basin' | 'log_procedure'
type ActionEventType = 'action_confirmed' | 'action_failed' | 'action_result'
type IrrigationPeriod = 'morning' | 'evening'
type ActionPayload = Record<string, JsonValue>

// Types based on the backend resources
interface NurseryChat {
  id: number
  title: string
  context_basin_name?: string | null
  context_cycle_name?: string | null
  context_basin_id?: number | null
  context_cycle_id?: number | null
  created_at: string
  updated_at: string
}

interface ChatAttachment {
  name: string
  url: string
  mime_type: string
}

interface NurseryChatMessage {
  id: number
  role: 'user' | 'model' | 'system'
  content: string
  action_proposal?: ActionProposal | null
  attachments: ChatAttachment[] | null
  created_at: string
}

interface InferredContext {
  last_resolved_entities?: {
    basin?: { id?: number | null; name?: string | null }
    cycle?: { id?: number | null; name?: string | null; basin_id?: number | null; basin_name?: string | null }
    inventory_item?: { id?: number | null; name?: string | null; category_name?: string | null }
  }
  pending_intent?: string | null
  pending_slots?: string[]
  last_response_type?: string | null
  last_action_event?: ActionEvent
  weak_context_hints?: Record<string, number>
}

interface ActionProposal {
  status: string
  action: KnownActionType | string
  target?: {
    basin_id?: number | null
    basin_name?: string | null
    cycle_id?: number | null
    cycle_name?: string | null
  }
  params?: Record<string, JsonValue>
  missing_fields?: string[]
  validation_warnings?: string[]
  human_summary?: string
  proposal_id?: string
}

interface ActionEvent {
  event_type?: ActionEventType
  action?: string | null
  proposal_id?: string | null
  message?: string | null
  payload?: ActionPayload
  created_at?: string
}

interface SendMessageResponse {
  success: boolean
  message: string
  inferred_context: InferredContext | null
  action_proposal: ActionProposal | null
  user_message: NurseryChatMessage
  model_response: NurseryChatMessage
}

// Support options fetched from the database
interface BasinOption {
  id: number
  name: string
}

interface CycleOption {
  id: number
  name: string
}

interface IdNameOption {
  id: number
  name: string
}

interface FertilizerOption {
  id: number
  name: string
  quantity: number
  unit: string
}

interface NurseryManageResponse {
  data?: {
    nurseries?: Array<{
      id: number
      name?: string
    }>
    filter_options?: {
      basins?: BasinOption[]
      sections?: IdNameOption[]
      varieties?: IdNameOption[]
      pot_sizes?: string[]
    }
    cycles?: CycleOption[]
  }
}

interface GeneralOperationOptionsResponse {
  data?: {
    fertilizers?: FertilizerOption[]
  }
}

interface BasinStats {
  basin?: {
    name?: string
    capacity?: number
    irrigation_method?: string | null
  }
  stats?: {
    total_trees?: number
  }
  operations_stats?: {
    last_irrigation?: string | null
    last_fertilization?: string | null
  }
  recent_activities?: Array<{
    description?: string
    type?: string
    date?: string
    detail?: string
  }>
}

interface ActiveAction {
  [key: string]: JsonValue | undefined
  action: KnownActionType | string
  proposal_id?: string
  basin_id?: number | null
  basin_name?: string | null
  cycle_id?: number | null
  cycle_name?: string | null
  date?: string
  period?: IrrigationPeriod
  start_time?: string
  end_time?: string
  mortality_date?: string
  fertilization_date?: string
  fertilizer_id?: number
  quantity?: number
  line_number?: number
  successful_count?: number
  mark_remaining_failed?: boolean
  pot_size?: string | null
  tree_height?: number
  human_summary?: string
  missing_fields?: string[]
  validation_warnings?: string[]
  notes?: string
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

interface SpeechRecognitionResultEventLike {
  results: {
    length: number
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  if (err && typeof err === 'object') {
    const data = err as { message?: unknown; error?: unknown; errors?: Record<string, unknown> }
    if (typeof data.message === 'string' && data.message.trim()) return data.message
    if (typeof data.error === 'string' && data.error.trim()) return data.error
    if (data.errors && typeof data.errors === 'object') {
      const first = Object.values(data.errors)[0]
      if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
      if (typeof first === 'string') return first
    }
  }

  return fallback
}

export default function NurseryAiChatPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const commands = [
    { key: '/irrigate', label: 'تسجيل عملية ري سريعة', action: 'log_irrigation', icon: '💧' },
    { key: '/fertilize', label: 'تسجيل عملية تسميد سريعة', action: 'log_fertilization', icon: '🌿' },
    { key: '/mortality', label: 'تسجيل حالة نفوق', action: 'log_mortality', icon: '❌' },
    { key: '/transfer', label: 'نقل وتفريد دورة', action: 'transfer_cycle', icon: '🔄' },
    { key: '/cycle', label: 'بدء دورة إنتاج جديدة', action: 'start_cycle', icon: '🌱' },
    { key: '/basin', label: 'إنشاء حوض جديد', action: 'create_basin', icon: '🏫' },
    { key: '/procedure', label: 'تسجيل إجراء عام', action: 'log_procedure', icon: '⚙️' },
  ]

  // State Management
  const [chats, setChats] = useState<NurseryChat[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const filteredChats = chats.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  const [activeChat, setActiveChat] = useState<NurseryChat | null>(null)
  const [messages, setMessages] = useState<NurseryChatMessage[]>([])
  const [inferredContext, setInferredContext] = useState<InferredContext | null>(null)
  const [messageActionProposals, setMessageActionProposals] = useState<Record<number, ActionProposal>>({})
  
  // Loading & Action states
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([])
  
  // Input fields
  const [inputMessage, setInputMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedBasinId, setSelectedBasinId] = useState<number | null>(null)
  const selectedBasinIdRef = useRef(selectedBasinId)
  useEffect(() => {
    selectedBasinIdRef.current = selectedBasinId
  }, [selectedBasinId])
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null)

  // DB options for contextualization
  const [basins, setBasins] = useState<BasinOption[]>([])
  const [cycles, setCycles] = useState<CycleOption[]>([])
  const [fertilizers, setFertilizers] = useState<FertilizerOption[]>([])


  // Live Basin Dashboard Stats
  const [basinStats, setBasinStats] = useState<BasinStats | null>(null)
  const [loadingBasinStats, setLoadingBasinStats] = useState(false)

  // Inline rename state
  const [renamingChatId, setRenamingChatId] = useState<number | null>(null)
  const [renameTitle, setRenameTitle] = useState('')

  // Speech-to-Text State
  const [isRecording, setIsRecording] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null)
  const [voiceMode, setVoiceMode] = useState<'backend' | 'browser' | 'unavailable'>('unavailable')
  const sendingRef = useRef(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])

  // Premium UX States & Hooks
  const { toasts, addToast, removeToast } = useToast()
  const [chatDrafts, setChatDrafts] = useState<Record<number, string>>({})
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [executedMessageIds, setExecutedMessageIds] = useState<Record<number, boolean>>({})
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const chatScrollContainerRef = useRef<HTMLDivElement>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(true)
  const [showStatsPanel, setShowStatsPanel] = useState(false)

  const filteredCommands = commands.filter(cmd => 
    cmd.key.toLowerCase().startsWith(inputMessage.toLowerCase()) || 
    cmd.label.includes(inputMessage)
  )

  // Action Dialog States
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null)
  const [actionSubmitting, setActionSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  
  // Dialog fields
  const [irrigationDate, setIrrigationDate] = useState('')
  const [irrigationPeriod, setIrrigationPeriod] = useState<'morning' | 'evening'>('morning')
  const [irrigationStartTime, setIrrigationStartTime] = useState('')
  const [irrigationEndTime, setIrrigationEndTime] = useState('')
  
  const [mortalityLine, setMortalityLine] = useState(1)
  const [mortalityQuantity, setMortalityQuantity] = useState(1)
  const [mortalityDate, setMortalityDate] = useState('')

  const [fertilizationDate, setFertilizationDate] = useState('')
  const [fertilizerId, setFertilizerId] = useState<number>(0)
  const [fertilizationQuantity, setFertilizationQuantity] = useState(1)

  const [transferSuccessCount, setTransferSuccessCount] = useState(1)
  const [transferMarkRemainingFailed, setTransferMarkRemainingFailed] = useState(true)
  const [transferDate, setTransferDate] = useState('')
  const [transferBasinId, setTransferBasinId] = useState<number>(0)
  const [transferLineNumber, setTransferLineNumber] = useState(1)

  // Note: start_cycle, create_basin, and log_procedure states are defined below

  const [sections, setSections] = useState<IdNameOption[]>([])
  const [varieties, setVarieties] = useState<IdNameOption[]>([])
  const [potSizes, setPotSizes] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [dialogBasinId, setDialogBasinId] = useState<number>(0)

  // start_cycle fields
  const [cycleName, setCycleName] = useState('')
  const [cycleTreeTypeId, setCycleTreeTypeId] = useState<number>(0)
  const [cyclePropagationType, setCyclePropagationType] = useState<string>('seeds')
  const [cycleSource, setCycleSource] = useState('')
  const [cycleCount, setCycleCount] = useState(100)
  const [cyclePotSize, setCyclePotSize] = useState('')
  const [cycleStartDate, setCycleStartDate] = useState('')

  // add_trees fields
  const [treeLineNumber, setTreeLineNumber] = useState(1)
  const [treeTypeId, setTreeTypeId] = useState<number>(0)
  const [treeQuantity, setTreeQuantity] = useState(100)
  const [treePotSize, setTreePotSize] = useState('')
  const [treeHeight, setTreeHeight] = useState(0)
  const [treeThickness, setTreeThickness] = useState(0)
  const [treeBirthDate, setTreeBirthDate] = useState('')

  // create_basin fields
  const [basinSectionId, setBasinSectionId] = useState<number>(0)
  const [basinBaseName, setBasinBaseName] = useState('')
  const [basinCount, setBasinCount] = useState(1)
  const [basinLength, setBasinLength] = useState(0)
  const [basinWidth, setBasinWidth] = useState(0)
  const [basinIrrigationMethod, setBasinIrrigationMethod] = useState('')

  // log_procedure fields
  const [procedureCycleId, setProcedureCycleId] = useState<number>(0)
  const [procedureType, setProcedureType] = useState<'irrigation' | 'inspection' | 'humidity'>('irrigation')
  const [procedureDate, setProcedureDate] = useState('')
  const [procedurePeriod, setProcedurePeriod] = useState<string>('morning')
  const [procedureStartTime, setProcedureStartTime] = useState('')
  const [procedureEndTime, setProcedureEndTime] = useState('')
  const [procedureHumidity, setProcedureHumidity] = useState<number | ''>(50)
  const [procedureNotes, setProcedureNotes] = useState('')

  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function buildClientContextHints(basinId = selectedBasinId, cycleId = selectedCycleId) {
    const hints = contextHintsFromPath(pathname, searchParams)
    if (basinId) hints.context_basin_id = basinId
    if (cycleId) hints.context_cycle_id = cycleId
    return hints
  }

  function normalizeActionProposal(proposal: ActionProposal): ActiveAction {
    return {
      action: proposal.action,
      proposal_id: proposal.proposal_id,
      basin_id: proposal.target?.basin_id ?? undefined,
      basin_name: proposal.target?.basin_name ?? undefined,
      cycle_id: proposal.target?.cycle_id ?? undefined,
      cycle_name: proposal.target?.cycle_name ?? undefined,
      ...(proposal.params || {}),
      human_summary: proposal.human_summary,
      missing_fields: proposal.missing_fields || [],
      validation_warnings: proposal.validation_warnings || []
    }
  }

  function focusLabel() {
    const entities = inferredContext?.last_resolved_entities
    if (entities?.basin?.name) return `التركيز الحالي: ${entities.basin.name}`
    if (entities?.cycle?.name) return `التركيز الحالي: ${entities.cycle.name}`
    if (entities?.inventory_item?.name) return `عنصر مخزون: ${entities.inventory_item.name}`
    if (inferredContext?.last_response_type === 'clarification') return 'بانتظار توضيح'

    const quickBasin = selectedBasinId ? basins.find(b => b.id === selectedBasinId)?.name : null
    const quickCycle = selectedCycleId ? cycles.find(c => c.id === selectedCycleId)?.name : null
    if (quickBasin) return `تركيز سريع: ${quickBasin}`
    if (quickCycle) return `تركيز سريع: ${quickCycle}`

    return 'استفسار عام'
  }

  // 1. Initial Load: chats list and contexts
  useEffect(() => {
    fetchChats()
    fetchContextOptions()
    initSpeechRecognition()
  }, [])

  // Fetch basin stats when context basin changes
  useEffect(() => {
    if (selectedBasinId) {
      loadBasinStats(selectedBasinId)
    } else {
      setBasinStats(null)
      setShowStatsPanel(false)
    }
  }, [selectedBasinId])

  // Sync basin selection when active chat context changes
  useEffect(() => {
    if (activeChat) {
      if (activeChat.context_basin_id) {
        setSelectedBasinId(activeChat.context_basin_id)
      } else {
        setSelectedBasinId(null)
      }
      if (activeChat.context_cycle_id) {
        setSelectedCycleId(activeChat.context_cycle_id)
      } else {
        setSelectedCycleId(null)
      }
    } else {
      setSelectedBasinId(null)
      setSelectedCycleId(null)
    }

    // Clear any active action confirmation popup or errors
    setActiveAction(null)
    setActionError(null)
    setFieldErrors({})
  }, [activeChat])

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, sendingMessage])

  function handleChatScroll() {
    const container = chatScrollContainerRef.current
    if (!container) return
    const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 200
    setShowScrollBottom(isScrolledUp)
  }

  // Fetch chats list
  async function fetchChats() {
    try {
      setLoadingChats(true)
      const data = await apiRequest<NurseryChat[]>('/nursery/chats')
      setChats(data || [])
    } catch (err) {
      console.error('Failed to load chats:', err)
    } finally {
      setLoadingChats(false)
    }
  }

  // Fetch contextual options (basins, active production cycles, fertilizers)
  async function fetchContextOptions() {
    try {
      const dashboardData = await apiRequest<NurseryManageResponse>('/nursery/manage?status=active')
      if (dashboardData?.data) {
        setBasins(dashboardData.data.filter_options?.basins || [])
        setCycles(dashboardData.data.cycles || [])
        setSections(dashboardData.data.filter_options?.sections || [])
        setVarieties(dashboardData.data.filter_options?.varieties || [])
        setPotSizes(dashboardData.data.filter_options?.pot_sizes || [])
      }

      // Fetch fertilizers from general operations context
      const nurseryId = dashboardData?.data?.nurseries?.[0]?.id
      if (nurseryId) {
        const operationOptions = await apiRequest<GeneralOperationOptionsResponse>(`/nursery/manage/general-operations?type=nursery&id=${nurseryId}`).catch(() => null)
        if (operationOptions?.data?.fertilizers) {
          setFertilizers(operationOptions.data.fertilizers)
        }
      }
    } catch (err) {
      console.error('Failed to load context options:', err)
    }
  }

  // Fetch live basin statistics for the quick info dashboard
  async function loadBasinStats(basinId: number) {
    try {
      setLoadingBasinStats(true)
      const response = await nurseryManagementApi.basinDashboard(basinId)
      if (response.data && basinId === selectedBasinIdRef.current) {
        setBasinStats(response.data as BasinStats)
      }
    } catch (err) {
      console.error('Failed to fetch basin stats:', err)
    } finally {
      if (basinId === selectedBasinIdRef.current) {
        setLoadingBasinStats(false)
      }
    }
  }

  // Copy message text to clipboard
  function handleCopyMessage(messageId: number, text: string) {
    if (typeof navigator === 'undefined') return
    navigator.clipboard.writeText(text)
    setCopiedMessageId(messageId)
    addToast('تم نسخ محتوى الرسالة بنجاح!', 'success')
    setTimeout(() => {
      setCopiedMessageId(null)
    }, 2000)
  }

  // Initialize Speech recognition
  function initSpeechRecognition() {
    if (typeof window !== 'undefined') {
      if (supportsMediaRecorder()) {
        setVoiceMode('backend')
      }

      const speechWindow = window as SpeechRecognitionWindow
      const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = false
        recognition.lang = 'ar-SA' // Target Arabic language dictation

        recognition.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript
          setInputMessage(prev => prev + (prev ? ' ' : '') + transcript)
        }

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsRecording(false)
        }

        recognition.onend = () => {
          setIsRecording(false)
        }

        recognitionRef.current = recognition
        if (!supportsMediaRecorder()) {
          setVoiceMode('browser')
        }
      }
    }
  }

  // Toggle Recording speech
  async function toggleRecording() {
    if (voiceMode === 'backend') {
      await toggleBackendRecording()
      return
    }

    if (!recognitionRef.current) {
      addToast('إدخال الصوت غير مدعوم في هذا المتصفح.', 'error')
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  async function toggleBackendRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        try {
          const result = await transcribeAudio(blob)
          if (result.text) {
            setInputMessage(prev => prev + (prev ? ' ' : '') + result.text)
          }
        } catch (err) {
          console.error('Backend transcription failed, falling back to browser speech:', err)
          setVoiceMode(recognitionRef.current ? 'browser' : 'unavailable')
          if (recognitionRef.current) {
            recognitionRef.current.start()
            setIsRecording(true)
          } else {
            addToast('تعذر تفريغ التسجيل الصوتي حالياً.', 'error')
          }
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('MediaRecorder start failed:', err)
      setVoiceMode(recognitionRef.current ? 'browser' : 'unavailable')
      if (recognitionRef.current) {
        recognitionRef.current.start()
        setIsRecording(true)
      } else {
        addToast('إدخال الصوت غير مدعوم في هذا المتصفح.', 'error')
      }
    }
  }

  // 2. Load active chat messages
  async function selectChat(chat: NurseryChat) {
    setActiveChat(chat)
    setMessages([])
    setInferredContext(null)
    setMessageActionProposals({})
    setLoadingMessages(true)
    setInputMessage(chatDrafts[chat.id] || '')
    try {
      const data = await apiRequest<{ success: boolean; messages: NurseryChatMessage[] }>(`/nursery/chats/${chat.id}`)
      if (data.success) {
        const msgs = data.messages || []
        setMessages(msgs)
        
        // Extract proposals from loaded messages and populate state
        const proposals: Record<number, ActionProposal> = {}
        msgs.forEach(msg => {
          if (msg.role === 'model' && msg.action_proposal) {
            proposals[msg.id] = msg.action_proposal
          }
        })
        setMessageActionProposals(proposals)
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  // Create new chat session
  async function handleCreateChat(title?: string, basinId?: number | null, cycleId?: number | null) {
    try {
      const hints = buildClientContextHints(basinId || selectedBasinId, cycleId || selectedCycleId)
      const payload = {
        title: title || undefined,
        client_context_hints: Object.keys(hints).length ? hints : undefined,
      }
      
      const response = await apiRequest<{ success: boolean; chat: NurseryChat }>('/nursery/chats', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (response.success) {
        setChats(prev => [response.chat, ...prev])
        setActiveChat(response.chat)
        setMessages([])
        setInferredContext(null)
        setMessageActionProposals({})
        setInputMessage('')
        
        // Reset selections if not pre-provided
        if (!basinId && !cycleId) {
          setSelectedBasinId(null)
          setSelectedCycleId(null)
        }
      }
    } catch (err) {
      console.error('Failed to create chat:', err)
    }
  }

  // Rename Chat Title
  async function handleRenameChat(id: number) {
    if (!renameTitle.trim()) return
    try {
      const response = await apiRequest<{ success: boolean; chat: NurseryChat }>(`/nursery/chats/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: renameTitle })
      })
      if (response.success) {
        setChats(prev => prev.map(c => c.id === id ? response.chat : c))
        if (activeChat?.id === id) {
          setActiveChat(response.chat)
        }
        setRenamingChatId(null)
        setRenameTitle('')
      }
    } catch (err) {
      console.error('Failed to rename chat:', err)
    }
  }

  // Delete Chat
  async function handleDeleteChat(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذه المحادثة بالكامل؟')) return
    try {
      const response = await apiRequest<{ success: boolean }>(`/nursery/chats/${id}`, {
        method: 'DELETE'
      })
      if (response.success) {
        setChats(prev => prev.filter(c => c.id !== id))
        if (activeChat?.id === id) {
          setActiveChat(null)
          setMessages([])
        }
      }
    } catch (err) {
      console.error('Failed to delete chat:', err)
    }
  }

  // Handle File Selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...filesArray])
    }
  }

  // Remove selected file
  function removeSelectedFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Send message
  async function handleSendMessage(textToSend?: string) {
    if (sendingMessage || sendingRef.current) return
    const text = textToSend !== undefined ? textToSend : inputMessage
    if (!text.trim() && selectedFiles.length === 0) return
    
    sendingRef.current = true
    let currentChat = activeChat
    if (!currentChat) {
      // Auto-create chat if none active
      const titleText = text.length > 30 ? text.substring(0, 30) + '...' : text
      const hints = buildClientContextHints()
      const payload = {
        title: titleText,
        client_context_hints: Object.keys(hints).length ? hints : undefined,
      }
      
      try {
        const createRes = await apiRequest<{ success: boolean; chat: NurseryChat }>('/nursery/chats', {
          method: 'POST',
          body: JSON.stringify(payload)
        })

        if (createRes.success) {
          setChats(prev => [createRes.chat, ...prev])
          currentChat = createRes.chat
          setActiveChat(createRes.chat)
          setMessages([])
          setInferredContext(null)
          setMessageActionProposals({})
        } else {
          addToast('فشل في بدء جلسة محادثة جديدة.', 'error')
          sendingRef.current = false
          return
        }
      } catch (err) {
        console.error('Failed to auto-create chat:', err)
        addToast('فشل في بدء جلسة محادثة جديدة.', 'error')
        sendingRef.current = false
        return
      }
    }

    setSendingMessage(true)
    setTelemetryEvents([])
    if (textToSend === undefined) {
      setInputMessage('')
      if (activeChat?.id) {
        setChatDrafts(prev => ({ ...prev, [activeChat.id]: '' }))
      }
    }
    
    try {
      const formData = new FormData()
      if (text.trim()) {
        formData.append('message', text)
      }
      selectedFiles.forEach(file => {
        formData.append('attachments[]', file)
      })
      const hints = buildClientContextHints()
      if (Object.keys(hints).length) {
        formData.append('client_context_hints', JSON.stringify(hints))
      }

      // Optimistically add the user message
      const userMsg: NurseryChatMessage = {
        id: Date.now(),
        role: 'user',
        content: text,
        attachments: selectedFiles.map(f => ({
          id: Date.now() + Math.random(),
          name: f.name,
          url: URL.createObjectURL(f),
          mime_type: f.type,
          file_size: f.size
        })),
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, userMsg])
      setSelectedFiles([])

      let streamedModelId: number | null = null
      let streamedContent = ''

      try {
        await sendNurseryMessageStream(currentChat.id, formData, {
          onUserMessage: userMessage => {
            setMessages(prev => {
              const next = prev.map(m => m.id === userMsg.id ? userMessage : m)
              if (!next.some(m => m.id === userMessage.id)) {
                next.push(userMessage)
              }
              return next
            })
          },
          onTelemetry: event => {
            setTelemetryEvents(prev => [event, ...prev].slice(0, 4))
          },
          onDelta: delta => {
            streamedContent += delta
            setMessages(prev => {
              if (streamedModelId === null) {
                streamedModelId = Date.now()
                return [
                  ...prev,
                  {
                    id: streamedModelId,
                    role: 'model',
                    content: streamedContent,
                    attachments: null,
                    created_at: new Date().toISOString(),
                  },
                ]
              }

              return prev.map(message => (
                message.id === streamedModelId ? { ...message, content: streamedContent } : message
              ))
            })
          },
          onCompleted: response => {
            const modelMessage = {
              ...response.model_response,
              content: response.message || response.model_response.content,
            }
            setMessages(prev => {
              if (streamedModelId === null) return [...prev, modelMessage]
              let replaced = false
              const next = prev.map(message => {
                if (message.id !== streamedModelId) return message
                replaced = true
                return modelMessage
              })

              return replaced ? next : [...next, modelMessage]
            })
            setInferredContext(response.inferred_context || null)
            if (response.action_proposal) {
              setMessageActionProposals(prev => ({
                ...prev,
                [modelMessage.id]: response.action_proposal as ActionProposal,
              }))
            }
          },
        })
      } catch (streamErr) {
        console.warn('Streaming message failed, falling back to blocking endpoint:', streamErr)
        await sendMessageBlocking(currentChat.id, formData, userMsg.id)
      }

      fetchChats()
    } catch (err: unknown) {
      console.error('Failed to send message:', err)
      addToast(errorMessage(err, 'فشل في إرسال الرسالة للمستشار الذكي.'), 'error')
    } finally {
      sendingRef.current = false
      setSendingMessage(false)
    }
  }

  async function sendMessageBlocking(chatId: number, formData: FormData, optimisticId: number) {
    const response = await apiRequest<SendMessageResponse>(`/nursery/chats/${chatId}/messages`, {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      const modelMessage = {
        ...response.model_response,
        content: response.message || response.model_response.content
      }
      setMessages(prev => {
        const next = prev.map(m => m.id === optimisticId ? response.user_message : m)
        if (!next.some(message => message.id === response.user_message.id)) {
          next.push(response.user_message)
        }
        if (!next.some(message => message.id === modelMessage.id)) {
          next.push(modelMessage)
        }
        return next
      })
      setInferredContext(response.inferred_context || null)
      if (response.action_proposal) {
        setMessageActionProposals(prev => ({
          ...prev,
          [modelMessage.id]: response.action_proposal as ActionProposal
        }))
      }
    }
  }

  // Suggestion chips handler
  function handleSuggestionClick(suggestion: string) {
    if (sendingMessage || sendingRef.current) return
    handleSendMessage(suggestion)
  }

  // Quick Action execution: Pre-fill form state and open appropriate dialog modal
  function handleActionExecute(actionObj: ActiveAction) {
    setActiveAction(actionObj)
    setActionError(null)
    setFieldErrors({})

    const todayString = new Date().toISOString().split('T')[0]
    const currentBasinId = Number(actionObj.basin_id || selectedBasinId || activeChat?.context_basin_id || 0)
    setDialogBasinId(currentBasinId)

    if (actionObj.action === 'log_irrigation') {
      const irrDate = actionObj.date || actionObj.irrigation_date
      setIrrigationDate(typeof irrDate === 'string' ? irrDate : todayString)
      setIrrigationPeriod(actionObj.period === 'evening' ? 'evening' : 'morning')
      setIrrigationStartTime(typeof actionObj.start_time === 'string' ? actionObj.start_time : '07:00')
      setIrrigationEndTime(typeof actionObj.end_time === 'string' ? actionObj.end_time : '08:00')
    } else if (actionObj.action === 'log_mortality') {
      setMortalityLine(Number(actionObj.line_number || 1))
      setMortalityQuantity(Number(actionObj.quantity || 1))
      const mortDate = actionObj.date || actionObj.mortality_date
      setMortalityDate(typeof mortDate === 'string' ? mortDate : todayString)
    } else if (actionObj.action === 'log_fertilization') {
      const fertDate = actionObj.date || actionObj.fertilization_date
      setFertilizationDate(typeof fertDate === 'string' ? fertDate : todayString)
      setFertilizationQuantity(Number(actionObj.quantity || 1))
      
      // Try resolving fertilizer id from suggestions
      if (actionObj.fertilizer_id) {
        setFertilizerId(Number(actionObj.fertilizer_id))
      } else {
        setFertilizerId(fertilizers[0]?.id || 0)
      }
    } else if (actionObj.action === 'transfer_cycle') {
      setTransferSuccessCount(Number(actionObj.successful_count || 1))
      setTransferMarkRemainingFailed(actionObj.mark_remaining_failed !== false)
      const transDate = actionObj.date || actionObj.transfer_date
      setTransferDate(typeof transDate === 'string' ? transDate : todayString)
      setTransferBasinId(Number(actionObj.basin_id || basins[0]?.id || 0))
      setTransferLineNumber(Number(actionObj.line_number || 1))
    } else if (actionObj.action === 'start_cycle') {
      setCycleName(typeof actionObj.name === 'string' ? actionObj.name : '')
      setCycleTreeTypeId(Number(actionObj.tree_type_id || actionObj.variety_id || 0))
      setCyclePropagationType(typeof actionObj.propagation_type === 'string' ? actionObj.propagation_type : '')
      setCycleSource(typeof actionObj.source === 'string' ? actionObj.source : '')
      setCycleCount(Number(actionObj.count || 1))
      setCyclePotSize(typeof actionObj.pot_size === 'string' ? actionObj.pot_size : '')
      const startDate = actionObj.start_date || actionObj.date
      setCycleStartDate(typeof startDate === 'string' ? startDate : todayString)
    } else if (actionObj.action === 'create_basin') {
      setBasinSectionId(Number(actionObj.section_id || 0))
      setBasinBaseName(typeof actionObj.base_name === 'string' ? actionObj.base_name : '')
      setBasinCount(Number(actionObj.count || 1))
      setBasinLength(Number(actionObj.length || 0))
      setBasinWidth(Number(actionObj.width || 0))
      setBasinIrrigationMethod(typeof actionObj.irrigation_method === 'string' ? actionObj.irrigation_method : '')
    } else if (actionObj.action === 'log_procedure') {
      setProcedureCycleId(Number(actionObj.cycle_id || selectedCycleId || activeChat?.context_cycle_id || 0))
      const procType = actionObj.procedure_type
      if (procType === 'irrigation' || procType === 'inspection' || procType === 'humidity') {
        setProcedureType(procType)
      } else {
        setProcedureType('irrigation')
      }
      const procDate = actionObj.procedure_date || actionObj.date
      setProcedureDate(typeof procDate === 'string' ? procDate : todayString)
      setProcedurePeriod(typeof actionObj.period === 'string' ? actionObj.period : '')
      setProcedureStartTime(typeof actionObj.start_time === 'string' ? actionObj.start_time : '')
      setProcedureEndTime(typeof actionObj.end_time === 'string' ? actionObj.end_time : '')
      setProcedureHumidity(actionObj.humidity_percentage !== undefined ? Number(actionObj.humidity_percentage) : '')
      setProcedureNotes(typeof actionObj.notes === 'string' ? actionObj.notes : '')
    } else if (actionObj.action === 'add_trees') {
      setTreeLineNumber(Number(actionObj.line_number || 1))
      setTreeTypeId(Number(actionObj.tree_type_id || actionObj.variety_id || 0))
      setTreeQuantity(Number(actionObj.quantity || 100))
      setTreePotSize(typeof actionObj.pot_size === 'string' ? actionObj.pot_size : '')
      setTreeHeight(Number(actionObj.height || 0))
      setTreeThickness(Number(actionObj.thickness || 0))
      const bDate = actionObj.birth_date || actionObj.date
      setTreeBirthDate(typeof bDate === 'string' ? bDate : todayString)
    }
  }

  // Shortcut triggers to open standard action forms from the sidebar/dashboard
  function handleDirectShortcut(actionType: KnownActionType) {
    const targetBasin = selectedBasinId || activeChat?.context_basin_id

    const actionData: ActiveAction = {
      action: actionType,
      basin_id: targetBasin,
      date: new Date().toISOString().split('T')[0]
    }

    if (actionType === 'transfer_cycle') {
      actionData.cycle_id = selectedCycleId || activeChat?.context_cycle_id || cycles[0]?.id
    }

    handleActionExecute(actionData)
  }

  async function recordActionEvent(
    eventType: ActionEventType,
    action: string,
    payload: ActionPayload = {},
    message?: string
  ) {
    if (!activeChat) return

    try {
      const response = await apiRequest<{ success: boolean; inferred_context?: InferredContext }>(`/nursery/chats/${activeChat.id}/action-events`, {
        method: 'POST',
        body: JSON.stringify({
          event_type: eventType,
          action,
          proposal_id: activeAction?.proposal_id,
          message,
          payload
        })
      })

      if (response.success && response.inferred_context) {
        setInferredContext(response.inferred_context)
      }
    } catch (err) {
      console.error('Failed to record action event:', err)
    }
  }

  function handleActionCancel() {
    if (activeAction) {
      recordActionEvent('action_failed', activeAction.action, { cancelled: true }, 'ألغى المستخدم تأكيد الإجراء.')
    }
    setActiveAction(null)
    setActionError(null)
    setFieldErrors({})
  }

  // Commit dynamic database operations from AI Action Card or Dashboard Shortcut
  async function submitAction() {
    if (!activeAction || actionSubmitting) return
    setActionSubmitting(true)
    setActionError(null)
    setFieldErrors({})

    const targetBasinId = dialogBasinId || activeAction.basin_id || selectedBasinId || activeChat?.context_basin_id

    try {
      const registryEntry = actionRegistry[activeAction.action as KnownActionType]
      if (!registryEntry) {
        throw new Error('نوع الإجراء المقترح غير مدعوم في الواجهة.')
      }

      const registryArgs = {
        activeAction,
        targetBasinId,
        selectedCycleId,
        activeChatCycleId: activeChat?.context_cycle_id,
        irrigationDate,
        irrigationPeriod,
        irrigationStartTime,
        irrigationEndTime,
        mortalityLine,
        mortalityQuantity,
        mortalityDate,
        fertilizationDate,
        fertilizerId,
        fertilizationQuantity,
        transferSuccessCount,
        transferMarkRemainingFailed,
        transferDate,
        transferBasinId,
        transferLineNumber,
        // New action fields
        cycleName,
        cycleTreeTypeId,
        cyclePropagationType,
        cycleSource,
        cycleCount,
        cyclePotSize,
        cycleStartDate,
        basinSectionId,
        basinBaseName,
        basinCount,
        basinLength,
        basinWidth,
        basinIrrigationMethod,
        procedureCycleId,
        procedureType,
        procedureDate,
        procedurePeriod,
        procedureStartTime,
        procedureEndTime,
        procedureHumidity: procedureHumidity === '' ? null : procedureHumidity,
        procedureNotes,
        // add_trees fields
        treeLineNumber,
        treeTypeId,
        treeQuantity,
        treePotSize,
        treeHeight,
        treeThickness,
        treeBirthDate,
      }

      const endpoint = registryEntry.endpoint(registryArgs)
      const payload = registryEntry.buildPayload(registryArgs)
      let logText = ''

      if (activeAction.action === 'log_irrigation') {
        const basinName = basins.find(b => b.id === Number(targetBasinId))?.name || `#${targetBasinId}`
        logText = `⚙️ تم تسجيل عملية ري بنجاح للحوض (${basinName}) للفترة ${irrigationPeriod === 'morning' ? 'الصباحية' : 'المسائية'} بتاريخ ${irrigationDate}.`
      } else if (activeAction.action === 'log_mortality') {
        const basinName = basins.find(b => b.id === Number(targetBasinId))?.name || `#${targetBasinId}`
        logText = `⚙️ تم تسجيل نفوق (${mortalityQuantity}) شتلة في الحوض (${basinName}) بالخط رقم (${mortalityLine}) بتاريخ ${mortalityDate}.`
      } else if (activeAction.action === 'log_fertilization') {
        const fertName = fertilizers.find(f => f.id === fertilizerId)?.name || 'السماد المحدد'
        const basinName = basins.find(b => b.id === Number(targetBasinId))?.name || `#${targetBasinId}`
        logText = `⚙️ تم تسجيل عملية تسميد بمقدار (${fertilizationQuantity}) للحوض (${basinName}) باستخدام (${fertName}) بتاريخ ${fertilizationDate}.`
      } else if (activeAction.action === 'transfer_cycle') {
        const cycleId = activeAction.cycle_id || selectedCycleId || activeChat?.context_cycle_id
        const cycleName = cycles.find(c => c.id === Number(cycleId))?.name || `#${cycleId}`
        const targetBasinName = basins.find(b => b.id === transferBasinId)?.name || `#${transferBasinId}`
        logText = `⚙️ تم نقل وتفريد دورة الإنتاج (${cycleName}) بعدد (${transferSuccessCount}) شتلات ناجحة إلى الحوض (${targetBasinName}) الخط رقم (${transferLineNumber}).`
      } else if (activeAction.action === 'start_cycle') {
        const basinName = basins.find(b => b.id === Number(targetBasinId))?.name || `#${targetBasinId}`
        logText = `⚙️ تم بدء دورة الإنتاج (${cycleName}) بعدد (${cycleCount}) في الحوض (${basinName}) بتاريخ ${cycleStartDate}.`
      } else if (activeAction.action === 'add_trees') {
        const basinName = basins.find(b => b.id === Number(targetBasinId))?.name || `#${targetBasinId}`
        const treeName = varieties.find(v => v.id === treeTypeId)?.name || 'شجر'
        logText = `⚙️ تم إضافة شجر من نوع (${treeName}) بعدد (${treeQuantity}) في الحوض (${basinName}) بالخط رقم (${treeLineNumber}) بنجاح.`
      } else if (activeAction.action === 'create_basin') {
        logText = `⚙️ تم إنشاء حوض/أحواض جديدة بالاسم الأساسي (${basinBaseName}) بعدد (${basinCount}) بنجاح.`
      } else if (activeAction.action === 'log_procedure') {
        const cycleId = procedureCycleId || activeAction.cycle_id || selectedCycleId || activeChat?.context_cycle_id
        const cycleName = cycles.find(c => c.id === Number(cycleId))?.name || `#${cycleId}`
        const label = procedureType === 'irrigation' ? 'ري' : procedureType === 'inspection' ? 'فحص ومراقبة' : 'قياس رطوبة'
        logText = `⚙️ تم تسجيل إجراء (${label}) لدورة الإنتاج (${cycleName}) بتاريخ ${procedureDate}.`
      } else {
        logText = `⚙️ تم تنفيذ الإجراء (${registryEntry.title}) بنجاح.`
      }

      await recordActionEvent('action_confirmed', activeAction.action, payload, 'بدأ المستخدم تأكيد الإجراء من الواجهة.')

      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      // Add system message to the local list
      const systemMessage: NurseryChatMessage = {
        id: Date.now(),
        role: 'system',
        content: logText,
        attachments: null,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, systemMessage])

      await recordActionEvent('action_result', activeAction.action, { ...payload, log_text: logText }, logText)

      // Mark action proposal as executed if it is associated with a message
      if (activeAction.proposal_id) {
        const matchingMsgEntry = Object.entries(messageActionProposals).find(
          ([, prop]) => prop.proposal_id === activeAction.proposal_id
        )
        if (matchingMsgEntry) {
          const msgId = Number(matchingMsgEntry[0])
          setExecutedMessageIds(prev => ({ ...prev, [msgId]: true }))
        }
      }

      addToast(logText || 'تم تنفيذ العملية بنجاح!', 'success')

      // Reload live stats and context options
      if (targetBasinId) {
        loadBasinStats(Number(targetBasinId))
      }
      fetchContextOptions()

      setActiveAction(null)
      setFieldErrors({})
    } catch (err: unknown) {
      console.error('Failed to commit action:', err)
      const apiErr = err as { status?: number; payload?: { errors?: Record<string, string[]>; message?: string } }
      if (apiErr && typeof apiErr === 'object' && apiErr.status === 422) {
        const payload = apiErr.payload
        if (payload?.errors && typeof payload.errors === 'object') {
          setFieldErrors(payload.errors)
          const msg = payload.message || 'يرجى تصحيح الأخطاء المحددة أدناه.'
          setActionError(msg)
          if (activeAction) {
            await recordActionEvent('action_failed', activeAction.action, { errors: payload.errors }, msg)
          }
          return
        }
      }

      const message = errorMessage(err, 'فشل تسجيل العملية.')
      if (activeAction) {
        await recordActionEvent('action_failed', activeAction.action, { error: message }, message)
      }
      setActionError(message || 'فشل تسجيل العملية. تأكد من صحة المدخلات وتوفر الكميات الكافية في المخزون.')
    } finally {
      setActionSubmitting(false)
    }
  }

  // Formats text with markdown bold rules
  function renderTextWithBold(text: string) {
    const boldRegex = /\*\*(.*?)\*\*/g
    const parts = []
    let lastIndex = 0
    let match
    let key = 0
    
    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{text.substring(lastIndex, match.index)}</span>)
      }
      parts.push(
        <strong key={key++} className="font-extrabold text-slate-900 dark:text-white">
          {match[1]}
        </strong>
      )
      lastIndex = boldRegex.lastIndex
    }
    
    if (lastIndex < text.length) {
      parts.push(<span key={key++}>{text.substring(lastIndex)}</span>)
    }
    
    return <span key={Math.random()}>{parts}</span>
  }

  function isMarkdownTable(lines: string[], startIndex: number) {
    const header = lines[startIndex]?.trim()
    const divider = lines[startIndex + 1]?.trim()

    return Boolean(
      header?.startsWith('|') &&
      header.endsWith('|') &&
      divider?.startsWith('|') &&
      divider.endsWith('|') &&
      /^\|[\s:|-]+\|$/.test(divider)
    )
  }

  function splitTableRow(line: string) {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim())
  }

  function renderMarkdownTable(lines: string[], key: string) {
    const headers = splitTableRow(lines[0])
    const rows = lines.slice(2).map(splitTableRow)

    return (
      <div key={key} className="my-4 max-w-full overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm transition-all hover:shadow-md">
        <table className="min-w-full border-collapse text-right text-xs" dir="rtl">
          <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              {headers.map((header, index) => (
                <th key={`${key}-h-${index}`} className="whitespace-nowrap px-4 py-3 font-extrabold dark:text-slate-100">
                  {renderTextWithBold(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-900/65">
            {rows.map((row, rowIndex) => (
              <tr key={`${key}-r-${rowIndex}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors odd:bg-white even:bg-slate-50/30 dark:odd:bg-slate-950 dark:even:bg-slate-900/10">
                {headers.map((_, cellIndex) => (
                  <td key={`${key}-r-${rowIndex}-c-${cellIndex}`} className="align-top px-4 py-2.5 text-slate-700 dark:text-slate-350 leading-relaxed">
                    {renderTextWithBold(row[cellIndex] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  function renderMarkdownText(text: string) {
    const lines = text.split('\n')
    const nodes: React.ReactNode[] = []
    let buffer: string[] = []
    let index = 0
    let key = 0

    const flushBuffer = () => {
      if (buffer.join('').trim()) {
        nodes.push(
          <div key={`text-${key++}`} className="whitespace-pre-wrap">
            {renderTextWithBold(buffer.join('\n'))}
          </div>
        )
      }
      buffer = []
    }

    while (index < lines.length) {
      if (isMarkdownTable(lines, index)) {
        flushBuffer()
        const tableLines = [lines[index], lines[index + 1]]
        index += 2

        while (index < lines.length && lines[index].trim().startsWith('|') && lines[index].trim().endsWith('|')) {
          tableLines.push(lines[index])
          index += 1
        }

        nodes.push(renderMarkdownTable(tableLines, `table-${key++}`))
        continue
      }

      buffer.push(lines[index])
      index += 1
    }

    flushBuffer()

    return nodes
  }

  // Formats text block rendering without executable action scraping.
  function formatMessageContent(content: string) {
    const codeBlockRegex = /```(?:[A-Za-z0-9_-]+)?\s*([\s\S]*?)\s*```/g
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match
    let cardKey = 0

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(...renderMarkdownText(content.substring(lastIndex, match.index)))
      }
      
      const jsonText = match[1].trim()
      parts.push(
        <CodeBlock key={`code-${cardKey++}`} code={jsonText} />
      )
      
      lastIndex = codeBlockRegex.lastIndex
    }

    if (lastIndex < content.length) {
      parts.push(...renderMarkdownText(content.substring(lastIndex)))
    }

    return <div className="space-y-2 leading-relaxed text-slate-700 dark:text-slate-200 text-sm">{parts}</div>
  }

  // Helper to render field-level validation errors
  function renderFieldErrors(fieldName: string) {
    const errors = fieldErrors[fieldName]
    if (!errors || errors.length === 0) return null
    return (
      <div className="mt-1 space-y-0.5 animate-fade-in-up">
        {errors.map((error, idx) => (
          <p key={idx} className="text-[11px] font-bold text-red-500">{error}</p>
        ))}
      </div>
    )
  }

  // Suggestion chips definitions
  const suggestionChips = [
    { text: 'ما هي حالة الحوض الحالي وجدول ريّه؟', icon: Waves },
    { text: 'اقترح برنامج تسميد لدورة الإنتاج النشطة', icon: Sprout },
    { text: 'كيف أشخص أوراق النبات الصفراء المصابة؟', icon: AlertCircle },
    { text: 'اعرض ملخص العمليات الأخيرة بالمشتل', icon: FileText }
  ]

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-0 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-slate-100/90 to-orange-50/20 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-900/90 dark:to-orange-950/10 font-sans" dir="rtl">
      
      {/* Pane 1. Previous consultations history sidebar */}
      <div className={`flex flex-col bg-white/60 dark:bg-slate-950/45 backdrop-blur-md transition-all duration-300 ease-in-out ${
        isHistoryOpen ? 'w-64 border-e border-slate-200/60 dark:border-slate-800 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'
      }`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="إخفاء السجل الجانبي"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">الاستشارات السابقة</h2>
          </div>
          <button 
            onClick={() => handleCreateChat()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-terracotta hover:bg-orange-100 dark:bg-orange-950/20 dark:text-orange-400 transition-colors"
            title="محادثة جديدة"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-3 pt-2 border-b border-slate-100/60 dark:border-slate-800">
          <input
            type="text"
            placeholder="بحث في الاستشارات..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-950/40 p-2 outline-none text-slate-700 dark:text-slate-300 focus:border-terracotta focus:ring-2 focus:ring-orange-100/50 transition-all"
          />
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {loadingChats ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-terracotta mb-2" />
              <span className="text-[11px] font-bold">جاري تحميل الاستشارات...</span>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              {searchQuery ? 'لا توجد نتائج بحث مطابقة.' : 'لا توجد استشارات سابقة.'}
            </div>
          ) : (
            (() => {
              const groups: { label: string; items: NurseryChat[] }[] = [
                { label: 'اليوم', items: [] },
                { label: 'الأمس', items: [] },
                { label: 'الأسبوع الماضي', items: [] },
                { label: 'أقدم', items: [] },
              ]

              const now = new Date()
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
              const yesterday = new Date(today)
              yesterday.setDate(yesterday.getDate() - 1)
              const lastWeek = new Date(today)
              lastWeek.setDate(lastWeek.getDate() - 7)

              filteredChats.forEach(chat => {
                const chatDate = new Date(chat.created_at)
                if (chatDate >= today) {
                  groups[0].items.push(chat)
                } else if (chatDate >= yesterday) {
                  groups[1].items.push(chat)
                } else if (chatDate >= lastWeek) {
                  groups[2].items.push(chat)
                } else {
                  groups[3].items.push(chat)
                }
              })

              return groups
                .filter(g => g.items.length > 0)
                .map(group => (
                  <div key={group.label} className="space-y-1">
                    <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 px-2 py-1 select-none">
                      {group.label}
                    </div>
                    {group.items.map(chat => {
                      const isActive = activeChat?.id === chat.id
                      const isRenaming = renamingChatId === chat.id

                      return (
                        <div
                          key={chat.id}
                          className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                            isActive 
                              ? 'bg-orange-50/70 border-r-4 border-terracotta dark:bg-orange-950/20' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'
                          }`}
                          onClick={() => !isRenaming && selectChat(chat)}
                        >
                          <div className="flex-1 min-w-0 pr-1">
                            {isRenaming ? (
                              <input
                                value={renameTitle}
                                onChange={e => setRenameTitle(e.target.value)}
                                onBlur={() => setTimeout(() => setRenamingChatId(null), 150)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameChat(chat.id)
                                  if (e.key === 'Escape') setRenamingChatId(null)
                                }}
                                className="w-full text-xs font-bold border border-terracotta rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-orange-100 transition-all"
                                autoFocus
                                onClick={e => e.stopPropagation()}
                              />
                            ) : (
                              <>
                                <div className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{chat.title}</div>
                                {(chat.context_basin_name || chat.context_cycle_name) && (
                                  <div className="text-[10px] text-terracotta mt-0.5 truncate flex items-center gap-1 font-semibold">
                                    <span>{chat.context_basin_name || chat.context_cycle_name}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          
                          {/* Actions buttons */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity mr-2 shrink-0">
                            {isRenaming ? (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleRenameChat(chat.id) }}
                                  className="p-1 text-emerald-600 hover:text-emerald-700"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setRenamingChatId(null) }}
                                  className="p-1 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    setRenamingChatId(chat.id)
                                    setRenameTitle(chat.title)
                                  }}
                                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  title="تعديل العنوان"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id) }}
                                  className="p-0.5 text-slate-400 hover:text-red-600"
                                  title="حذف"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
            })()
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-white/40 dark:bg-slate-900/10 backdrop-blur-md">
        
        {/* Chat Header */}
        <div className="flex min-h-14 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-3">
          <div className="flex items-center gap-3">
            {!isHistoryOpen && (
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="عرض السجل الجانبي"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>
            )}
            {activeChat ? (
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-50 dark:bg-orange-950 p-2 text-terracotta">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-sm font-extrabold text-slate-900 dark:text-white">{activeChat.title}</h1>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span>البدء: {new Date(activeChat.created_at).toLocaleDateString('ar-SA')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      inferredContext?.last_response_type === 'clarification'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'bg-orange-50 dark:bg-orange-950/40 text-terracotta'
                    }`}>
                      {focusLabel()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <Leaf className="h-5 w-5 text-terracotta" />
                <span className="text-sm font-bold">خبير المشتل الرقمي</span>
              </div>
            )}
          </div>
        </div>

        {/* Conversation bubbles area */}
        <div ref={chatScrollContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-6 space-y-6 relative">
          {!activeChat ? (
            <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-orange-500/20 rounded-full" />
                <div className="relative rounded-2xl bg-orange-50 dark:bg-orange-950 p-5 text-terracotta">
                  <Leaf className="h-12 w-12" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">مرحباً بك في خبير المشتل الرقمي</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  يمكنك السؤال مباشرة عن أي حوض أو دورة أو مخزون. اختيارات التركيز السريع تساعد الخبير الرقمي فقط ولا تقيد المحادثة.
                </p>
              </div>

              {/* Suggestions */}
              <div className="w-full grid grid-cols-2 gap-3 pt-2">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(chip.text)}
                    className="flex items-start gap-3 p-3 text-right rounded-xl border border-slate-100 bg-white hover:border-terracotta hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-terracotta/60 transition-all text-slate-700 dark:text-slate-300"
                  >
                    <chip.icon className="h-4.5 w-4.5 shrink-0 text-terracotta mt-0.5" />
                    <span className="text-xs font-bold leading-normal">{chip.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : loadingMessages ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-terracotta mb-2" />
              <span className="text-xs font-bold">جاري تحميل المحادثة...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map(message => {
                const isModel = message.role === 'model'
                const isSystem = message.role === 'system'

                if (isSystem) {
                  return (
                    <div key={message.id} className="flex justify-center my-3">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 px-3.5 py-2 text-xs font-bold text-terracotta border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/40">
                        <Activity className="h-3.5 w-3.5" />
                        {message.content}
                      </span>
                    </div>
                  )
                }

                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 max-w-[85%] ${isModel ? 'mr-auto flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs ${
                      isModel 
                        ? 'bg-orange-50 dark:bg-orange-950 text-terracotta' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {isModel ? <Leaf className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <div className={`rounded-2xl p-4 shadow-sm ${
                        isModel 
                          ? 'bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100' 
                          : 'bg-terracotta text-white'
                      }`}>
                        {isModel ? formatMessageContent(message.content) : <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>}
                      </div>

                      {/* Message Actions Toolbar */}
                      <div className={`flex items-center gap-3 text-[10px] ${isModel ? 'justify-end' : 'justify-start'} text-slate-400 dark:text-slate-500 px-1`}>
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="hover:text-slate-600 dark:hover:text-slate-350 transition-colors flex items-center gap-1 font-semibold select-none"
                          title="نسخ نص الرسالة"
                        >
                          {copiedMessageId === message.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>نسخ</span>
                            </>
                          )}
                        </button>
                      </div>

                      {isModel && messageActionProposals[message.id] && (
                        <ActionCard
                          action={normalizeActionProposal(messageActionProposals[message.id])}
                          onExecute={() => handleActionExecute(normalizeActionProposal(messageActionProposals[message.id]))}
                          isExecuted={executedMessageIds[message.id]}
                        />
                      )}

                      {/* File attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.attachments.map((attach, i) => (
                            <a
                              key={i}
                              href={attach.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 max-w-xs transition-colors"
                            >
                              {attach.mime_type.startsWith('image/') ? (
                                <Image src={attach.url} alt={attach.name} className="h-8 w-8 rounded-lg object-cover" width={32} height={32} unoptimized />
                              ) : (
                                <FileText className="h-4 w-4 text-terracotta" />
                              )}
                              <span className="text-[10px] font-bold truncate">{attach.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Bot thinking placeholder */}
              {sendingMessage && (
                <div className="flex items-start gap-3 max-w-[85%] mr-auto flex-row-reverse">
                  <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-orange-50 dark:bg-orange-950 text-terracotta">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-slate-400 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-terracotta" />
                    <span className="text-xs font-bold text-slate-500">يقوم خبير المشتل بتحليل مدخلاتك...</span>
                  </div>
                </div>
              )}

              {telemetryEvents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {telemetryEvents.map(event => (
                    <span
                      key={event.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300"
                    >
                      <Activity className="h-3.5 w-3.5 text-blue-500" />
                      {telemetryLabel(event)}
                    </span>
                  ))}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
          {showScrollBottom && (
            <div className="sticky bottom-4 left-0 right-0 mx-auto w-fit z-20">
              <button
                type="button"
                onClick={scrollToBottom}
                className="bg-white/95 border border-slate-200/80 hover:bg-slate-50 text-slate-700 dark:bg-slate-900/90 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-200 shadow-md backdrop-blur-sm px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 animate-bounce text-terracotta dark:text-orange-400"
              >
                <ChevronDown className="h-4 w-4" />
                <span>النزول للأسفل</span>
              </button>
            </div>
          )}
        </div>

        {/* Input box section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 relative">
          
          {/* Active Context Indicators */}
          {(selectedBasinId || selectedCycleId) && (
            <div className="flex flex-wrap items-center gap-2 mb-3 p-2 rounded-xl bg-white/60 border border-slate-200/50 dark:bg-slate-900/60 dark:border-slate-800 text-[11px] font-bold text-slate-505 shadow-sm animate-fade-in">
              <span className="text-slate-400 select-none">التركيز الحالي:</span>
              {selectedBasinId && (
                <>
                  <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100/50 px-2.5 py-1 rounded-lg text-terracotta dark:bg-orange-950/30 dark:border-orange-900/30 shadow-sm">
                    <span>📍 حوض: {basins.find(b => b.id === selectedBasinId)?.name || `ID ${selectedBasinId}`}</span>
                    <button 
                      onClick={() => setSelectedBasinId(null)}
                      className="hover:text-red-500 font-bold p-0.5"
                      title="إزالة تركيز الحوض"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowStatsPanel(!showStatsPanel)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
                      showStatsPanel 
                        ? 'bg-orange-600 text-white border-orange-600' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                    <span>البيانات الحية</span>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-250 ${showStatsPanel ? 'rotate-180' : ''}`} />
                  </button>
                </>
              )}
              {selectedCycleId && (
                <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100/50 px-2.5 py-1 rounded-lg text-terracotta dark:bg-orange-950/30 dark:border-orange-900/30 shadow-sm">
                  <span>🌱 دورة: {cycles.find(c => c.id === selectedCycleId)?.name || `ID ${selectedCycleId}`}</span>
                  <button 
                    onClick={() => setSelectedCycleId(null)}
                    className="hover:text-red-500 font-bold p-0.5"
                    title="إزالة تركيز دورة الإنتاج"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Collapsible Basin Stats & Quick Actions Panel */}
          {selectedBasinId && showStatsPanel && (
            <div className="mb-3 p-3.5 rounded-xl bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 shadow-md animate-fade-in-up space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">البيانات الحية للحوض</span>
                <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-terracotta dark:bg-orange-950/40">متصل</span>
              </div>
              
              {loadingBasinStats ? (
                <div className="py-4 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-terracotta" />
                </div>
              ) : basinStats ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <div className="flex flex-col bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5">طريقة الري</span>
                    <span className="text-slate-800 dark:text-slate-200">{basinStats.basin?.irrigation_method || 'غير محدد'}</span>
                  </div>
                  <div className="flex flex-col bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5">الأشجار القائمة</span>
                    <span className="text-slate-800 dark:text-slate-200">{(basinStats.stats?.total_trees || 0).toLocaleString('ar-SA')} شجرة</span>
                  </div>
                  <div className="flex flex-col bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5">نسبة التشغيل</span>
                    <span className="text-terracotta dark:text-orange-400 font-mono">
                      {(basinStats.basin?.capacity || 0) > 0 
                        ? `${Math.round(((basinStats.stats?.total_trees || 0) / (basinStats.basin?.capacity || 1)) * 100)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="flex flex-col bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5">آخر ري</span>
                    <span className="text-slate-800 dark:text-slate-200 truncate">{basinStats.operations_stats?.last_irrigation || 'لا يوجد'}</span>
                  </div>
                  <div className="flex flex-col bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5">آخر تسميد</span>
                    <span className="text-slate-800 dark:text-slate-200 truncate">{basinStats.operations_stats?.last_fertilization || 'لا يوجد'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-slate-400">فشل تحميل تفاصيل الحوض.</div>
              )}

              {/* Inline Quick Action Shortcuts */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                <span className="text-[10px] font-bold text-slate-400 flex items-center ml-2">تسجيل سريع:</span>
                <button
                  type="button"
                  onClick={() => handleDirectShortcut('log_irrigation')}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/40 rounded-lg text-[10px] font-extrabold transition-all"
                >
                  💧 ري
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectShortcut('log_fertilization')}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-terracotta dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-900/40 rounded-lg text-[10px] font-extrabold transition-all"
                >
                  🌿 تسميد
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectShortcut('log_mortality')}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40 rounded-lg text-[10px] font-extrabold transition-all"
                >
                  ❌ نفوق
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectShortcut('transfer_cycle')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40 rounded-lg text-[10px] font-extrabold transition-all"
                >
                  🔄 نقل دورة
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectShortcut('start_cycle')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 rounded-lg text-[10px] font-extrabold transition-all"
                >
                  🌱 بدء دورة
                </button>
              </div>
            </div>
          )}


          {/* Autocomplete Quick Command Menu */}
          {showCommandMenu && filteredCommands.length > 0 && (
            <div className="absolute bottom-full mb-2 right-4 left-4 max-h-52 overflow-y-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-lg backdrop-blur-md p-1.5 z-20 animate-fade-in flex flex-col gap-0.5">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800/60 mb-1">
                الأوامر المقترحة (اضغط لتسجيل الإجراء مباشرة)
              </div>
              {filteredCommands.map(cmd => (
                <button
                  key={cmd.key}
                  type="button"
                  onClick={() => {
                    setInputMessage('')
                    if (activeChat?.id) {
                      setChatDrafts(prev => ({ ...prev, [activeChat.id]: '' }))
                    }
                    setShowCommandMenu(false)
                    handleDirectShortcut(cmd.action as KnownActionType)
                  }}
                  className="flex items-center justify-between px-3 py-2 text-right rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cmd.icon}</span>
                    <span className="font-extrabold text-terracotta dark:text-orange-400">{cmd.key}</span>
                    <span className="text-slate-400 font-semibold">- {cmd.label}</span>
                  </div>
                  <ChevronLeft className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {/* Selected attachment previews */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="relative flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-bold shadow-sm">
                  {file.type.startsWith('image/') && (
                    <Image src={URL.createObjectURL(file)} alt="preview" className="h-6 w-6 rounded-md object-cover" width={24} height={24} unoptimized />
                  )}
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button 
                    onClick={() => removeSelectedFile(idx)}
                    className="p-0.5 rounded-full hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Controls row */}
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              accept="image/*,audio/*,application/pdf"
              className="hidden" 
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-400 transition-all active:scale-95"
              title="إرفاق ملفات/صور"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={toggleRecording}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-400'
              }`}
              title={isRecording ? 'إيقاف الإملاء' : 'إملاء صوتي باللغة العربية'}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Quick Context Focus Dropdowns */}
            <div className="relative shrink-0 select-none hidden md:block">
              <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedBasinId || ''}
                onChange={e => setSelectedBasinId(e.target.value ? Number(e.target.value) : null)}
                className="h-11 pr-8 pl-6 text-xs font-bold rounded-xl border border-slate-100 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none transition-all cursor-pointer appearance-none min-w-[110px] max-w-[140px] shadow-sm focus:border-terracotta"
                title="تركيز الحوض"
              >
                <option value="">بدون حوض</option>
                {basins.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative shrink-0 select-none hidden md:block">
              <Sprout className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedCycleId || ''}
                onChange={e => setSelectedCycleId(e.target.value ? Number(e.target.value) : null)}
                className="h-11 pr-8 pl-6 text-xs font-bold rounded-xl border border-slate-100 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none transition-all cursor-pointer appearance-none min-w-[110px] max-w-[140px] shadow-sm focus:border-terracotta"
                title="تركيز دورة الإنتاج"
              >
                <option value="">بدون دورة</option>
                {cycles.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            {isRecording && (
              <div className="flex items-center gap-1 px-3 py-1 bg-red-50/80 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-xl h-11 shrink-0">
                <span className="text-[10px] font-bold text-red-500 animate-pulse ml-1 select-none">جاري التسجيل...</span>
                <div className="flex items-center gap-0.5 h-5">
                  <div className="w-[2.5px] bg-red-500 dark:bg-red-400 rounded-full animate-bounce h-2" style={{ animationDelay: '0.1s' }} />
                  <div className="w-[2.5px] bg-red-500 dark:bg-red-400 rounded-full animate-bounce h-4" style={{ animationDelay: '0.2s' }} />
                  <div className="w-[2.5px] bg-red-500 dark:bg-red-400 rounded-full animate-bounce h-3" style={{ animationDelay: '0.3s' }} />
                  <div className="w-[2.5px] bg-red-500 dark:bg-red-400 rounded-full animate-bounce h-5" style={{ animationDelay: '0.4s' }} />
                  <div className="w-[2.5px] bg-red-500 dark:bg-red-400 rounded-full animate-bounce h-2" style={{ animationDelay: '0.5s' }} />
                  <div className="w-[2.5px] bg-red-500 dark:bg-red-400 rounded-full animate-bounce h-4" style={{ animationDelay: '0.6s' }} />
                </div>
              </div>
            )}

            <input
              type="text"
              value={inputMessage}
              onChange={e => {
                const val = e.target.value
                setInputMessage(val)
                if (activeChat?.id) {
                  setChatDrafts(prev => ({ ...prev, [activeChat.id]: val }))
                }
                if (val.startsWith('/')) {
                  setShowCommandMenu(true)
                } else {
                  setShowCommandMenu(false)
                }
              }}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder={isRecording ? 'جاري الاستماع لصوتك...' : 'اسأل خبير المشتل الرقمي عن أي حوض أو إجراء (أو اكتب / للأوامر السريعة)...'}
              disabled={sendingMessage}
              className="flex-1 min-h-11 rounded-xl border border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none transition-all focus:border-terracotta dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />

            <button
              type="button"
              disabled={sendingMessage}
              onClick={() => handleSendMessage()}
              className="flex h-11 px-5 items-center justify-center rounded-xl bg-terracotta text-white hover:bg-terracotta-hover disabled:opacity-50 transition-all active:scale-95 font-bold text-sm gap-2 shadow-sm"
            >
              {sendingMessage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 rotate-180" />
                  <span>إرسال</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>



      {/* Action execution confirmation popup dialog modals */}
      <AppDialog open={activeAction !== null} onClose={handleActionCancel} panelClassName="max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <Leaf className="h-6 w-6 text-terracotta" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">تأكيد عملية الذكاء الاصطناعي</h2>
          </div>

          {actionError && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-start gap-2 text-xs font-bold">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Form inputs depending on the action type */}
          {(activeAction?.action === 'log_irrigation' ||
            activeAction?.action === 'log_mortality' ||
            activeAction?.action === 'log_fertilization' ||
            activeAction?.action === 'start_cycle' ||
            activeAction?.action === 'add_trees') && (
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 mb-1">الحوض المستهدف</label>
              <select
                value={dialogBasinId}
                onChange={e => setDialogBasinId(Number(e.target.value))}
                className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value={0}>اختر حوض...</option>
                {basins.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {renderFieldErrors('basin_id')}
            </div>
          )}

          {activeAction?.action === 'log_irrigation' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ عملية الري</label>
                <input 
                  type="date" 
                  value={irrigationDate} 
                  onChange={e => setIrrigationDate(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
                {renderFieldErrors('irrigation_date')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">فترة الري</label>
                  <select
                    value={irrigationPeriod}
                    onChange={e => {
                      const value = e.target.value
                      setIrrigationPeriod(value === 'evening' ? 'evening' : 'morning')
                    }}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="morning">صباحية</option>
                    <option value="evening">مسائية</option>
                  </select>
                  {renderFieldErrors('period')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">وقت البدء</label>
                  <input 
                    type="time" 
                    value={irrigationStartTime} 
                    onChange={e => setIrrigationStartTime(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('start_time')}
                </div>
              </div>
            </div>
          )}

          {activeAction?.action === 'log_mortality' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">رقم الخط</label>
                  <input 
                    type="number" 
                    value={mortalityLine} 
                    onChange={e => setMortalityLine(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('line_number')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الكمية النافقة</label>
                  <input 
                    type="number" 
                    value={mortalityQuantity} 
                    onChange={e => setMortalityQuantity(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('quantity')}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ النفوق</label>
                <input 
                  type="date" 
                  value={mortalityDate} 
                  onChange={e => setMortalityDate(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
                {renderFieldErrors('mortality_date')}
              </div>
            </div>
          )}

          {activeAction?.action === 'log_fertilization' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">نوع السماد المستخدم</label>
                <select
                  value={fertilizerId}
                  onChange={e => setFertilizerId(Number(e.target.value))}
                  className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value={0}>اختر سماد...</option>
                  {fertilizers.map(f => (
                    <option key={f.id} value={f.id}>{f.name} (المتوفر: {f.quantity} {f.unit})</option>
                  ))}
                </select>
                {renderFieldErrors('fertilizer_id')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الكمية لكل حوض</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={fertilizationQuantity} 
                    onChange={e => setFertilizationQuantity(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('quantity')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ التسميد</label>
                  <input 
                    type="date" 
                    value={fertilizationDate} 
                    onChange={e => setFertilizationDate(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('fertilization_date')}
                </div>
              </div>
            </div>
          )}

          {activeAction?.action === 'transfer_cycle' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">عدد الشتلات الناجحة</label>
                  <input 
                    type="number" 
                    value={transferSuccessCount} 
                    onChange={e => setTransferSuccessCount(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('successful_count')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ النقل</label>
                  <input 
                    type="date" 
                    value={transferDate} 
                    onChange={e => setTransferDate(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('transfer_date')}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الحوض المستهدف</label>
                  <select
                    value={transferBasinId}
                    onChange={e => setTransferBasinId(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value={0}>اختر حوض...</option>
                    {basins.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {renderFieldErrors('basin_id')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">رقم خط النقل</label>
                  <input 
                    type="number" 
                    value={transferLineNumber} 
                    onChange={e => setTransferLineNumber(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('line_number')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="markRemainingFailed"
                  checked={transferMarkRemainingFailed}
                  onChange={e => setTransferMarkRemainingFailed(e.target.checked)}
                  className="rounded text-terracotta focus:ring-orange-500"
                />
                <label htmlFor="markRemainingFailed" className="text-xs font-bold text-slate-600 dark:text-slate-300">اعتبار باقي البذور غير ناجحة وإنهاء الدورة</label>
              </div>
            </div>
          )}

          {activeAction?.action === 'start_cycle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم دورة الإنتاج</label>
                <input
                  type="text"
                  value={cycleName}
                  onChange={e => setCycleName(e.target.value)}
                  placeholder="مثال: دورة إنتاج الصبار الربع الثاني"
                  className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
                {renderFieldErrors('name')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">نوع الشجرة (الصنف)</label>
                  <select
                    value={cycleTreeTypeId || ''}
                    onChange={e => setCycleTreeTypeId(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value={0}>اختر صنف...</option>
                    {varieties.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  {renderFieldErrors('tree_type_id')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الكمية/العدد</label>
                  <input
                    type="number"
                    value={cycleCount}
                    onChange={e => setCycleCount(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('count')}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">طريقة الإكثار</label>
                  <select
                    value={cyclePropagationType || ''}
                    onChange={e => setCyclePropagationType(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">غير محدد</option>
                    <option value="seeds">بذور</option>
                    <option value="cuttings">عقل</option>
                    <option value="grafting">تطعيم</option>
                    <option value="layering">ترقيد</option>
                  </select>
                  {renderFieldErrors('propagation_type')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">حجم الأصيص</label>
                  <select
                    value={cyclePotSize || ''}
                    onChange={e => setCyclePotSize(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">غير محدد</option>
                    {potSizes.map((size, idx) => (
                      <option key={idx} value={size}>{size}</option>
                    ))}
                  </select>
                  {renderFieldErrors('pot_size')}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    value={cycleStartDate}
                    onChange={e => setCycleStartDate(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('start_date')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">مصدر البذور/الشتلات</label>
                  <input
                    type="text"
                    value={cycleSource}
                    onChange={e => setCycleSource(e.target.value)}
                    placeholder="مثال: مورد خارجي"
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('source')}
                </div>
              </div>
            </div>
          )}

          {activeAction?.action === 'add_trees' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">نوع الشجرة (الصنف)</label>
                  <select
                    value={treeTypeId || ''}
                    onChange={e => setTreeTypeId(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value={0}>اختر صنف...</option>
                    {varieties.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  {renderFieldErrors('lines.0.tree_type_id') || renderFieldErrors('tree_type_id')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الكمية/العدد</label>
                  <input
                    type="number"
                    value={treeQuantity}
                    onChange={e => setTreeQuantity(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('lines.0.quantity') || renderFieldErrors('quantity')}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">رقم الخط</label>
                  <input
                    type="number"
                    value={treeLineNumber}
                    onChange={e => setTreeLineNumber(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('lines.0.line_number') || renderFieldErrors('line_number')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">حجم الأصيص</label>
                  <select
                    value={treePotSize || ''}
                    onChange={e => setTreePotSize(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">غير محدد</option>
                    {potSizes.map((size, idx) => (
                      <option key={idx} value={size}>{size}</option>
                    ))}
                  </select>
                  {renderFieldErrors('lines.0.pot_size') || renderFieldErrors('pot_size')}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الارتفاع (متر)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={treeHeight}
                    onChange={e => setTreeHeight(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('lines.0.height') || renderFieldErrors('height')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">السماكة (سم)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={treeThickness}
                    onChange={e => setTreeThickness(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('lines.0.thickness') || renderFieldErrors('thickness')}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ إضافة الشجر</label>
                <input
                  type="date"
                  value={treeBirthDate}
                  onChange={e => setTreeBirthDate(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
                {renderFieldErrors('lines.0.birth_date') || renderFieldErrors('birth_date')}
              </div>
            </div>
          )}

          {activeAction?.action === 'create_basin' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">القسم المستهدف</label>
                <select
                  value={basinSectionId || ''}
                  onChange={e => setBasinSectionId(Number(e.target.value))}
                  className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value={0}>اختر قسم...</option>
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {renderFieldErrors('section_id')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الاسم الأساسي</label>
                  <input
                    type="text"
                    value={basinBaseName}
                    onChange={e => setBasinBaseName(e.target.value)}
                    placeholder="مثال: حوض A"
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('base_name')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">عدد الأحواض</label>
                  <input
                    type="number"
                    value={basinCount}
                    onChange={e => setBasinCount(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('count')}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الطول بالمتر</label>
                  <input
                    type="number"
                    step="0.1"
                    value={basinLength}
                    onChange={e => setBasinLength(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('length')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">العرض بالمتر</label>
                  <input
                    type="number"
                    step="0.1"
                    value={basinWidth}
                    onChange={e => setBasinWidth(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('width')}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">طريقة الري</label>
                <select
                  value={basinIrrigationMethod}
                  onChange={e => setBasinIrrigationMethod(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">غير محدد</option>
                  <option value="sprinkler">مرشات (Sprinkler)</option>
                  <option value="drip">تنقيط (Drip)</option>
                  <option value="flooding">غمر (Flooding)</option>
                  <option value="manual">يدوي (Manual)</option>
                </select>
                {renderFieldErrors('irrigation_method')}
              </div>
            </div>
          )}

          {activeAction?.action === 'log_procedure' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">دورة الإنتاج</label>
                <select
                  value={procedureCycleId || ''}
                  onChange={e => setProcedureCycleId(Number(e.target.value))}
                  className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value={0}>اختر دورة إنتاج...</option>
                  {cycles.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {renderFieldErrors('cycle_id')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">نوع الإجراء</label>
                  <select
                    value={procedureType}
                    onChange={e => {
                      const val = e.target.value
                      if (val === 'irrigation' || val === 'inspection' || val === 'humidity') {
                        setProcedureType(val)
                      }
                    }}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="irrigation">ري (Irrigation)</option>
                    <option value="inspection">فحص ومراقبة (Inspection)</option>
                    <option value="humidity">قياس رطوبة (Humidity)</option>
                  </select>
                  {renderFieldErrors('procedure_type')}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الإجراء</label>
                  <input
                    type="date"
                    value={procedureDate}
                    onChange={e => setProcedureDate(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('procedure_date')}
                </div>
              </div>

              {procedureType !== 'humidity' ? (
                <div className="grid grid-cols-3 gap-2 animate-fade-in-up">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">الفترة</label>
                    <select
                      value={procedurePeriod}
                      onChange={e => setProcedurePeriod(e.target.value)}
                      className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">غير محدد</option>
                      <option value="morning">صباحية</option>
                      <option value="evening">مسائية</option>
                    </select>
                    {renderFieldErrors('period')}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">وقت البدء</label>
                    <input
                      type="time"
                      value={procedureStartTime}
                      onChange={e => setProcedureStartTime(e.target.value)}
                      className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                    {renderFieldErrors('start_time')}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">وقت الانتهاء</label>
                    <input
                      type="time"
                      value={procedureEndTime}
                      onChange={e => setProcedureEndTime(e.target.value)}
                      className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                    {renderFieldErrors('end_time')}
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in-up">
                  <label className="block text-xs font-bold text-slate-500 mb-1">نسبة الرطوبة (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={procedureHumidity}
                    onChange={e => setProcedureHumidity(e.target.value ? Number(e.target.value) : '')}
                    placeholder="نسبة مئوية"
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {renderFieldErrors('humidity_percentage')}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ملاحظات إضافية</label>
                <textarea
                  value={procedureNotes}
                  onChange={e => setProcedureNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات حول الإجراء..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
                {renderFieldErrors('notes')}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              onClick={handleActionCancel}
              className="min-h-11 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={submitAction}
              disabled={actionSubmitting}
              className="min-h-11 px-6 py-2 rounded-xl text-sm font-bold text-white bg-terracotta hover:bg-terracotta-hover disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {actionSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>تأكيد وتسجيل</span>
            </button>
          </div>
        </div>
      </AppDialog>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

// Inline AI Action Card Renderer
function ActionCard({ 
  action, 
  onExecute, 
  isExecuted = false 
}: { 
  action: ActiveAction; 
  onExecute: () => void; 
  isExecuted?: boolean; 
}) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    log_irrigation: Waves,
    log_mortality: AlertCircle,
    log_fertilization: Sprout,
    transfer_cycle: Layers3,
    start_cycle: Sprout,
    create_basin: Warehouse,
    log_procedure: Activity
  }

  const ActionIcon = isExecuted ? Check : (icons[action.action] || HelpCircle)
  const actionTitle = actionTitles[action.action] || 'إجراء مقترح'
  const canExecute = Boolean(actionRegistry[action.action as KnownActionType]) && !isExecuted

  return (
    <div className={`rounded-2xl border transition-all duration-300 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
      isExecuted 
        ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20' 
        : 'border-orange-100 bg-orange-50/50 dark:border-orange-900/40 dark:bg-orange-950/20'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2.5 shrink-0 ${
          isExecuted 
            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400' 
            : 'bg-orange-100 dark:bg-orange-900/60 text-terracotta'
        }`}>
          <ActionIcon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>{actionTitle}</span>
            {isExecuted && (
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full select-none">تم التنفيذ</span>
            )}
          </h4>
          {action.human_summary && (
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">{action.human_summary}</p>
          )}
          
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-semibold">
            {action.basin_name && (
              <span>الحوض: {action.basin_name}</span>
            )}
            {action.cycle_name && (
              <span>الدورة: {action.cycle_name}</span>
            )}
            {action.date && (
              <span>التاريخ: {action.date}</span>
            )}
            {action.period && (
              <span>الفترة: {action.period === 'morning' ? 'صباحية' : 'مسائية'}</span>
            )}
            {action.quantity && (
              <span>الكمية: {action.quantity}</span>
            )}
            {action.line_number && (
              <span>الخط: {action.line_number}</span>
            )}
            {action.successful_count && (
              <span>الشتلات الناجحة: {action.successful_count}</span>
            )}
          </div>
          
          {action.notes && (
            <p className="text-[11px] text-slate-400 mt-1 italic">ملاحظة: {action.notes}</p>
          )}
        </div>
      </div>

      {isExecuted ? (
        <div className="flex items-center gap-1.5 text-emerald-650 dark:text-emerald-400 font-extrabold text-xs px-3 py-1.5 rounded-lg bg-emerald-100/30 dark:bg-emerald-950/40 select-none">
          <Check className="h-4 w-4" />
          <span>تم التسجيل والعمل بنجاح</span>
        </div>
      ) : (
        <button
          onClick={onExecute}
          disabled={!canExecute}
          className="min-h-9 px-4 py-1.5 shrink-0 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>{canExecute ? 'تأكيد الإجراء' : 'يفتح من النموذج القياسي'}</span>
        </button>
      )}
    </div>
  )
}

function telemetryLabel(event: TelemetryEvent) {
  const toolNames: Record<string, string> = {
    search_basins: 'البحث في الأحواض',
    search_cycles: 'البحث في الدورات',
    get_inventory: 'فحص المخزون',
    get_recent_operations: 'جلب العمليات الأخيرة',
    search_seedling_basins: 'تحليل أحواض الشتلات',
    search_varieties: 'البحث في الأصناف',
    get_tree_guide: 'قراءة دليل الأشجار',
    get_nursery_analytics: 'جلب تحليلات المشتل',
  }

  const toolLabel = event.tool ? (toolNames[event.tool] || event.tool) : 'أداة'
  if (event.event === 'telemetry.tool_start') return `${toolLabel}...`
  if (event.ok === false) return `${toolLabel}: تعذر التنفيذ`
  if (typeof event.count === 'number') return `${toolLabel}: ${event.count} نتيجة`
  return toolLabel
}

// Premium code block renderer with copy function
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (typeof navigator === 'undefined') return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-3.5 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 shadow-sm" dir="ltr">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100/70 border-b border-slate-200/80 text-[10px] text-slate-500 font-mono select-none dark:bg-slate-900/40 dark:border-slate-800" dir="rtl">
        <span className="font-sans font-bold">كتلة كود</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-white transition-colors font-sans font-bold"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-500">تم النسخ!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>نسخ</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}
