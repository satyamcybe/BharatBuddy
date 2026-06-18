export default function OnlineCounter({ count, label = 'online' }) {
  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-live="polite"
      aria-label={`${count} ${label}`}
    >
      <span
        className="w-2 h-2 rounded-full bg-green-500 inline-block"
        style={{ boxShadow: '0 0 6px #22c55e' }}
        aria-hidden="true"
      />
      <span className="font-mono text-sm text-[var(--text-muted)]">
        <span className="text-[var(--text-primary)] font-medium">{count.toLocaleString()}</span>{' '}
        {label}
      </span>
    </div>
  )
}
