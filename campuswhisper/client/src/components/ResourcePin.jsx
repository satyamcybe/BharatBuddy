import { useEffect, useState } from 'react'
import axios from 'axios'

const TAG_COLORS = {
  notes: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  video: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  tool: 'bg-green-500/15 text-green-400 border-green-500/30',
  repo: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

const TAG_OPTIONS = ['notes', 'video', 'tool', 'repo']

function getFavicon(url) {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?sz=16&domain=${hostname}`
  } catch {
    return null
  }
}

export default function ResourcePin({ roomId, session }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', url: '', tag: 'notes' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    fetchResources()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  async function fetchResources() {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get(`/api/pinboard/${roomId}`)
      setResources(data)
    } catch {
      setError('Failed to load resources.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.url.trim()) {
      setFormError('Title and URL are required.')
      return
    }
    try {
      new URL(form.url)
    } catch {
      setFormError('Please enter a valid URL.')
      return
    }
    try {
      setSubmitting(true)
      setFormError(null)
      await axios.post('/api/pinboard', {
        roomId,
        title: form.title.trim(),
        url: form.url.trim(),
        tag: form.tag,
        sessionToken: session.sessionToken,
        pinnedBy: session.sessionToken,
        handle: session.handle,
      })
      setForm({ title: '', url: '', tag: 'notes' })
      setShowForm(false)
      await fetchResources()
    } catch {
      setFormError('Failed to pin resource. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpvote(resourceId) {
    try {
      await axios.post(`/api/pinboard/${resourceId}/upvote`, {
        sessionToken: session.sessionToken,
      })
      setResources((prev) =>
        prev.map((r) =>
          (r._id || r.id) === resourceId
            ? { ...r, votes: (r.votes || 0) + 1 }
            : r,
        ),
      )
    } catch {
      // Silent fail for upvote
    }
  }

  async function handleDelete(resourceId) {
    try {
      await axios.delete(`/api/pinboard/${resourceId}`, {
        data: { sessionToken: session.sessionToken },
      })
      setResources((prev) =>
        prev.filter((r) => (r._id || r.id) !== resourceId),
      )
    } catch {
      // Silent fail for delete
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">📌 Resources</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/25 transition-colors"
          aria-label="Pin a new resource"
          aria-expanded={showForm}
        >
          {showForm ? 'Cancel' : '+ Pin'}
        </button>
      </div>

      {/* Pin form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border-b border-[var(--border)] px-4 py-4 space-y-3 bg-[var(--bg-card)] shrink-0"
          aria-label="Pin a resource form"
        >
          <div>
            <label htmlFor="pin-title" className="text-xs text-[var(--text-muted)] block mb-1">
              Title *
            </label>
            <input
              id="pin-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Resource title"
              maxLength={100}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="pin-url" className="text-xs text-[var(--text-muted)] block mb-1">
              URL *
            </label>
            <input
              id="pin-url"
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="pin-tag" className="text-xs text-[var(--text-muted)] block mb-1">
              Tag
            </label>
            <select
              id="pin-tag"
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              aria-label="Resource tag"
            >
              {TAG_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {formError && (
            <p className="text-[var(--accent-sos)] text-xs" role="alert">
              {formError}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-[var(--accent-primary)] text-white text-xs rounded-lg font-medium disabled:opacity-50 hover:bg-opacity-80 transition-all"
            aria-label="Submit pinned resource"
          >
            {submitting ? 'Pinning…' : 'Pin Resource'}
          </button>
        </form>
      )}

      {/* Resource list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" aria-label="Pinned resources list">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <span className="text-[var(--text-muted)] text-xs font-mono animate-pulse">
              Loading resources…
            </span>
          </div>
        )}
        {error && (
          <div className="text-center py-6" role="alert">
            <p className="text-[var(--accent-sos)] text-xs">{error}</p>
            <button
              onClick={fetchResources}
              className="mt-2 text-[var(--accent-primary)] text-xs underline"
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !error && resources.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[var(--text-muted)] text-xs">No resources pinned yet.</p>
          </div>
        )}
        {resources.map((resource) => {
          const resourceId = resource._id || resource.id
          const favicon = getFavicon(resource.url)
          const tagClass = TAG_COLORS[resource.tag] || TAG_COLORS.notes
          const isOwner = resource.pinnedBy === session?.sessionToken

          return (
            <article
              key={resourceId}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 hover:border-[var(--accent-primary)]/30 transition-colors"
              aria-label={`Resource: ${resource.title}`}
            >
              <div className="flex items-start gap-2">
                {favicon && (
                  <img
                    src={favicon}
                    alt=""
                    aria-hidden="true"
                    className="w-4 h-4 mt-0.5 shrink-0 rounded"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--text-primary)] font-medium hover:text-[var(--accent-primary)] transition-colors line-clamp-2 leading-snug"
                    aria-label={`Open ${resource.title} in new tab`}
                  >
                    {resource.title}
                  </a>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${tagClass}`}
                    >
                      {resource.tag}
                    </span>
                    <span className="text-[var(--text-muted)] text-[10px] font-mono">
                      {resource.handle || 'anon'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleUpvote(resourceId)}
                  className="text-[10px] px-2 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-understood)] hover:text-[var(--accent-understood)] transition-colors flex items-center gap-1"
                  aria-label={`Upvote ${resource.title}, currently ${resource.votes || 0} votes`}
                >
                  ↑ {resource.votes || 0}
                </button>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(resourceId)}
                    className="text-[10px] px-2 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-sos)] hover:text-[var(--accent-sos)] transition-colors ml-auto"
                    aria-label={`Delete ${resource.title}`}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
