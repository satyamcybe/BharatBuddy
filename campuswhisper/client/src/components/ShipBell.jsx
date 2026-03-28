import { useState } from 'react'
import { motion } from 'framer-motion'

export default function ShipBell({ onShip, disabled }) {
  const [ringing, setRinging] = useState(false)

  const handleClick = () => {
    if (disabled) return
    setRinging(true)
    onShip?.()
    setTimeout(() => setRinging(false), 600)
  }

  return (
    <div className="relative group">
      {/* Tooltip */}
      <div
        className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-[var(--bg-card)] border border-[var(--border)] rounded text-xs text-[var(--text-muted)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
        role="tooltip"
        id="ship-bell-tooltip"
      >
        🚀 I Shipped It!
      </div>

      <motion.button
        onClick={handleClick}
        disabled={disabled}
        animate={ringing ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className={`
          p-2 rounded-lg border text-base transition-colors
          ${disabled
            ? 'border-[var(--border)] text-[var(--text-muted)]/40 cursor-not-allowed'
            : 'border-[var(--accent-ship)]/50 text-[var(--accent-ship)] hover:bg-[var(--accent-ship)]/10 hover:border-[var(--accent-ship)]'
          }
        `}
        aria-label="I shipped it — send a ship-it notification"
        aria-describedby="ship-bell-tooltip"
        aria-disabled={disabled}
      >
        🔔
      </motion.button>
    </div>
  )
}
