'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Send, Paperclip, Mic, MicOff, Loader2, X } from 'lucide-react'

export default function ChatInput({
  inputMessage,
  setInputMessage,
  onSend,
  onFileSelect,
  selectedFiles,
  onRemoveFile,
  isRecording,
  onToggleRecording,
  sendingMessage,
  voiceAvailable,
}: {
  inputMessage: string
  setInputMessage: (v: string) => void
  onSend: () => void
  onFileSelect: (files: File[]) => void
  selectedFiles: File[]
  onRemoveFile: (index: number) => void
  isRecording: boolean
  onToggleRecording: () => void
  sendingMessage: boolean
  voiceAvailable: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [previewUrls, setPreviewUrls] = useState<Map<number, string>>(new Map())

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [inputMessage])

  // Manage object URLs for file previews — cleanup on unmount or file removal
  useEffect(() => {
    const newUrls = new Map<number, string>()
    selectedFiles.forEach((file, idx) => {
      if (file.type.startsWith('image/')) {
        const existing = previewUrls.get(idx)
        if (existing && previewUrls.has(idx)) {
          newUrls.set(idx, existing)
        } else {
          newUrls.set(idx, URL.createObjectURL(file))
        }
      }
    })

    // Revoke old URLs not in new set
    previewUrls.forEach((url, idx) => {
      if (!newUrls.has(idx)) URL.revokeObjectURL(url)
    })

    setPreviewUrls(newUrls)

    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      onFileSelect(Array.from(e.target.files))
    }
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onSend()
      }
    },
    [onSend],
  )

  return (
    <div className="border-t border-line bg-surface/80 backdrop-blur-sm p-4">
      {/* File previews */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              className="relative flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 ring-1 ring-line text-xs text-ink-soft font-bold shadow-sm"
              style={{ animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              {previewUrls.has(idx) && (
                <img src={previewUrls.get(idx)} alt="preview" className="h-7 w-7 rounded-lg object-cover" />
              )}
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                onClick={() => onRemoveFile(idx)}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-danger-soft text-danger hover:bg-danger/20 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*,audio/*,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Toolbar buttons */}
        <div className="flex items-center gap-1 pb-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-muted hover:text-ink hover:bg-surface-muted transition-all active:scale-95"
            title="إرفاق ملفات/صور"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {voiceAvailable && (
            <button
              type="button"
              onClick={onToggleRecording}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 ${
                isRecording
                  ? 'bg-danger text-white shadow-md shadow-danger/30'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-muted'
              }`}
              title={isRecording ? 'إيقاف الإملاء' : 'إملاء صوتي'}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
        </div>

        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'جاري الاستماع لصوتك...' : 'اسأل المستشار الزراعي الذكي...'}
            disabled={sendingMessage}
            rows={1}
            className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink outline-none transition-all focus:border-action-primary focus:ring-2 focus:ring-action-primary/15 disabled:opacity-50 placeholder:text-ink-muted/60"
            style={{ maxHeight: '160px', minHeight: '44px' }}
          />
          {isRecording && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute h-3 w-3 rounded-full bg-danger opacity-75" />
                <span className="relative h-3 w-3 rounded-full bg-danger" />
              </span>
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          type="button"
          disabled={sendingMessage || (!inputMessage.trim() && selectedFiles.length === 0)}
          onClick={onSend}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-action-primary text-white hover:bg-action-primary-hover disabled:opacity-40 transition-all active:scale-95 shadow-sm disabled:shadow-none"
          title="إرسال"
        >
          {sendingMessage ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5 rotate-180" />
          )}
        </button>
      </div>
    </div>
  )
}
