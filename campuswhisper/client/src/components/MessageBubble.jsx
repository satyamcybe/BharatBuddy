import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import CodeBlock from './CodeBlock.jsx'

function formatRelativeTime(ts) {
  if (!ts) return 'just now'
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min${Math.floor(diff / 60000) !== 1 ? 's' : ''} ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hour${Math.floor(diff / 3600000) !== 1 ? 's' : ''} ago`
  return new Date(ts).toLocaleDateString()
}

const MOOD_EMOJIS = {
  grinding: '⚡',
  stuck: '🤔',
  exploring: '🔭',
  venting: '🌪️',
  vibing: '🎵',
}

export default function MessageBubble({ message, currentSession, onReport, onUnderstood, roomId }) {
  const [hovered, setHovered] = useState(false)
  const [understood, setUnderstood] = useState(false)
  const [understoodGlowing, setUnderstoodGlowing] = useState(false)
  const bubbleRef = useRef(null)

  const isOwn = currentSession?.sessionToken === message.sessionToken

  const handleUnderstood = () => {
    if (understood) return
    setUnderstood(true)
    setUnderstoodGlowing(true)
    onUnderstood?.(message)
    setTimeout(() => setUnderstoodGlowing(false), 1500)
  }

  // Ship-it message: full banner
  if (message.isShipIt) {
    return (
      <div
        className="ship-banner rounded-xl px-6 py-4 text-center my-2"
        role="article"
        aria-label={`${message.handle} shipped something`}
      >
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl" aria-hidden="true">🚀</span>
          <div>
            <p className="text-[var(--accent-ship)] font-semibold">
              {message.handle} just shipped it!
            </p>
            {message.content && (
              <p className="text-[var(--text-muted)] text-sm mt-0.5">{message.content}</p>
            )}
          </div>
          <span className="text-2xl" aria-hidden="true">🔔</span>
        </div>
        <p className="text-[var(--text-muted)] text-xs mt-2 font-mono">
          {formatRelativeTime(message.createdAt || message.timestamp)}
        </p>
      </div>
    )
  }

  // SOS message: red left border
  const sosStyle = message.isSOS
    ? 'border-l-4 border-[var(--accent-sos)] bg-[rgba(239,68,68,0.05)]'
    : ''

  return (
    <motion.article
      ref={bubbleRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`
        relative group rounded-xl px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)]
        transition-all duration-200
        ${sosStyle}
        ${understoodGlowing ? 'understood-glow' : ''}
        ${hovered ? 'border-[var(--border)]/80' : ''}
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Message from ${message.handle}`}
    >
      {/* SOS label */}
      {message.isSOS && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[var(--accent-sos)] text-xs font-mono font-semibold" aria-label="SOS message">
            🆘 SOS
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="font-mono text-[var(--accent-primary)] text-xs font-medium">
          {message.handle || 'Anonymous'}
        </span>

        {/* Year/Branch badge */}
        {(message.year || message.branch) && (
          <span className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[10px] px-2 py-0.5 rounded-full font-mono">
            {[message.year, message.branch].filter(Boolean).join(' · ')}
          </span>
        )}

        {/* Mood emoji */}
        {message.mood && MOOD_EMOJIS[message.mood] && (
          <span
            className="text-xs"
            title={message.mood}
            aria-label={`Mood: ${message.mood}`}
          >
            {MOOD_EMOJIS[message.mood]}
          </span>
        )}

        <span className="ml-auto text-[var(--text-muted)] text-[10px] font-mono">
          {formatRelativeTime(message.createdAt || message.timestamp)}
        </span>
      </div>

      {/* Content */}
      <div className="text-[var(--text-primary)] text-sm leading-relaxed break-words">
        {message.type === 'code' ? (
          <CodeBlock code={message.content} language={message.language || 'javascript'} />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>

      {/* Action buttons */}
      <div
        className={`
          flex items-center gap-2 mt-2 transition-opacity duration-150
          ${hovered ? 'opacity-100' : 'opacity-0'}
        `}
        aria-hidden={!hovered}
      >
        {/* "I understood it" — academics only */}
        {roomId === 'academics' && !isOwn && (
          <button
            onClick={handleUnderstood}
            disabled={understood}
            className={`
              text-xs px-2 py-1 rounded-lg border transition-all
              ${understood
                ? 'border-[var(--accent-understood)] text-[var(--accent-understood)] bg-[var(--accent-understood)]/10 cursor-default'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-understood)] hover:text-[var(--accent-understood)]'
              }
            `}
            aria-label="Mark as understood"
            aria-pressed={understood}
          >
            {understood ? '✓ Understood' : '👍 I understood it'}
          </button>
        )}

        {/* Report */}
        {!isOwn && (
          <button
            onClick={() => onReport?.(message)}
            className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-red-500 hover:text-red-400 transition-all ml-auto"
            aria-label="Report message"
            title="Report this message"
          >
            🚩
          </button>
        )}
      </div>
    </motion.article>
  )
}
