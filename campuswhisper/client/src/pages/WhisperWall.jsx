import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import socket from '../socket.js'

function WhisperCard({ whisper, index }) {
  const age = Date.now() - new Date(whisper.createdAt || whisper.timestamp || Date.now()).getTime()
  const maxAge = 30 * 60 * 1000 // 30 min
  const ageFraction = Math.min(age / maxAge, 1)
  const opacity = Math.max(0.2, 1 - ageFraction * 0.75)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
      className="relative bg-[rgba(124,106,247,0.05)] border border-[rgba(124,106,247,0.15)] rounded-2xl px-6 py-4 max-w-sm"
      style={{
        backdropFilter: 'blur(8px)',
      }}
    >
      <p className="text-[var(--text-primary)] text-sm leading-relaxed font-mono break-words">
        "{whisper.content}"
      </p>
      <p className="text-[var(--text-muted)] text-xs mt-2 font-mono">
        {formatRelativeTime(whisper.createdAt || whisper.timestamp)}
      </p>
    </motion.div>
  )
}

function formatRelativeTime(ts) {
  if (!ts) return 'just now'
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

export default function WhisperWall() {
  const navigate = useNavigate()
  const [whispers, setWhispers] = useState([])
  const idRef = useRef(0)

  useEffect(() => {
    socket.connect()

    const handleHistory = (history) => {
      if (!Array.isArray(history)) return
      setWhispers(history.slice(-20).map((w) => ({ ...w, _uid: idRef.current++ })))
    }

    const handleNew = (whisper) => {
      setWhispers((prev) => {
        const next = [...prev, { ...whisper, _uid: idRef.current++ }]
        return next.length > 20 ? next.slice(next.length - 20) : next
      })
    }

    socket.on('whisper_history', handleHistory)
    socket.on('new_whisper', handleNew)

    return () => {
      socket.off('whisper_history', handleHistory)
      socket.off('new_whisper', handleNew)
      socket.disconnect()
    }
  }, [])

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          'linear-gradient(160deg, #0a0e1a 0%, #120d2e 40%, #0d1a2e 70%, #0a0e1a 100%)',
        zIndex: 2,
      }}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, #7c6af7, transparent)',
            top: '10%',
            left: '20%',
          }}
        />
        <div
          className="absolute w-72 h-72 rounded-full blur-3xl opacity-8"
          style={{
            background: 'radial-gradient(circle, #6366f1, transparent)',
            bottom: '20%',
            right: '15%',
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-6">
        <button
          onClick={() => navigate('/')}
          className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] font-mono text-sm transition-colors"
          aria-label="Back to landing"
        >
          ← Back
        </button>
        <div className="text-center">
          <h1 className="font-mono text-2xl md:text-3xl text-[var(--text-primary)]">
            Whisper Wall
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1 italic">
            Whispers float away. Never to return.
          </p>
        </div>
        <div className="w-16" aria-hidden="true" />
      </div>

      {/* Whisper grid */}
      <div className="relative z-10 px-6 pb-12">
        {whispers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <span className="text-5xl mb-6" aria-hidden="true">🌫️</span>
            <p className="text-[var(--text-muted)] font-mono text-sm">
              The void is listening…
            </p>
            <p className="text-[var(--text-muted)] text-xs mt-2">
              No whispers yet. Be the first.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            <AnimatePresence mode="popLayout">
              {[...whispers].reverse().map((w, i) => (
                <div key={w._uid ?? w._id ?? i} className="break-inside-avoid mb-4">
                  <WhisperCard whisper={w} index={i} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Count badge */}
      {whispers.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--bg-card)] border border-[var(--border)] rounded-full px-5 py-2 text-xs text-[var(--text-muted)] font-mono z-20"
          aria-live="polite"
        >
          {whispers.length} whisper{whispers.length !== 1 ? 's' : ''} floating
        </div>
      )}
    </div>
  )
}
