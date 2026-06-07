'use client'

import React, { useState } from 'react'
import { Plus, Loader2, Edit3, Check, X, Trash2, Search, MessageSquare } from 'lucide-react'

interface NurseryChat {
  id: number
  title: string
  context_basin_name?: string | null
  context_cycle_name?: string | null
  created_at: string
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'اليوم'
  if (diffDays === 1) return 'أمس'
  if (diffDays < 7) return `منذ ${diffDays} أيام`
  return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
}

function groupChatsByDate(chats: NurseryChat[]) {
  const groups: { label: string; chats: NurseryChat[] }[] = []
  const today: NurseryChat[] = []
  const yesterday: NurseryChat[] = []
  const thisWeek: NurseryChat[] = []
  const older: NurseryChat[] = []

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000)

  chats.forEach(chat => {
    const date = new Date(chat.created_at)
    if (date >= todayStart) today.push(chat)
    else if (date >= yesterdayStart) yesterday.push(chat)
    else if (date >= weekStart) thisWeek.push(chat)
    else older.push(chat)
  })

  if (today.length) groups.push({ label: 'اليوم', chats: today })
  if (yesterday.length) groups.push({ label: 'أمس', chats: yesterday })
  if (thisWeek.length) groups.push({ label: 'هذا الأسبوع', chats: thisWeek })
  if (older.length) groups.push({ label: 'أقدم', chats: older })

  return groups
}

export default function ChatSidebar({
  chats,
  activeChat,
  loadingChats,
  onSelectChat,
  onCreateChat,
  onRenameChat,
  onDeleteChat,
}: {
  chats: NurseryChat[]
  activeChat: NurseryChat | null
  loadingChats: boolean
  onSelectChat: (chat: NurseryChat) => void
  onCreateChat: () => void
  onRenameChat: (id: number, title: string) => void
  onDeleteChat: (id: number) => void
}) {
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChats = searchQuery.trim()
    ? chats.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.context_basin_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.context_cycle_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats

  const groups = groupChatsByDate(filteredChats)

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-line bg-surface">
      {/* Header */}
      <div className="p-4 border-b border-line flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-ink">المحادثات</h2>
        <button
          onClick={onCreateChat}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-action-primary/10 text-action-primary hover:bg-action-primary/20 transition-all active:scale-95"
          title="محادثة جديدة"
        >
          <Plus className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث في المحادثات..."
            className="w-full rounded-xl border border-line bg-surface-muted/50 pr-9 pl-3 py-2 text-xs font-semibold text-ink outline-none transition-all focus:border-action-primary/40 focus:ring-2 focus:ring-action-primary/10 placeholder:text-ink-muted/50"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {loadingChats ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
            <Loader2 className="h-5 w-5 animate-spin text-action-primary mb-2" />
            <span className="text-[11px] font-bold">جاري التحميل...</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-muted space-y-3">
            <MessageSquare className="h-10 w-10 text-line" />
            <span className="text-xs">
              {searchQuery ? 'لا توجد نتائج' : 'لا توجد محادثات. ابدأ محادثة جديدة!'}
            </span>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label}>
              <div className="px-2 py-2 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                {group.label}
              </div>
              {group.chats.map(chat => {
                const isActive = activeChat?.id === chat.id
                const isRenaming = renamingId === chat.id

                return (
                  <div
                    key={chat.id}
                    className={`group relative flex items-center justify-between rounded-xl cursor-pointer transition-all mb-0.5 ${
                      isActive
                        ? 'bg-action-primary/10 ring-1 ring-action-primary/20'
                        : 'hover:bg-surface-muted'
                    }`}
                    onClick={() => !isRenaming && onSelectChat(chat)}
                  >
                    <div className="flex-1 min-w-0 p-2.5 pr-3">
                      {isRenaming ? (
                        <input
                          value={renameTitle}
                          onChange={e => setRenameTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              onRenameChat(chat.id, renameTitle)
                              setRenamingId(null)
                            }
                            if (e.key === 'Escape') setRenamingId(null)
                          }}
                          className="w-full text-xs font-bold border border-action-primary rounded-lg px-2 py-1 bg-surface text-ink outline-none"
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <div className={`text-xs font-bold truncate ${isActive ? 'text-action-primary' : 'text-ink'}`}>
                            {chat.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {(chat.context_basin_name || chat.context_cycle_name) && (
                              <span className="text-[10px] font-semibold text-action-primary/70 truncate">
                                {chat.context_basin_name || chat.context_cycle_name}
                              </span>
                            )}
                            <span className="text-[9px] text-ink-muted">
                              {formatRelativeDate(chat.created_at)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 pl-1 transition-opacity">
                      {isRenaming ? (
                        <>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              onRenameChat(chat.id, renameTitle)
                              setRenamingId(null)
                            }}
                            className="p-1 text-success hover:text-success-strong"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setRenamingId(null) }}
                            className="p-1 text-danger hover:text-danger-strong"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setRenamingId(chat.id)
                              setRenameTitle(chat.title)
                            }}
                            className="p-1 text-ink-muted hover:text-ink"
                            title="تعديل العنوان"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); onDeleteChat(chat.id) }}
                            className="p-1 text-ink-muted hover:text-danger"
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
        )}
      </div>
    </div>
  )
}
