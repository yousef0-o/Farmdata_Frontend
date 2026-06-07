import { apiRequest } from '@/lib/api/client'

export type TranscriptionResult = {
  success: boolean
  text: string
  provider?: string
  model?: string
}

export async function transcribeAudio(blob: Blob): Promise<TranscriptionResult> {
  const formData = new FormData()
  formData.append('audio', blob, 'nursery-voice.webm')

  return apiRequest<TranscriptionResult>('/nursery/chats/transcriptions', {
    method: 'POST',
    body: formData,
  })
}

export function supportsMediaRecorder() {
  return typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined'
}
