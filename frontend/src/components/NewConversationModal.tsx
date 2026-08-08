import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import { Avatar } from './Avatar'
import { Button, ErrorText, TextInput } from './ui'
import type { ConversationItem, FighterSummary } from '../types'

export function NewConversationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (conv: ConversationItem) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FighterSummary[]>([])
  const [selected, setSelected] = useState<FighterSummary[]>([])
  const [groupName, setGroupName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      const res = await api.get<FighterSummary[]>(`/connections/fighters?${params.toString()}`)
      setResults(res)
    }, 250)
    return () => clearTimeout(timeout)
  }, [query])

  function toggle(fighter: FighterSummary) {
    setSelected((prev) =>
      prev.some((f) => f.user_id === fighter.user_id)
        ? prev.filter((f) => f.user_id !== fighter.user_id)
        : [...prev, fighter],
    )
  }

  async function create() {
    if (selected.length === 0) return
    setError(null)
    setSubmitting(true)
    try {
      const isGroup = selected.length > 1
      const conv = await api.post<ConversationItem>('/conversations', {
        participant_ids: selected.map((f) => f.user_id),
        is_group: isGroup,
        name: isGroup && groupName ? groupName : null,
      })
      onCreated(conv)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/60 px-4 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-md rounded border border-steel bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-xl">New Message</p>

        {selected.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selected.map((f) => (
              <button
                key={f.user_id}
                onClick={() => toggle(f)}
                className="rounded-full border border-jab bg-jab/20 px-3 py-1 text-xs text-bone"
              >
                {f.first_name} {f.last_name} ✕
              </button>
            ))}
          </div>
        )}

        {selected.length > 1 && (
          <div className="mt-3">
            <TextInput
              placeholder="Group name (optional)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
        )}

        <div className="mt-3">
          <TextInput placeholder="Search fighters..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div className="mt-3 flex max-h-64 flex-col gap-1 overflow-y-auto">
          {results
            .filter((f) => !selected.some((s) => s.user_id === f.user_id))
            .map((f) => (
              <button
                key={f.user_id}
                onClick={() => toggle(f)}
                className="flex items-center gap-3 rounded px-2 py-2 text-left hover:bg-jab/10"
              >
                <Avatar name={`${f.first_name} ${f.last_name}`} pictureUrl={f.profile_picture_url} size={32} />
                <span className="text-sm">
                  {f.first_name} {f.last_name}
                </span>
              </button>
            ))}
          {results.length === 0 && <p className="px-2 py-2 text-sm text-steel-light">No fighters found.</p>}
        </div>

        {error && <ErrorText>{error}</ErrorText>}

        <div className="mt-4 flex gap-2">
          <Button onClick={create} disabled={submitting || selected.length === 0}>
            {submitting ? 'Starting...' : selected.length > 1 ? 'Create Group' : 'Start Chat'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
