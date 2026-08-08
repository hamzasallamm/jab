import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { FighterAvatar, fighterDisplayName, gymsSummary, sportsSummary } from '../components/FighterIdentity'
import { Button } from '../components/ui'
import type { ConnectionEntry } from '../types'

export function Connections() {
  const [connections, setConnections] = useState<ConnectionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await api.get<ConnectionEntry[]>('/connections')
      setConnections(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function respond(id: number, action: 'accept' | 'decline') {
    setError(null)
    try {
      await api.post(`/connections/${id}/${action}`)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  async function cancel(id: number) {
    setError(null)
    try {
      await api.delete(`/connections/${id}`)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  if (loading) return <p className="mt-16 text-center text-steel-light">Loading...</p>

  const accepted = connections.filter((c) => c.status === 'accepted')
  const incoming = connections.filter((c) => c.status === 'pending' && c.direction === 'incoming')
  const outgoing = connections.filter((c) => c.status === 'pending' && c.direction === 'outgoing')

  return (
    <div className="mx-auto mt-12 max-w-2xl px-4 pb-16">
      <h1 className="font-display text-4xl">Connections</h1>
      {error && <p className="mt-3 text-sm text-jab">{error}</p>}

      {incoming.length > 0 && (
        <Section title="Requests">
          {incoming.map((c) => (
            <Row key={c.id} entry={c}>
              <Button onClick={() => respond(c.id, 'accept')}>Accept</Button>
              <Button variant="ghost" onClick={() => respond(c.id, 'decline')}>
                Decline
              </Button>
            </Row>
          ))}
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title="Sent Requests">
          {outgoing.map((c) => (
            <Row key={c.id} entry={c}>
              <Button variant="ghost" onClick={() => cancel(c.id)}>
                Cancel
              </Button>
            </Row>
          ))}
        </Section>
      )}

      <Section title="Your Connections">
        {accepted.length === 0 ? (
          <p className="text-steel-light">
            No connections yet.{' '}
            <Link to="/fighters" className="text-jab">
              Browse fighters
            </Link>{' '}
            to connect.
          </p>
        ) : (
          accepted.map((c) => (
            <Row key={c.id} entry={c}>
              <Button variant="ghost" onClick={() => cancel(c.id)}>
                Remove
              </Button>
            </Row>
          ))
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="font-display text-xl text-steel-light">{title}</h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Row({ entry, children }: { entry: ConnectionEntry; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded border border-steel p-4">
      <Link to={`/fighters/${entry.fighter.user_id}`} className="flex items-center gap-4 hover:text-jab">
        <FighterAvatar profile={entry.fighter} size={56} />
        <div>
          <p className="font-display text-xl">{fighterDisplayName(entry.fighter)}</p>
          <p className="text-xs uppercase tracking-wide text-steel-light">
            {sportsSummary(entry.fighter.sports)} · {gymsSummary(entry.fighter.sports)}
          </p>
        </div>
      </Link>
      <div className="flex gap-2">{children}</div>
    </div>
  )
}
