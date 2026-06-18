const MOODS = [
  { id: 'grinding', emoji: '⚡', label: 'Grinding' },
  { id: 'stuck', emoji: '🤔', label: 'Stuck' },
  { id: 'exploring', emoji: '🔭', label: 'Exploring' },
  { id: 'venting', emoji: '🌪️', label: 'Venting' },
  { id: 'vibing', emoji: '🎵', label: 'Vibing' },
]

export default function MoodSelector({ onSelect, selected }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      role="radiogroup"
      aria-label="Select your current mood"
    >
      {MOODS.map((mood) => {
        const isSelected = selected === mood.id
        return (
          <button
            key={mood.id}
            onClick={() => onSelect(mood.id)}
            role="radio"
            aria-checked={isSelected}
            className={`
              flex flex-col items-center gap-2 px-4 py-5 rounded-xl border transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]
              hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10
              ${isSelected
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 shadow-[0_0_12px_rgba(124,106,247,0.3)]'
                : 'border-[var(--border)] bg-[var(--bg-card)]'
              }
            `}
            aria-label={mood.label}
          >
            <span className="text-3xl" aria-hidden="true">{mood.emoji}</span>
            <span
              className={`text-sm font-medium transition-colors ${
                isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {mood.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
