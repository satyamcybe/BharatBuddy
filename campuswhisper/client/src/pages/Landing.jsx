import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import socket from '../socket.js'
import { useAppContext } from '../App.jsx'
import OnlineCounter from '../components/OnlineCounter.jsx'

const PARTICLE_DEFAULTS = [
  'console.log("hello?")',
  'segfault at 3am',
  'git push --force',
  'undefined is not a function',
  '404: sleep not found',
  'while(alive) { grind(); }',
  'deadline.exe crashed',
  'import anxiety from "life"',
  'sudo make it work',
  'rm -rf node_modules',
]

function Particle({ text, left, duration, delay }) {
  return (
    <span
      className="particle"
      aria-hidden="true"
      style={{
        left: `${left}%`,
        '--duration': `${duration}s`,
        '--delay': `${delay}s`,
        top: '100%',
      }}
    >
      {text}
    </span>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { setOnlineCount, onlineCount } = useAppContext()
  const [whisperInput, setWhisperInput] = useState('')
  const [particles, setParticles] = useState([])
  const [whisperSent, setWhisperSent] = useState(false)
  const particleIdRef = useRef(0)
  const inputRef = useRef(null)

  const addParticle = useCallback((text) => {
    const id = particleIdRef.current++
    const particle = {
      id,
      text,
      left: Math.random() * 90 + 2,
      duration: 15 + Math.random() * 12,
      delay: 0,
    }
    setParticles((prev) => {
      const updated = [...prev, particle]
      return updated.length > 10 ? updated.slice(updated.length - 10) : updated
    })
  }, [])

  useEffect(() => {
    // Seed initial particles
    PARTICLE_DEFAULTS.forEach((text, i) => {
      const id = particleIdRef.current++
      setParticles((prev) => [
        ...prev,
        {
          id,
          text,
          left: Math.random() * 90 + 2,
          duration: 18 + Math.random() * 14,
          delay: i * 2,
        },
      ])
    })

    socket.connect()

    socket.on('whisper_history', (history) => {
      if (!Array.isArray(history)) return
      history.slice(-8).forEach((w) => addParticle(w.content))
    })

    socket.on('new_whisper', (whisper) => {
      addParticle(whisper.content)
    })

    socket.on('global_online', (count) => {
      setOnlineCount(count)
    })

    return () => {
      socket.off('whisper_history')
      socket.off('new_whisper')
      socket.off('global_online')
      socket.disconnect()
    }
  }, [addParticle, setOnlineCount])

  const handleWhisperSubmit = (e) => {
    e.preventDefault()
    const trimmed = whisperInput.trim()
    if (!trimmed) return
    socket.emit('send_whisper', { content: trimmed })
    addParticle(trimmed)
    setWhisperInput('')
    setWhisperSent(true)
    setTimeout(() => setWhisperSent(false), 2000)
  }

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-primary)] px-4"
      style={{ zIndex: 2 }}
    >
      {/* Ambient background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(124,106,247,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {particles.map((p) => (
          <Particle key={p.id} {...p} />
        ))}
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 max-w-2xl w-full text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo / heading */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2 justify-center">
            <span
              className="w-3 h-3 rounded-full bg-[var(--accent-primary)] inline-block"
              style={{ boxShadow: '0 0 12px var(--accent-primary)' }}
            />
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">
              anonymous · ephemeral
            </span>
            <span
              className="w-3 h-3 rounded-full bg-[var(--accent-primary)] inline-block"
              style={{ boxShadow: '0 0 12px var(--accent-primary)' }}
            />
          </div>
          <h1 className="font-mono text-5xl md:text-7xl font-medium text-[var(--text-primary)] tracking-tight">
            Campus
            <span
              className="text-[var(--accent-primary)]"
              style={{ textShadow: '0 0 30px rgba(124,106,247,0.5)' }}
            >
              Whisper
            </span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          variants={itemVariants}
          className="text-[var(--text-muted)] text-lg md:text-xl font-light max-w-md leading-relaxed"
        >
          Where college minds vent, grind, and vibe — anonymously, ephemerally.
        </motion.p>

        {/* Whisper input */}
        <motion.div variants={itemVariants} className="w-full max-w-lg">
          <form onSubmit={handleWhisperSubmit} className="relative">
            <label htmlFor="whisper-input" className="sr-only">
              Whisper to the void
            </label>
            <input
              id="whisper-input"
              ref={inputRef}
              type="text"
              value={whisperInput}
              onChange={(e) => setWhisperInput(e.target.value)}
              placeholder="Whisper to the void…"
              maxLength={200}
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 pr-28 text-[var(--text-primary)] font-mono text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              aria-label="Whisper to the void"
            />
            <button
              type="submit"
              disabled={!whisperInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-opacity-80 transition-all"
              aria-label="Send whisper"
            >
              {whisperSent ? '✓ Sent' : 'Whisper'}
            </button>
          </form>
          <p className="text-[var(--text-muted)] text-xs mt-2 font-mono">
            Your words float away. No traces left behind.
          </p>
        </motion.div>

        {/* Enter button */}
        <motion.div variants={itemVariants}>
          <button
            onClick={() => navigate('/gate')}
            className="group relative px-10 py-4 rounded-2xl font-semibold text-lg text-white overflow-hidden transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), #5b4dd4)',
              boxShadow: '0 0 30px rgba(124,106,247,0.3)',
            }}
            aria-label="Enter the rooms"
          >
            <span className="relative z-10">Enter the Rooms →</span>
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)',
              }}
              aria-hidden="true"
            />
          </button>
        </motion.div>

        {/* Live counter */}
        <motion.div variants={itemVariants}>
          <OnlineCounter count={onlineCount} label="students inside right now" />
        </motion.div>

        {/* Whisper wall link */}
        <motion.div variants={itemVariants}>
          <button
            onClick={() => navigate('/whispers')}
            className="text-[var(--text-muted)] text-sm hover:text-[var(--accent-primary)] transition-colors font-mono underline underline-offset-4"
            aria-label="View whisper wall"
          >
            ↗ View the Whisper Wall
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
