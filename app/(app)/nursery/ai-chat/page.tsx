'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { 
  Bot, 
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
  Sparkles, 
  Layers3, 
  FileText,
  HelpCircle,
  Warehouse,
  ChevronLeft,
  Activity
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import { apiRequest } from '@/lib/api/client'
import { nurseryManagementApi } from '@/lib/api/nurseryManagement'
import { actionRegistry, actionTitles } from './_lib/actionRegistry'
import { contextHintsFromPath } from './_lib/contextHints'
import { sendNurseryMessageStream } from './_lib/streaming'
import { supportsMediaRecorder, transcribeAudio } from './_lib/voice'
import type { TelemetryEvent } from './_lib/types'

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

  // State Management
  const [chats, setChats] = useState<NurseryChat[]>([])
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
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null)

  // DB options for contextualization
  const [basins, setBasins] = useState<BasinOption[]>([])
  const [cycles, setCycles] = useState<CycleOption[]>([])
  const [fertilizers, setFertizers] = useState<FertilizerOption[]>([])

  // Live Basin Dashboard Stats
  const [basinStats, setBasinStats] = useState<BasinStats | null>(null)
  const [loadingBasinStats, setLoadingBasinStats] = useState(false)

  // Inline rename state
  const [renamingChatId, setRenamingChatId] = useState<number | null>(null)
  const [renameTitle, setRenameTitle] = useState('')

  // Speech-to-Text State
  const [isRecording, setIsRecording] = useState(false)
  const [voiceMode, setVoiceMode] = useState<'backend' | 'browser' | 'unavailable'>('unavailable')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])

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
    }
  }, [activeChat])

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sendingMessage])

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
      }

      // Fetch fertilizers from general operations context
      const nurseryId = dashboardData?.data?.nurseries?.[0]?.id
      if (nurseryId) {
        const operationOptions = await apiRequest<GeneralOperationOptionsResponse>(`/nursery/manage/general-operations?type=nursery&id=${nurseryId}`).catch(() => null)
        if (operationOptions?.data?.fertilizers) {
          setFertizers(operationOptions.data.fertilizers)
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
      if (response.data) {
        setBasinStats(response.data as BasinStats)
      }
    } catch (err) {
      console.error('Failed to fetch basin stats:', err)
    } finally {
      setLoadingBasinStats(false)
    }
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
      alert('إدخال الصوت غير مدعوم في هذا المتصفح.')
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
            alert('تعذر تفريغ التسجيل الصوتي حالياً.')
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
        alert('إدخال الصوت غير مدعوم في هذا المتصفح.')
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
    try {
      const data = await apiRequest<{ success: boolean; messages: NurseryChatMessage[] }>(`/nursery/chats/${chat.id}`)
      if (data.success) {
        setMessages(data.messages || [])
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
    const text = textToSend !== undefined ? textToSend : inputMessage
    if (!text.trim() && selectedFiles.length === 0) return
    
    let currentChat = activeChat
    if (!currentChat) {
      // Auto-create chat if none active
      const titleText = text.length > 30 ? text.substring(0, 30) + '...' : text
      const hints = buildClientContextHints()
      const payload = {
        title: titleText,
        client_context_hints: Object.keys(hints).length ? hints : undefined,
      }
      
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
        alert('فشل في بدء جلسة محادثة جديدة.')
        return
      }
    }

    setSendingMessage(true)
    setTelemetryEvents([])
    if (textToSend === undefined) {
      setInputMessage('')
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

      // Clear files list early for optimistic look
      setSelectedFiles([])

      let streamedModelId: number | null = null
      let streamedContent = ''
      let streamStarted = false

      try {
        await sendNurseryMessageStream(currentChat.id, formData, {
          onUserMessage: userMessage => {
            streamStarted = true
            setMessages(prev => [...prev, userMessage])
          },
          onTelemetry: event => {
            setTelemetryEvents(prev => [event, ...prev].slice(0, 4))
          },
          onDelta: delta => {
            streamStarted = true
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
        await sendMessageBlocking(currentChat.id, formData)
      }

      fetchChats()
    } catch (err: unknown) {
      console.error('Failed to send message:', err)
      alert(errorMessage(err, 'فشل في إرسال الرسالة للمستشار الذكي.'))
    } finally {
      setSendingMessage(false)
    }
  }

  async function sendMessageBlocking(chatId: number, formData: FormData) {
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
        const hasUserMessage = prev.some(message => message.id === response.user_message.id)
        const hasModelMessage = prev.some(message => message.id === modelMessage.id)

        return [
          ...prev,
          ...(hasUserMessage ? [] : [response.user_message]),
          ...(hasModelMessage ? [] : [modelMessage]),
        ]
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
    if (sendingMessage) return
    handleSendMessage(suggestion)
  }

  // Quick Action execution: Pre-fill form state and open appropriate dialog modal
  function handleActionExecute(actionObj: ActiveAction) {
    setActiveAction(actionObj)
    setActionError(null)

    const todayString = new Date().toISOString().split('T')[0]

    if (actionObj.action === 'log_irrigation') {
      setIrrigationDate(actionObj.date || todayString)
      setIrrigationPeriod(actionObj.period || 'morning')
      setIrrigationStartTime(actionObj.start_time || '07:00')
      setIrrigationEndTime(actionObj.end_time || '08:00')
    } else if (actionObj.action === 'log_mortality') {
      setMortalityLine(actionObj.line_number || 1)
      setMortalityQuantity(actionObj.quantity || 1)
      setMortalityDate(actionObj.date || actionObj.mortality_date || todayString)
    } else if (actionObj.action === 'log_fertilization') {
      setFertilizationDate(actionObj.date || actionObj.fertilization_date || todayString)
      setFertilizationQuantity(actionObj.quantity || 1)
      
      // Try resolving fertilizer id from suggestions
      if (actionObj.fertilizer_id) {
        setFertilizerId(Number(actionObj.fertilizer_id))
      } else {
        setFertilizerId(fertilizers[0]?.id || 0)
      }
    } else if (actionObj.action === 'transfer_cycle') {
      setTransferSuccessCount(actionObj.successful_count || 1)
      setTransferMarkRemainingFailed(actionObj.mark_remaining_failed !== false)
      setTransferDate(actionObj.date || todayString)
      setTransferBasinId(actionObj.basin_id || basins[0]?.id || 0)
      setTransferLineNumber(actionObj.line_number || 1)
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
  }

  // Commit dynamic database operations from AI Action Card or Dashboard Shortcut
  async function submitAction() {
    if (!activeAction) return
    setActionSubmitting(true)
    setActionError(null)

    const targetBasinId = activeAction.basin_id || selectedBasinId || activeChat?.context_basin_id

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

      // Reload live stats
      if (targetBasinId) {
        loadBasinStats(Number(targetBasinId))
      }

      setActiveAction(null)
    } catch (err: unknown) {
      console.error('Failed to commit action:', err)
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
      <div key={key} className="my-3 max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-full border-collapse text-right text-xs" dir="rtl">
          <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <tr>
              {headers.map((header, index) => (
                <th key={`${key}-h-${index}`} className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-extrabold dark:border-slate-700">
                  {renderTextWithBold(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${key}-r-${rowIndex}`} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-900/60">
                {headers.map((_, cellIndex) => (
                  <td key={`${key}-r-${rowIndex}-c-${cellIndex}`} className="align-top border-b border-slate-100 px-3 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-200">
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
        <pre key={`code-${cardKey++}`} className="my-2 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs font-mono text-white/95 leading-normal" dir="ltr">
          <code>{jsonText}</code>
        </pre>
      )
      
      lastIndex = codeBlockRegex.lastIndex
    }

    if (lastIndex < content.length) {
      parts.push(...renderMarkdownText(content.substring(lastIndex)))
    }

    return <div className="space-y-2 leading-relaxed text-slate-700 dark:text-slate-200 text-sm">{parts}</div>
  }

  // Suggestion chips definitions
  const suggestionChips = [
    { text: 'ما هي حالة الحوض الحالي وجدول ريّه؟', icon: Waves },
    { text: 'اقترح برنامج تسميد لدورة الإنتاج النشطة', icon: Sprout },
    { text: 'كيف أشخص أوراق النبات الصفراء المصابة؟', icon: AlertCircle },
    { text: 'اعرض ملخص العمليات الأخيرة بالمشتل', icon: FileText }
  ]

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-0 w-full overflow-hidden rounded-2xl border border-slate-100 bg-[#f8fafc] dark:border-slate-800 dark:bg-slate-950 font-sans" dir="rtl">
      
      {/* Pane 1. Previous consultations history sidebar */}
      <div className="flex w-64 shrink-0 flex-col border-l border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/40">
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">الاستشارات السابقة</h2>
          <button 
            onClick={() => handleCreateChat()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-terracotta hover:bg-orange-100 dark:bg-orange-950/20 dark:text-orange-400 transition-colors"
            title="محادثة جديدة"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingChats ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-terracotta mb-2" />
              <span className="text-[11px] font-bold">جاري تحميل الاستشارات...</span>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">لا توجد استشارات سابقة.</div>
          ) : (
            chats.map(chat => {
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
                        onKeyDown={e => e.key === 'Enter' && handleRenameChat(chat.id)}
                        className="w-full text-xs font-bold border border-terracotta rounded px-1.5 py-0.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                        autoFocus
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
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
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
            })
          )}
        </div>
      </div>

      {/* Pane 2. Central Active Chat thread workspace */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900/20 border-l border-slate-100 dark:border-slate-800">
        
        {/* Chat Header */}
        <div className="flex min-h-14 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-3">
          {activeChat ? (
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-50 dark:bg-orange-950 p-2 text-terracotta">
                <Bot className="h-5 w-5" />
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
              <Sparkles className="h-5 w-5 text-terracotta" />
              <span className="text-sm font-bold">المستشار الزراعي الذكي</span>
            </div>
          )}
        </div>

        {/* Conversation bubbles area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!activeChat ? (
            <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-orange-500/20 rounded-full" />
                <div className="relative rounded-2xl bg-orange-50 dark:bg-orange-950 p-5 text-terracotta">
                  <Bot className="h-12 w-12" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">مرحباً بك في المستشار الزراعي الذكي</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  يمكنك السؤال مباشرة عن أي حوض أو دورة أو مخزون. اختيارات التركيز السريع تساعد المستشار فقط ولا تقيد المحادثة.
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
                    className={`flex items-start gap-3 max-w-[85%] ${isModel ? '' : 'mr-auto flex-row-reverse'}`}
                  >
                    {/* Avatar */}
                    <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs ${
                      isModel 
                        ? 'bg-orange-50 dark:bg-orange-950 text-terracotta' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {isModel ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
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

                      {isModel && messageActionProposals[message.id] && (
                        <ActionCard
                          action={normalizeActionProposal(messageActionProposals[message.id])}
                          onExecute={() => handleActionExecute(normalizeActionProposal(messageActionProposals[message.id]))}
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
                                <img src={attach.url} alt={attach.name} className="h-8 w-8 rounded-lg object-cover" />
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
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-orange-50 dark:bg-orange-950 text-terracotta">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-slate-400 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-terracotta" />
                    <span className="text-xs font-bold text-slate-500">يقوم المستشار الذكي بتحليل مدخلاتك...</span>
                  </div>
                </div>
              )}

              {telemetryEvents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {telemetryEvents.map(event => (
                    <span
                      key={event.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-subtle px-2.5 py-1 text-xs font-bold text-ink-soft"
                    >
                      <Activity className="h-3.5 w-3.5 text-info" />
                      {telemetryLabel(event)}
                    </span>
                  ))}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input box section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          
          {/* Selected attachment previews */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="relative flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-bold shadow-sm">
                  {file.type.startsWith('image/') && (
                    <img src={URL.createObjectURL(file)} alt="preview" className="h-6 w-6 rounded-md object-cover" />
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

            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder={isRecording ? 'جاري الاستماع لصوتك...' : 'اسأل المستشار الزراعي الذكي عن أي حوض أو إجراء...'}
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

      {/* Pane 3. Right Pane: Quick Focus Stats Dashboard & Direct Operations Shortcuts */}
      <div className="flex w-72 shrink-0 flex-col bg-white border-r border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-4 space-y-4 overflow-y-auto">
        
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-extrabold text-slate-500">تركيز سريع اختياري</h3>
          
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">الحوض</label>
              <select
                value={selectedBasinId || ''}
                onChange={e => setSelectedBasinId(e.target.value ? Number(e.target.value) : null)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-2 outline-none text-slate-700 dark:text-slate-300 focus:border-terracotta focus:ring-1 focus:ring-orange-100"
              >
                <option value="">بدون تركيز سريع...</option>
                {basins.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">دورة الإنتاج</label>
              <select
                value={selectedCycleId || ''}
                onChange={e => setSelectedCycleId(e.target.value ? Number(e.target.value) : null)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-2 outline-none text-slate-700 dark:text-slate-300 focus:border-terracotta focus:ring-1 focus:ring-orange-100"
              >
                <option value="">بدون تركيز سريع...</option>
                {cycles.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Basin Stats Summary panel */}
        {selectedBasinId ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">البيانات الحية للحوض</span>
                <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-terracotta">متصل</span>
              </div>

              {loadingBasinStats ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-terracotta" />
                </div>
              ) : basinStats ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">اسم الحوض:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{basinStats.basin?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">طريقة الري:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{basinStats.basin?.irrigation_method || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الأشجار القائمة:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{(basinStats.stats?.total_trees || 0).toLocaleString('ar-SA')} شجرة</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">نسبة التشغيل:</span>
                    <span className="font-mono font-bold text-terracotta">
                      {(basinStats.basin?.capacity || 0) > 0 
                        ? `${Math.round(((basinStats.stats?.total_trees || 0) / (basinStats.basin?.capacity || 1)) * 100)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">آخر ري:</span>
                    <span className="font-bold text-slate-600 dark:text-slate-300">{basinStats.operations_stats?.last_irrigation || 'لا يوجد سجل'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">آخر تسميد:</span>
                    <span className="font-bold text-slate-600 dark:text-slate-300">{basinStats.operations_stats?.last_fertilization || 'لا يوجد سجل'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">فشل تحميل تفاصيل الحوض.</div>
              )}
            </div>

            {/* Direct quick operations shortcuts */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">تسجيل عمليات مباشرة</span>
              
              <button
                onClick={() => handleDirectShortcut('log_irrigation')}
                className="w-full text-right p-2.5 rounded-xl border border-slate-100 bg-white hover:border-terracotta dark:border-slate-800 dark:bg-slate-900/40 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">💧</span>
                  <span>تسجيل عملية ري سريعة</span>
                </div>
                <ChevronLeft className="h-3.5 w-3.5 text-slate-300 group-hover:text-terracotta transition-colors" />
              </button>

              <button
                onClick={() => handleDirectShortcut('log_fertilization')}
                className="w-full text-right p-2.5 rounded-xl border border-slate-100 bg-white hover:border-terracotta dark:border-slate-800 dark:bg-slate-900/40 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-orange-50 text-terracotta flex items-center justify-center">🌿</span>
                  <span>تسجيل عملية تسميد سريعة</span>
                </div>
                <ChevronLeft className="h-3.5 w-3.5 text-slate-300 group-hover:text-terracotta transition-colors" />
              </button>

              <button
                onClick={() => handleDirectShortcut('log_mortality')}
                className="w-full text-right p-2.5 rounded-xl border border-slate-100 bg-white hover:border-terracotta dark:border-slate-800 dark:bg-slate-900/40 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">❌</span>
                  <span>تسجيل حالة نفوق</span>
                </div>
                <ChevronLeft className="h-3.5 w-3.5 text-slate-300 group-hover:text-terracotta transition-colors" />
              </button>

              <button
                onClick={() => handleDirectShortcut('transfer_cycle')}
                className="w-full text-right p-2.5 rounded-xl border border-slate-100 bg-white hover:border-terracotta dark:border-slate-800 dark:bg-slate-900/40 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">🔄</span>
                  <span>نقل وتفريد الدورة</span>
                </div>
                <ChevronLeft className="h-3.5 w-3.5 text-slate-300 group-hover:text-terracotta transition-colors" />
              </button>
            </div>

            {/* Basin recent activity logs list */}
            {(basinStats?.recent_activities?.length ?? 0) > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">الأنشطة الأخيرة بالحوض</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                  {(basinStats?.recent_activities ?? []).slice(0, 4).map((activity, index) => (
                    <div key={index} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{activity.description || activity.type}</span>
                        <span className="text-[9px] text-slate-400">{activity.date}</span>
                      </div>
                      {activity.detail && <div className="text-[9px] text-slate-400">{activity.detail}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center space-y-3">
            <Warehouse className="h-10 w-10 text-slate-200 dark:text-slate-800" />
            <span className="text-xs">يمكنك المحادثة بدون اختيار. اختر حوضاً فقط إذا أردت عرض بياناته السريعة هنا.</span>
          </div>
        )}
      </div>

      {/* Action execution confirmation popup dialog modals */}
      <AppDialog open={activeAction !== null} onClose={handleActionCancel} panelClassName="max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <Sparkles className="h-6 w-6 text-terracotta" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">تأكيد عملية الذكاء الاصطناعي</h2>
          </div>

          {actionError && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-start gap-2 text-xs font-bold">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Form inputs depending on the action type */}
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
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">وقت البدء</label>
                  <input 
                    type="time" 
                    value={irrigationStartTime} 
                    onChange={e => setIrrigationStartTime(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
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
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الكمية النافقة</label>
                  <input 
                    type="number" 
                    value={mortalityQuantity} 
                    onChange={e => setMortalityQuantity(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
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
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ التسميد</label>
                  <input 
                    type="date" 
                    value={fertilizationDate} 
                    onChange={e => setFertilizationDate(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
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
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ النقل</label>
                  <input 
                    type="date" 
                    value={transferDate} 
                    onChange={e => setTransferDate(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
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
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">رقم خط النقل</label>
                  <input 
                    type="number" 
                    value={transferLineNumber} 
                    onChange={e => setTransferLineNumber(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
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
    </div>
  )
}

// Inline AI Action Card Renderer
function ActionCard({ action, onExecute }: { action: ActiveAction; onExecute: () => void }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    log_irrigation: Waves,
    log_mortality: AlertCircle,
    log_fertilization: Sprout,
    transfer_cycle: Layers3,
    start_cycle: Sprout,
    create_basin: Warehouse,
    log_procedure: Activity
  }

  const ActionIcon = icons[action.action] || HelpCircle
  const actionTitle = actionTitles[action.action] || 'إجراء مقترح'
  const canExecute = Boolean(actionRegistry[action.action as KnownActionType])

  return (
    <div className="rounded-2xl border border-orange-100 bg-orange-50/50 dark:border-orange-900/40 dark:bg-orange-950/20 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-orange-100 dark:bg-orange-900/60 p-2.5 text-terracotta shrink-0">
          <ActionIcon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{actionTitle}</h4>
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

      <button
        onClick={onExecute}
        disabled={!canExecute}
        className="min-h-9 px-4 py-1.5 shrink-0 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{canExecute ? 'تأكيد الإجراء' : 'يفتح من النموذج القياسي'}</span>
      </button>
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
