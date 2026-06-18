import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import MoodSelector from '../components/MoodSelector.jsx'

const YEARS = ['FE', 'SE', 'TE', 'BE']
const BRANCHES = ['CS', 'IT', 'MECH', 'CIVIL', 'EXTC', 'AIDS', 'Other']
const COLLEGES = [
  'TCET', 'SPIT', 'DJ Sanghvi', 'VJTI', 'RAIT', 'Fr. CRCE',
  'KJ Somaiya', 'VIT', 'Thadomal Shahani', 'KJSCE', 'TSEC',
  'ICT Mumbai', 'NMIMS', 'Sardar Patel', 'FCRIT',
]
const ADJECTIVES = [
  'Silent', 'Quiet', 'Hollow', 'Foggy', 'Distant', 'Sharp',
  'Lazy', 'Midnight', 'Neon', 'Blind', 'Cosmic', 'Velvet',
  'Crisp', 'Dim', 'Bold',
]
const NOUNS = [
  'Coder', 'Nerd', 'Ghost', 'Byte', 'Pixel', 'Node',
  'Loop', 'Stack', 'Query', 'Fork', 'Cache', 'Kernel',
  'Thread', 'Buffer', 'Socket',
]

function generateHandle() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${adj}${noun}#${num}`
}

const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? '60%' : '-60%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({
    x: dir > 0 ? '-60%' : '60%',
    opacity: 0,
  }),
}

function StepHeading({ step, title, subtitle }) {
  return (
    <div className="mb-8">
      <div className="text-xs font-mono text-[var(--accent-primary)] uppercase tracking-widest mb-2">
        Step {step} / 4
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)]">{title}</h2>
      {subtitle && (
        <p className="text-[var(--text-muted)] text-sm mt-1">{subtitle}</p>
      )}
    </div>
  )
}

function SelectionCard({ label, selected, onClick, large }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-5 py-4 rounded-xl border text-left transition-all duration-200
        hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10
        focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]
        ${large ? 'text-xl font-semibold' : 'text-sm font-medium'}
        ${
          selected
            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] shadow-[0_0_12px_rgba(124,106,247,0.3)]'
            : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]'
        }
      `}
      aria-pressed={selected}
      aria-label={`Select ${label}`}
    >
      {label}
      {selected && (
        <span className="absolute top-2 right-2 text-[var(--accent-primary)] text-xs" aria-hidden="true">
          ✓
        </span>
      )}
    </button>
  )
}

export default function Gate() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [year, setYear] = useState('')
  const [branch, setBranch] = useState('')
  const [college, setCollege] = useState('')
  const [mood, setMood] = useState('')

  const goTo = (next) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  const canProceed = () => {
    if (step === 1) return !!year
    if (step === 2) return !!branch
    if (step === 3) return college.trim().length > 0
    if (step === 4) return !!mood
    return false
  }

  const handleEnter = () => {
    const handle = generateHandle()
    const sessionToken = crypto.randomUUID()
    const session = {
      handle,
      sessionToken,
      year,
      branch,
      college: college.trim(),
      mood,
      createdAt: Date.now(),
    }
    sessionStorage.setItem('cw_session', JSON.stringify(session))
    navigate('/rooms')
  }

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <StepHeading step={1} title="Which year are you in?" subtitle="Helps match you with your peers." />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {YEARS.map((y) => (
                <SelectionCard
                  key={y}
                  label={y}
                  selected={year === y}
                  onClick={() => setYear(y)}
                  large
                />
              ))}
            </div>
          </>
        )
      case 2:
        return (
          <>
            <StepHeading step={2} title="Your branch?" subtitle="We'll surface relevant rooms." />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BRANCHES.map((b) => (
                <SelectionCard
                  key={b}
                  label={b}
                  selected={branch === b}
                  onClick={() => setBranch(b)}
                />
              ))}
            </div>
          </>
        )
      case 3:
        return (
          <>
            <StepHeading step={3} title="Which college?" subtitle="Stays anonymous — we just track rough counts." />
            <div className="relative">
              <label htmlFor="college-input" className="sr-only">College name</label>
              <input
                id="college-input"
                type="text"
                list="college-list"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="Type or select your college…"
                autoComplete="off"
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 text-[var(--text-primary)] font-ui text-base placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                aria-label="College name"
              />
              <datalist id="college-list">
                {COLLEGES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </>
        )
      case 4:
        return (
          <>
            <StepHeading step={4} title="What's your vibe right now?" />
            <MoodSelector selected={mood} onSelect={setMood} />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-12" style={{ zIndex: 2 }}>
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(124,106,247,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-xl relative z-10">
        {/* Progress bar */}
        <div className="mb-8 h-1 bg-[var(--bg-card)] rounded-full overflow-hidden" aria-hidden="true">
          <motion.div
            className="h-full bg-[var(--accent-primary)] rounded-full"
            initial={{ width: '25%' }}
            animate={{ width: `${step * 25}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Step card */}
        <div
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 overflow-hidden relative"
          style={{ minHeight: 300 }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {stepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => goTo(step - 1)}
            disabled={step === 1}
            className="px-6 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm font-medium hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Go to previous step"
          >
            ← Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => goTo(step + 1)}
              disabled={!canProceed()}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-opacity-85 transition-all"
              aria-label="Go to next step"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleEnter}
              disabled={!canProceed()}
              className="px-8 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              style={{
                background: canProceed()
                  ? 'linear-gradient(135deg, var(--accent-primary), #5b4dd4)'
                  : 'var(--bg-secondary)',
                boxShadow: canProceed() ? '0 0 20px rgba(124,106,247,0.3)' : 'none',
              }}
              aria-label="Enter CampusWhisper"
            >
              Enter →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
