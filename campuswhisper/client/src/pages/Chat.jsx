import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import socket from '../socket.js'
import MessageBubble from '../components/MessageBubble.jsx'
import ResourcePin from '../components/ResourcePin.jsx'
import ShipBell from '../components/ShipBell.jsx'

const ROOMS = [
  { id: 'academics', name: 'Academics', icon: '📚' },
  { id: 'placements', name: 'Placements', icon: '💼' },
  { id: 'study', name: 'Study Together', icon: '🧠' },
  { id: 'vent', name: 'Vent', icon: '😤' },
  { id: 'ideas', name: 'Ideas & Projects', icon: '💡' },
  { id: 'productivity', name: 'Productivity', icon: '🎯' },
  { id: 'sos', name: 'SOS', icon: '🆘' },
  { id: 'talk', name: 'Just Talk', icon: '💬' },
]

const LANGUAGES = ['javascript', 'python', 'c', 'cpp', 'java', 'typescript', 'bash', 'sql']

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div
      className="fixed top-4 right-4 z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-3 text-sm text-[var(--text-primary)] shadow-lg animate-fade-in"
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  )
}

export default function Chat() {
  const { roomId } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [onlineCounts, setOnlineCounts] = useState({})
  const [typingUsers, setTypingUsers] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [input, setInput] = useState('')
  const [codeMode, setCodeMode] = useState(false)
  const [language, setLanguage] = useState('javascript')
  const [isSOS, setIsSOS] = useState(false)
  const [toast, setToast] = useState(null)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const [shipDisabled, setShipDisabled] = useState(false)

  const feedRef = useRef(null)
  const textareaRef = useRef(null)
  const typingTimerRef = useRef(null)
  const isAtBottomRef = useRef(true)

  const currentRoom = useMemo(
    () => ROOMS.find((r) => r.id === roomId),
    [roomId],
  )

  const showToast = useCallback((msg) => {
    setToast(msg)
  }, [])

  const scrollToBottom = useCallback((force = false) => {
    if (!feedRef.current) return
    if (force || isAtBottomRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (!feedRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current
    const nearBottom = scrollHeight - scrollTop - clientHeight < 80
    isAtBottomRef.current = nearBottom
    setShowScrollDown(!nearBottom)
  }, [])

  useEffect(() => {
    const raw = sessionStorage.getItem('cw_session')
    if (!raw) {
      navigate('/gate')
      return
    }
    let s
    try {
      s = JSON.parse(raw)
      setSession(s)
    } catch {
      navigate('/gate')
      return
    }

    if (!socket.connected) socket.connect()

    socket.emit('join_room', {
      roomId,
      sessionToken: s.sessionToken,
      handle: s.handle,
      year: s.year,
      branch: s.branch,
      college: s.college,
      mood: s.mood,
    })

    const handleRoomJoined = ({ messages: history }) => {
      setMessages(history || [])
      setTimeout(() => scrollToBottom(true), 50)
    }

    const handleNewMessage = (msg) => {
      if (msg.roomId !== roomId) return
      setMessages((prev) => [...prev, msg])
      setTimeout(() => scrollToBottom(), 30)
    }

    const handleMessageRemoved = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId && m.id !== messageId))
    }

    const handleTyping = ({ handle: h }) => {
      setTypingUsers((prev) => (prev.includes(h) ? prev : [...prev, h]))
    }

    const handleStopTyping = ({ handle: h }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== h))
    }

    const handleOnlineCount = ({ roomId: rId, count }) => {
      setOnlineCounts((prev) => ({ ...prev, [rId]: count }))
    }

    const handleRateLimit = () => {
      showToast('⏱ Slow down! You are sending messages too fast.')
    }

    const handleError = (err) => {
      if (err?.type === 'rate_limit') {
        showToast('⏱ Rate limited. Wait a moment before sending again.')
      }
    }

    socket.on('room_joined', handleRoomJoined)
    socket.on('new_message', handleNewMessage)
    socket.on('message_removed', handleMessageRemoved)
    socket.on('typing', handleTyping)
    socket.on('stop_typing', handleStopTyping)
    socket.on('online_count', handleOnlineCount)
    socket.on('rate_limit', handleRateLimit)
    socket.on('error', handleError)

    return () => {
      socket.emit('leave_room', { roomId })
      socket.off('room_joined', handleRoomJoined)
      socket.off('new_message', handleNewMessage)
      socket.off('message_removed', handleMessageRemoved)
      socket.off('typing', handleTyping)
      socket.off('stop_typing', handleStopTyping)
      socket.off('online_count', handleOnlineCount)
      socket.off('rate_limit', handleRateLimit)
      socket.off('error', handleError)
    }
  }, [roomId, navigate, scrollToBottom, showToast])

  const emitTypingStart = useCallback(() => {
    if (!session) return
    socket.emit('typing_start', { roomId, handle: session.handle })
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing_stop', { roomId, handle: session.handle })
    }, 3000)
  }, [roomId, session])

  const handleInputChange = useCallback(
    (e) => {
      const val = e.target.value
      if (val.length > 1000) return
      setInput(val)
      if (val.trim()) emitTypingStart()
    },
    [emitTypingStart],
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, codeMode, language, isSOS, session, roomId],
  )

  const sendMessage = useCallback(() => {
    if (!input.trim() || !session) return
    const payload = {
      roomId,
      content: input.trim(),
      type: codeMode ? 'code' : 'text',
      language: codeMode ? language : undefined,
      isSOS: isSOS && roomId === 'sos',
      sessionToken: session.sessionToken,
      handle: session.handle,
      year: session.year,
      branch: session.branch,
      mood: session.mood,
    }
    socket.emit('send_message', payload)
    setInput('')
    setIsSOS(false)
    clearTimeout(typingTimerRef.current)
    socket.emit('typing_stop', { roomId, handle: session.handle })
    textareaRef.current?.focus()
  }, [input, session, roomId, codeMode, language, isSOS])

  const handleShip = useCallback(() => {
    if (!input.trim() || !session || shipDisabled) return
    const payload = {
      roomId,
      content: input.trim(),
      type: 'text',
      isShipIt: true,
      sessionToken: session.sessionToken,
      handle: session.handle,
      year: session.year,
      branch: session.branch,
      mood: session.mood,
    }
    socket.emit('send_message', payload)
    setInput('')
    setShipDisabled(true)
    setTimeout(() => setShipDisabled(false), 30000)
  }, [input, session, roomId, shipDisabled])

  const handleReport = useCallback((msg) => {
    socket.emit('report_message', {
      messageId: msg._id || msg.id,
      roomId,
    })
    showToast('🚩 Message reported. Thanks for keeping the space safe.')
  }, [roomId, showToast])

  const handleUnderstood = useCallback((msg) => {
    socket.emit('message_understood', {
      messageId: msg._id || msg.id,
      roomId,
    })
  }, [roomId])

  const relevantTypers = typingUsers.filter(
    (u) => session && u !== session.handle,
  )

  return (
    <div
      className="relative flex h-screen bg-[var(--bg-primary)] overflow-hidden"
      style={{ zIndex: 2 }}
    >
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Left sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border)]
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex
        `}
        aria-label="Room list sidebar"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
          <button
            onClick={() => navigate('/rooms')}
            className="font-mono text-[var(--accent-primary)] text-sm hover:opacity-80 transition-opacity"
            aria-label="Back to rooms"
          >
            ← Rooms
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Available rooms">
          {ROOMS.map((room) => (
            <button
              key={room.id}
              onClick={() => {
                navigate(`/chat/${room.id}`)
                setSidebarOpen(false)
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors
                hover:bg-[var(--bg-card)]
                ${room.id === roomId
                  ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] border-r-2 border-[var(--accent-primary)]'
                  : 'text-[var(--text-muted)]'
                }
              `}
              aria-current={room.id === roomId ? 'page' : undefined}
              aria-label={`Go to ${room.name} room, ${onlineCounts[room.id] ?? 0} online`}
            >
              <span aria-hidden="true">{room.icon}</span>
              <span className="flex-1 truncate">{room.name}</span>
              {onlineCounts[room.id] > 0 && (
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  {onlineCounts[room.id]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
            aria-label="Open room sidebar"
          >
            ☰
          </button>
          <span className="text-xl" aria-hidden="true">{currentRoom?.icon ?? '💬'}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-[var(--text-primary)] font-semibold text-sm truncate">
              {currentRoom?.name ?? roomId}
            </h1>
            <p className="text-[var(--text-muted)] text-xs font-mono">
              {onlineCounts[roomId] ?? 0} online
            </p>
          </div>
          <button
            onClick={() => setRightSidebarOpen((o) => !o)}
            className="hidden md:block text-[var(--text-muted)] hover:text-[var(--accent-primary)] text-sm transition-colors px-2 py-1 rounded border border-[var(--border)]"
            aria-label="Toggle resources panel"
            aria-expanded={rightSidebarOpen}
          >
            📌 Resources
          </button>
        </header>

        {/* Message feed */}
        <div
          ref={feedRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative"
          aria-label="Message feed"
          aria-live="polite"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <span className="text-5xl mb-4" aria-hidden="true">{currentRoom?.icon ?? '💬'}</span>
              <p className="text-[var(--text-muted)] text-sm">
                No messages yet. Be the first to whisper.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg._id || msg.id || msg.tempId}
              message={msg}
              currentSession={session}
              onReport={handleReport}
              onUnderstood={handleUnderstood}
              roomId={roomId}
            />
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {relevantTypers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-2 px-3 py-2"
                aria-live="polite"
                aria-label={`${relevantTypers.join(', ')} is typing`}
              >
                <div className="typing-dots flex gap-1" aria-hidden="true">
                  <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full" />
                  <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full" />
                  <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full" />
                </div>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  {relevantTypers.join(', ')} {relevantTypers.length === 1 ? 'is' : 'are'} typing…
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scroll-to-bottom button */}
        <AnimatePresence>
          {showScrollDown && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-24 right-6 bg-[var(--accent-primary)] text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-10"
              aria-label="Scroll to new messages"
            >
              ↓ New messages
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
          {/* Code mode toolbar */}
          {codeMode && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[var(--text-muted)] font-mono">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                aria-label="Select code language"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <label htmlFor="message-input" className="sr-only">
                Message
              </label>
              <textarea
                id="message-input"
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  codeMode
                    ? `Paste ${language} code here…`
                    : roomId === 'sos'
                    ? '🆘 Describe your emergency…'
                    : 'Whisper something…'
                }
                rows={codeMode ? 4 : 1}
                className={`
                  w-full bg-[var(--bg-card)] border rounded-xl px-4 py-3 text-sm resize-none
                  text-[var(--text-primary)] placeholder-[var(--text-muted)]
                  focus:outline-none transition-colors
                  ${codeMode ? 'font-mono border-[var(--accent-primary)]/50' : 'border-[var(--border)]'}
                  ${isSOS ? 'border-[var(--accent-sos)]/70' : ''}
                  focus:border-[var(--accent-primary)]
                `}
                maxLength={1000}
                aria-label="Message input"
                style={{ maxHeight: 160, overflowY: 'auto' }}
              />
              <span
                className="absolute bottom-2 right-3 text-[10px] text-[var(--text-muted)] font-mono pointer-events-none"
                aria-label={`${input.length} of 1000 characters`}
              >
                {input.length}/1000
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-1">
              {/* Code toggle */}
              <button
                onClick={() => setCodeMode((c) => !c)}
                className={`
                  p-2 rounded-lg border text-xs font-mono transition-colors
                  ${codeMode
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
                  }
                `}
                aria-label="Toggle code mode"
                aria-pressed={codeMode}
                title="Toggle code mode"
              >
                {'</>'}
              </button>

              {/* SOS toggle (only in sos room) */}
              {roomId === 'sos' && (
                <button
                  onClick={() => setIsSOS((s) => !s)}
                  className={`
                    p-2 rounded-lg border text-xs transition-colors
                    ${isSOS
                      ? 'border-[var(--accent-sos)] text-[var(--accent-sos)] bg-[var(--accent-sos)]/10 sos-glow'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-sos)]'
                    }
                  `}
                  aria-label="Toggle SOS mode"
                  aria-pressed={isSOS}
                  title="Mark as SOS"
                >
                  🆘
                </button>
              )}

              {/* ShipBell */}
              <ShipBell onShip={handleShip} disabled={shipDisabled || !input.trim()} />

              {/* Send */}
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="p-2 rounded-lg bg-[var(--accent-primary)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-opacity-80 transition-all"
                aria-label="Send message"
                title="Send (Enter)"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar — resources */}
      <aside
        className={`
          hidden md:flex flex-col w-72 bg-[var(--bg-secondary)] border-l border-[var(--border)]
          transition-all duration-300 overflow-hidden
          ${rightSidebarOpen ? 'w-72' : 'w-0 border-l-0'}
        `}
        aria-label="Resources panel"
      >
        {rightSidebarOpen && session && (
          <ResourcePin roomId={roomId} session={session} />
        )}
      </aside>
    </div>
  )
}
