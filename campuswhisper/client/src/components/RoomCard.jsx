export default function RoomCard({
  room,
  onlineCount,
  lastMessage,
  dominantMood,
  hasActiveSOS,
  onClick,
}) {
  const isSOS = room.id === 'sos'

  return (
    <button
      onClick={onClick}
      className={`
        group w-full text-left flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-200
        hover:border-[var(--accent-primary)] hover:bg-[var(--bg-card)]/80 hover:-translate-y-0.5
        focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]
        bg-[var(--bg-card)] active:translate-y-0
        ${hasActiveSOS && isSOS
          ? 'border-[var(--accent-sos)] sos-glow'
          : 'border-[var(--border)]'
        }
      `}
      aria-label={`Enter ${room.name} room, ${onlineCount} online`}
    >
      {/* Icon + online badge */}
      <div className="flex items-start justify-between">
        <span className="text-3xl" aria-hidden="true">{room.icon}</span>
        <div className="flex items-center gap-1">
          {hasActiveSOS && isSOS && (
            <span
              className="text-[var(--accent-sos)] text-xs font-mono font-semibold"
              aria-label="Active SOS"
            >
              LIVE
            </span>
          )}
          {onlineCount > 0 && (
            <span
              className="text-xs font-mono bg-[var(--bg-secondary)] text-[var(--text-muted)] px-2 py-0.5 rounded-full border border-[var(--border)]"
              aria-label={`${onlineCount} online`}
            >
              {onlineCount} online
            </span>
          )}
        </div>
      </div>

      {/* Name + desc */}
      <div>
        <h3
          className={`font-semibold text-sm transition-colors group-hover:text-[var(--accent-primary)] ${
            hasActiveSOS && isSOS ? 'text-[var(--accent-sos)]' : 'text-[var(--text-primary)]'
          }`}
        >
          {room.name}
        </h3>
        <p className="text-[var(--text-muted)] text-xs mt-0.5 leading-snug">{room.desc}</p>
      </div>

      {/* Last message preview */}
      {lastMessage && (
        <div className="flex items-center gap-1.5 mt-auto">
          {dominantMood && (
            <span className="text-xs" aria-hidden="true">{dominantMood}</span>
          )}
          <p className="text-[var(--text-muted)] text-xs font-mono truncate flex-1">
            {lastMessage}…
          </p>
        </div>
      )}

      {/* No activity placeholder */}
      {!lastMessage && (
        <p className="text-[var(--border)] text-xs font-mono mt-auto italic">
          No messages yet
        </p>
      )}
    </button>
  )
}
