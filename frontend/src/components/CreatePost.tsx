import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import { Button, ErrorText, Field, Select, TextInput } from './ui'
import type { ConnectionEntry, FightOutcome, PostItem, Sport } from '../types'

type Tab = 'text' | 'fight_result'

const TAB_LABELS: Record<Tab, string> = {
  text: 'Text',
  fight_result: 'Fight Result',
}

export function CreatePost({ onCreated }: { onCreated: (post: PostItem) => void }) {
  const [tab, setTab] = useState<Tab>('text')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [taggedIds, setTaggedIds] = useState<number[]>([])
  const [connections, setConnections] = useState<ConnectionEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [opponentName, setOpponentName] = useState('')
  const [frSport, setFrSport] = useState<Sport>('mma')
  const [result, setResult] = useState<FightOutcome>('win')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')

  useEffect(() => {
    api
      .get<ConnectionEntry[]>('/connections?status=accepted')
      .then(setConnections)
      .catch(() => {})
  }, [])

  function toggleTag(id: number) {
    setTaggedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function resetForm() {
    setBody('')
    setFiles([])
    setTaggedIds([])
    setOpponentName('')
    setEventName('')
    setEventDate('')
  }

  async function submit() {
    setError(null)
    if (tab === 'text' && !body.trim()) {
      setError('Write something first')
      return
    }
    setSubmitting(true)
    try {
      const form = new FormData()
      if (body) form.append('body', body)
      taggedIds.forEach((id) => form.append('tagged_user_ids', String(id)))
      files.forEach((f) => form.append('files', f))

      let path = '/posts/text'
      if (tab === 'fight_result') {
        path = '/posts/fight-result'
        form.append('opponent_name', opponentName)
        form.append('sport', frSport)
        form.append('result', result)
        if (eventName) form.append('event_name', eventName)
        if (eventDate) form.append('event_date', eventDate)
      }

      const post = await api.postForm<PostItem>(path, form)
      onCreated(post)
      resetForm()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded border border-steel p-4">
      <div className="flex gap-2">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-display rounded px-3 py-1.5 text-xs uppercase tracking-wide ${
              tab === t ? 'bg-jab text-bone' : 'border border-steel text-steel-light'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={tab === 'text' ? "What's on your mind?" : 'Add a caption (optional)'}
          rows={3}
          className="rounded border border-steel bg-surface px-3 py-2 text-bone placeholder:text-steel-light focus:border-jab focus:outline-none"
        />

        {tab === 'fight_result' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opponent">
              <TextInput value={opponentName} onChange={(e) => setOpponentName(e.target.value)} />
            </Field>
            <Field label="Sport">
              <Select value={frSport} onChange={(e) => setFrSport(e.target.value as Sport)}>
                <option value="boxing">Boxing</option>
                <option value="mma">MMA</option>
                <option value="bjj">BJJ</option>
              </Select>
            </Field>
            <Field label="Result">
              <Select value={result} onChange={(e) => setResult(e.target.value as FightOutcome)}>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="draw">Draw</option>
                <option value="no_contest">No Contest</option>
              </Select>
            </Field>
            <Field label="Event (optional)">
              <TextInput value={eventName} onChange={(e) => setEventName(e.target.value)} />
            </Field>
            <Field label="Date (optional)">
              <TextInput type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </Field>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-steel-light">Photos / Video</label>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="mt-1.5 block w-full text-sm text-steel-light file:mr-3 file:rounded file:border file:border-steel file:bg-surface file:px-3 file:py-1.5 file:text-bone"
          />
          {files.length > 0 && <p className="mt-1 text-xs text-steel-light">{files.length} file(s) selected</p>}
        </div>

        {connections.length > 0 && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-steel-light">Tag People</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {connections.map((c) => (
                <button
                  key={c.fighter.user_id}
                  type="button"
                  onClick={() => toggleTag(c.fighter.user_id)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    taggedIds.includes(c.fighter.user_id)
                      ? 'border-jab bg-jab/20 text-bone'
                      : 'border-steel text-steel-light'
                  }`}
                >
                  {c.fighter.first_name} {c.fighter.last_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <ErrorText>{error}</ErrorText>}
        <Button onClick={submit} disabled={submitting} className="self-start">
          {submitting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  )
}
