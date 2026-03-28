import { AnimatePresence, motion } from 'framer-motion'

export default function SOSBanner({ message, onDismiss, onGoHelp }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-50 sos-glow"
          role="alert"
          aria-live="assertive"
          aria-label="SOS alert banner"
        >
          <div className="flex items-center gap-3 bg-[rgba(239,68,68,0.12)] border-b-2 border-[var(--accent-sos)] px-4 py-3 backdrop-blur-sm">
            <span className="text-xl shrink-0" aria-hidden="true">🆘</span>

            <p className="flex-1 text-sm text-[var(--text-primary)] truncate">
              <span className="text-[var(--accent-sos)] font-semibold font-mono">
                {message.handle || 'Someone'}
              </span>{' '}
              needs help:{' '}
              <span className="text-[var(--text-muted)]">
                {(message.content || '').slice(0, 60)}
                {(message.content || '').length > 60 ? '…' : ''}
              </span>
            </p>

            <button
              onClick={onGoHelp}
              className="shrink-0 px-4 py-1.5 bg-[var(--accent-sos)] text-white text-xs font-semibold rounded-lg hover:bg-opacity-80 transition-all"
              aria-label="Go help in SOS room"
            >
              Go Help →
            </button>

            <button
              onClick={onDismiss}
              className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-lg leading-none"
              aria-label="Dismiss SOS alert"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
