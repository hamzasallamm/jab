import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import { Avatar } from './Avatar'
import { Button, ErrorText, Field, Select, TextInput } from './ui'
import type { FighterSummary, FightOutcome, PostItem, Sport } from '../types'

type Tab = 'text' | 'fight_result'

const TAB_LABELS: Record<Tab, string> = {
  text: 'Text',
  fight_result: 'Fight Result',
}

export function CreatePost({ onCreated }: { onCreated: (post: PostItem) => void }) {
  const [tab, setTab] = useState<Tab>('text')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [taggedFighters, setTaggedFighters] = useState<FighterSummary[]>([])
  const [tagQuery, setTagQuery] = useState('')
  const [tagResults, setTagResults] = useState<FighterSummary[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [opponentName, setOpponentName] = useState('')
  const [frSport, setFrSport] = useState<Sport>('mma')
  const [result, setResult] = useState<FightOutcome>('win')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')

  useEffect(() => {
    if (!tagQuery.trim()) {
      setTagResults([])
      return
    }
    const timeout = setTimeout(async () => {
      const res = await api.get<FighterSummary[]>(`/connections/fighters?q=${encodeURIComponent(tagQuery)}`)
      setTagResults(res)
    }, 250)
    return () => clearTimeout(timeout)
  }, [tagQuery])

  function addTag(fighter: FighterSummary) {
    setTaggedFighters((prev) => (prev.some((f) => f.user_id === fighter.user_id) ? prev : [...prev, fighter]))
    setTagQuery('')
    setTagResults([])
  }

  function removeTag(userId: number) {
    setTaggedFighters((prev) => prev.filter((f) => f.user_id !== userId))
  }

  function resetForm() {
    setBody('')
    setFiles([])
    setTaggedFighters([])
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
      taggedFighters.forEach((f) => form.append('tagged_user_ids', String(f.user_id)))
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

        <div className="relative">
          <label className="text-xs font-semibold uppercase tracking-wider text-steel-light">Tag People</label>

          {taggedFighters.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-2">
              {taggedFighters.map((f) => (
                <button
                  key={f.user_id}
                  type="button"
                  onClick={() => removeTag(f.user_id)}
                  className="rounded-full border border-jab bg-jab/20 px-3 py-1 text-xs text-bone"
                >
                  {f.first_name} {f.last_name} ✕
                </button>
              ))}
            </div>
          )}

          <TextInput
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
            placeholder="Search fighters to tag..."
            className="mt-1.5"
          />

          {tagResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded border border-steel bg-surface shadow-lg">
              {tagResults
                .filter((f) => !taggedFighters.some((t) => t.user_id === f.user_id))
                .map((f) => (
                  <button
                    key={f.user_id}
                    type="button"
                    onClick={() => addTag(f)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-jab/10"
                  >
                    <Avatar name={`${f.first_name} ${f.last_name}`} pictureUrl={f.profile_picture_url} size={28} />
                    <span className="text-sm">
                      {f.first_name} {f.last_name}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {error && <ErrorText>{error}</ErrorText>}
        <Button onClick={submit} disabled={submitting} className="self-start">
          {submitting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  )
}
