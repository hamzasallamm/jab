import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import { Avatar } from '../components/Avatar'
import { Button, ErrorText, Field, Select, TextInput } from '../components/ui'
import type { SparringRequesterItem, SparringSessionCard, Sport } from '../types'

export function Sparring() {
  const [sessions, setSessions] = useState<SparringSessionCard[]>([])
  const [location, setLocation] = useState('')
  const [sport, setSport] = useState<Sport | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (location) params.set('location', location)
      if (sport) params.set('sport', sport)
      const res = await api.get<SparringSessionCard[]>(`/sparring-sessions?${params.toString()}`)
      setSessions(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(load, 300) // debounce location typing
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, sport])

  return (
    <div className="mx-auto mt-12 max-w-2xl px-4 pb-16">
      <h1 className="font-display text-4xl">Sparring Near You</h1>
      <p className="mt-1 text-sm text-steel-light">
        Search by location for now — connecting your device's location comes later.
      </p>

      <div className="mt-6 flex gap-3">
        <TextInput
          placeholder="Search by location (e.g. Austin, TX)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <Select value={sport} onChange={(e) => setSport(e.target.value as Sport | '')} className="w-40">
          <option value="">All Sports</option>
          <option value="boxing">Boxing</option>
          <option value="mma">MMA</option>
          <option value="bjj">BJJ</option>
        </Select>
      </div>

      <HostSessionForm onHosted={load} />

      {error && <p className="mt-3 text-sm text-jab">{error}</p>}

      {loading ? (
        <p className="mt-8 text-steel-light">Loading...</p>
      ) : sessions.length === 0 ? (
        <p className="mt-8 text-steel-light">No sparring sessions found. Try a different location or sport.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {sessions.map((s) => (
            <SessionCard key={s.session_id} session={s} onChanged={load} setError={setError} />
          ))}
        </div>
      )}
    </div>
  )
}

function SessionCard({
  session,
  onChanged,
  setError,
}: {
  session: SparringSessionCard
  onChanged: () => void
  setError: (e: string | null) => void
}) {
  const [busy, setBusy] = useState(false)
  const [managing, setManaging] = useState(false)

  async function requestToJoin() {
    setError(null)
    setBusy(true)
    try {
      await api.post(`/sparring-sessions/${session.session_id}/request`)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function cancelRequest() {
    setError(null)
    setBusy(true)
    try {
      await api.delete(`/sparring-sessions/${session.session_id}/request`)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded border border-steel p-4">
      <div className="flex items-center gap-3">
        <Avatar name={session.author.display_name} pictureUrl={session.author.profile_picture_url} />
        <div>
          <p className="font-display text-lg leading-tight">{session.author.display_name}</p>
          <p className="text-xs text-steel-light">Hosting a sparring session</p>
        </div>
      </div>

      <div className="mt-3 rounded border border-amber/40 bg-amber/10 p-3">
        <p className="font-display text-lg">
          {session.sport} · {session.session_date} @ {session.session_time}
        </p>
        <p className="text-xs uppercase tracking-wide text-steel-light">{session.location}</p>
        {session.skill_level_notes && <p className="mt-1 text-sm">{session.skill_level_notes}</p>}
      </div>

      {session.body && <p className="mt-3 whitespace-pre-wrap">{session.body}</p>}

      <div className="mt-4">
        {session.is_owner ? (
          <>
            <Button variant="ghost" onClick={() => setManaging((m) => !m)}>
              {managing ? 'Hide' : 'Manage'} Requests
              {session.pending_request_count > 0 ? ` (${session.pending_request_count})` : ''}
            </Button>
            {managing && <RequesterList sessionId={session.session_id} onChanged={onChanged} setError={setError} />}
          </>
        ) : session.my_request_status === 'accepted' ? (
          <span className="text-sm uppercase tracking-wide text-amber">You're In</span>
        ) : session.my_request_status === 'pending' ? (
          <Button variant="ghost" onClick={cancelRequest} disabled={busy}>
            Cancel Request
          </Button>
        ) : session.my_request_status === 'declined' ? (
          <span className="text-sm uppercase tracking-wide text-steel-light">Request Declined</span>
        ) : (
          <Button onClick={requestToJoin} disabled={busy}>
            Request to Join
          </Button>
        )}
      </div>
    </div>
  )
}

function RequesterList({
  sessionId,
  onChanged,
  setError,
}: {
  sessionId: number
  onChanged: () => void
  setError: (e: string | null) => void
}) {
  const [requesters, setRequesters] = useState<SparringRequesterItem[] | null>(null)

  async function load() {
    const res = await api.get<SparringRequesterItem[]>(`/sparring-sessions/${sessionId}/requests`)
    setRequesters(res)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function respond(requestId: number, action: 'accept' | 'decline') {
    setError(null)
    try {
      await api.post(`/sparring-requests/${requestId}/${action}`)
      await load()
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  if (requesters === null) return <p className="mt-3 text-sm text-steel-light">Loading...</p>
  if (requesters.length === 0) return <p className="mt-3 text-sm text-steel-light">No requests yet.</p>

  return (
    <div className="mt-3 flex flex-col gap-2">
      {requesters.map((r) => (
        <div key={r.request_id} className="flex items-center justify-between gap-3 rounded border border-steel p-2.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={r.requester_display_name} pictureUrl={r.requester_profile_picture_url} size={32} />
            <p className="text-sm">{r.requester_display_name}</p>
          </div>
          {r.status === 'pending' ? (
            <div className="flex gap-2">
              <Button onClick={() => respond(r.request_id, 'accept')} className="px-3 py-1 text-sm">
                Accept
              </Button>
              <Button variant="ghost" onClick={() => respond(r.request_id, 'decline')} className="px-3 py-1 text-sm">
                Decline
              </Button>
            </div>
          ) : (
            <span className="text-xs uppercase tracking-wide text-steel-light">{r.status}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function HostSessionForm({ onHosted }: { onHosted: () => void }) {
  const [open, setOpen] = useState(false)
  const [sport, setSport] = useState<Sport>('mma')
  const [sessionDate, setSessionDate] = useState('')
  const [sessionTime, setSessionTime] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setSessionDate('')
    setSessionTime('')
    setLocation('')
    setNotes('')
    setBody('')
  }

  async function submit() {
    setError(null)
    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('sport', sport)
      form.append('session_date', sessionDate)
      form.append('session_time', sessionTime)
      form.append('location', location)
      if (notes) form.append('skill_level_notes', notes)
      if (body) form.append('body', body)
      await api.postForm('/posts/sparring-session', form)
      resetForm()
      setOpen(false)
      onHosted()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="mt-4">
        Host a Sparring Session
      </Button>
    )
  }

  return (
    <div className="mt-4 rounded border border-steel p-4">
      <p className="font-display text-lg">Host a Sparring Session</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Sport">
          <Select value={sport} onChange={(e) => setSport(e.target.value as Sport)}>
            <option value="boxing">Boxing</option>
            <option value="mma">MMA</option>
            <option value="bjj">BJJ</option>
          </Select>
        </Field>
        <Field label="Location">
          <TextInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Austin, TX" />
        </Field>
        <Field label="Date">
          <TextInput type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
        </Field>
        <Field label="Time">
          <TextInput type="time" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} />
        </Field>
        <div className="col-span-2">
          <Field label="Skill Level Notes (optional)">
            <TextInput value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Caption (optional)">
            <TextInput value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
        </div>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      <div className="mt-4 flex gap-3">
        <Button onClick={submit} disabled={submitting}>
          {submitting ? 'Posting...' : 'Post Session'}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
