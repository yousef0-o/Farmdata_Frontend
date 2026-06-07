import React from 'react'

/* ── Inline formatting ───────────────────────────────────── */

/** Renders bold (**text**) and inline code (`code`) */
function renderInlineFormatting(text: string, keyPrefix: string) {
  // Combined regex for **bold** and `inline code`
  const inlineRegex = /\*\*(.*?)\*\*|`([^`]+)`/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`${keyPrefix}-t-${key++}`}>{text.substring(lastIndex, match.index)}</span>)
    }

    if (match[1] !== undefined) {
      // Bold
      parts.push(
        <strong key={`${keyPrefix}-b-${key++}`} className="font-extrabold text-ink dark:text-white">
          {match[1]}
        </strong>
      )
    } else if (match[2] !== undefined) {
      // Inline code
      parts.push(
        <code
          key={`${keyPrefix}-c-${key++}`}
          className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[0.8em] font-mono text-action-primary"
        >
          {match[2]}
        </code>
      )
    }

    lastIndex = inlineRegex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`${keyPrefix}-t-${key++}`}>{text.substring(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : [<span key={`${keyPrefix}-plain`}>{text}</span>]
}

/* ── Table detection & rendering ─────────────────────────── */

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
    <div key={key} className="my-3 max-w-full overflow-x-auto rounded-xl border border-line bg-surface dark:bg-surface-raised">
      <table className="min-w-full border-collapse text-right text-xs" dir="rtl">
        <thead className="bg-surface-muted text-ink-soft">
          <tr>
            {headers.map((header, index) => (
              <th
                key={`${key}-h-${index}`}
                className="whitespace-nowrap border-b border-line px-3 py-2.5 font-extrabold"
              >
                {renderInlineFormatting(header, `${key}-h-${index}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`${key}-r-${rowIndex}`}
              className="transition-colors odd:bg-surface even:bg-surface-muted/50 hover:bg-surface-muted"
            >
              {headers.map((_, cellIndex) => (
                <td
                  key={`${key}-r-${rowIndex}-c-${cellIndex}`}
                  className="align-top border-b border-line/50 px-3 py-2 text-ink-soft"
                >
                  {renderInlineFormatting(row[cellIndex] ?? '', `${key}-r-${rowIndex}-c-${cellIndex}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Block-level markdown ────────────────────────────────── */

function renderMarkdownBlocks(text: string, keyPrefix: string) {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let buffer: string[] = []
  let index = 0
  let key = 0

  const flushBuffer = () => {
    const joined = buffer.join('\n').trim()
    if (joined) {
      nodes.push(
        <div key={`${keyPrefix}-txt-${key++}`} className="whitespace-pre-wrap leading-[1.8]">
          {renderInlineFormatting(joined, `${keyPrefix}-inline-${key}`)}
        </div>
      )
    }
    buffer = []
  }

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      flushBuffer()
      const level = headingMatch[1].length
      const headingText = headingMatch[2]
      const sizes = ['text-lg', 'text-base', 'text-sm', 'text-sm'] as const
      const weights = ['font-black', 'font-extrabold', 'font-bold', 'font-bold'] as const

      nodes.push(
        <div
          key={`${keyPrefix}-h-${key++}`}
          className={`${sizes[level - 1]} ${weights[level - 1]} text-ink mt-3 mb-1`}
        >
          {renderInlineFormatting(headingText, `${keyPrefix}-heading-${key}`)}
        </div>
      )
      index++
      continue
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushBuffer()
      nodes.push(<hr key={`${keyPrefix}-hr-${key++}`} className="my-3 border-line" />)
      index++
      continue
    }

    // Unordered list items
    if (/^[-*•]\s/.test(trimmed)) {
      flushBuffer()
      const listItems: string[] = []
      while (index < lines.length && /^[-*•]\s/.test(lines[index].trim())) {
        listItems.push(lines[index].trim().replace(/^[-*•]\s/, ''))
        index++
      }
      nodes.push(
        <ul key={`${keyPrefix}-ul-${key++}`} className="my-2 list-none space-y-1.5 pr-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-action-primary/60" />
              <span>{renderInlineFormatting(item, `${keyPrefix}-li-${key}-${i}`)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list items
    if (/^\d+[.)]\s/.test(trimmed)) {
      flushBuffer()
      const listItems: string[] = []
      while (index < lines.length && /^\d+[.)]\s/.test(lines[index].trim())) {
        listItems.push(lines[index].trim().replace(/^\d+[.)]\s/, ''))
        index++
      }
      nodes.push(
        <ol key={`${keyPrefix}-ol-${key++}`} className="my-2 list-none space-y-1.5 pr-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-action-primary/10 text-[10px] font-bold text-action-primary">
                {i + 1}
              </span>
              <span>{renderInlineFormatting(item, `${keyPrefix}-oli-${key}-${i}`)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Table
    if (isMarkdownTable(lines, index)) {
      flushBuffer()
      const tableLines = [lines[index], lines[index + 1]]
      index += 2

      while (
        index < lines.length &&
        lines[index].trim().startsWith('|') &&
        lines[index].trim().endsWith('|')
      ) {
        tableLines.push(lines[index])
        index++
      }

      nodes.push(renderMarkdownTable(tableLines, `${keyPrefix}-tbl-${key++}`))
      continue
    }

    buffer.push(line)
    index++
  }

  flushBuffer()
  return nodes
}

/* ── Public API ──────────────────────────────────────────── */

/**
 * Renders a full message content string with support for:
 * - Code blocks (``` ... ```)
 * - Bold (**text**)
 * - Inline code (`code`)
 * - Headings (# to ####)
 * - Ordered & unordered lists
 * - Tables
 * - Horizontal rules
 */
export function formatMessageContent(content: string) {
  const codeBlockRegex = /```(?:[A-Za-z0-9_-]+)?\s*([\s\S]*?)\s*```/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let blockKey = 0

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...renderMarkdownBlocks(content.substring(lastIndex, match.index), `md-${blockKey}`))
    }

    const codeText = match[1].trim()
    parts.push(
      <pre
        key={`code-${blockKey++}`}
        className="my-3 overflow-x-auto rounded-xl bg-surface-inverse p-4 text-xs font-mono leading-normal text-ink-inverse/95 shadow-inner"
        dir="ltr"
      >
        <code>{codeText}</code>
      </pre>
    )

    lastIndex = codeBlockRegex.lastIndex
  }

  if (lastIndex < content.length) {
    parts.push(...renderMarkdownBlocks(content.substring(lastIndex), `md-${blockKey}`))
  }

  return (
    <div className="space-y-1 text-sm leading-relaxed text-ink-soft">
      {parts}
    </div>
  )
}
