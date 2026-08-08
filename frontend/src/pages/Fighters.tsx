import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { FighterAvatar, fighterDisplayName, gymsSummary, sportsSummary } from '../components/FighterIdentity'
import { Button, Select, TextInput } from '../components/ui'
import type { ConnectionEntry, FighterSummary, Sport } from '../types'

type ConnectionState = { connectionId: number; status: 'pending' | 'accepted'; direction: 'incoming' | 'outgoing' }

export function Fighters() {
  const [fighters, setFighters] = useState<FighterSummary[]>([])
  const [connectionByUserId, setConnectionByUserId] = useState<Map<number, ConnectionState>>(new Map())
  const [sport, setSport] = useState<Sport | ''>('')
  const [gym, setGym] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)

  // `silent` skips the full loading state so the list doesn't blank out (and
  // the page doesn't visually jump) when we're just refreshing after an
  // action like Connect - only the very first load should show "Loading...".
  async function load({ silent = false }: { silent?: boolean } = {}) {
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams()
      if (sport) params.set('sport', sport)
      if (gym) params.set('gym', gym)
      const [fightersRes, connectionsRes] = await Promise.all([
        api.get<FighterSummary[]>(`/connections/fighters?${params.toString()}`),
        api.get<ConnectionEntry[]>('/connections'),
      ])
      setFighters(fightersRes)
      const map = new Map<number, ConnectionState>()
      for (const c of connectionsRes) {
        if (c.status === 'declined') continue
        map.set(c.fighter.user_id, { connectionId: c.id, status: c.status, direction: c.direction })
      }
      setConnectionByUserId(map)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, gym])

  async function connect(userId: number) {
    setActionError(null)
    try {
      await api.post(`/connections/${userId}`)
      await load({ silent: true })
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  async function cancelRequest(connectionId: number) {
    setActionError(null)
    try {
      await api.delete(`/connections/${connectionId}`)
      await load({ silent: true })
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-2xl px-4 pb-16">
      <h1 className="font-display text-4xl">Fighters</h1>
      <div className="mt-6 flex gap-3">
        <Select value={sport} onChange={(e) => setSport(e.target.value as Sport | '')} className="w-40">
          <option value="">All Sports</option>
          <option value="boxing">Boxing</option>
          <option value="mma">MMA</option>
          <option value="bjj">BJJ</option>
        </Select>
        <TextInput placeholder="Filter by gym" value={gym} onChange={(e) => setGym(e.target.value)} />
      </div>
      {actionError && <p className="mt-3 text-sm text-jab">{actionError}</p>}

      {loading ? (
        <p className="mt-8 text-steel-light">Loading...</p>
      ) : fighters.length === 0 ? (
        <p className="mt-8 text-steel-light">No fighters found.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {fighters.map((fighter) => {
            const conn = connectionByUserId.get(fighter.user_id)
            return (
              <div
                key={fighter.user_id}
                className="flex items-center justify-between gap-4 rounded border border-steel p-4"
              >
                <Link to={`/fighters/${fighter.user_id}`} className="flex items-center gap-4 hover:text-jab">
                  <FighterAvatar profile={fighter} size={56} />
                  <div>
                    <p className="font-display text-xl">{fighterDisplayName(fighter)}</p>
                    <p className="text-xs uppercase tracking-wide text-steel-light">
                      {sportsSummary(fighter.sports)} · {gymsSummary(fighter.sports)}
                    </p>
                  </div>
                </Link>
                {conn?.status === 'accepted' ? (
                  <span className="text-sm uppercase tracking-wide text-amber">Connected</span>
                ) : conn?.status === 'pending' && conn.direction === 'outgoing' ? (
                  <Button variant="ghost" onClick={() => cancelRequest(conn.connectionId)}>
                    Cancel Request
                  </Button>
                ) : conn?.status === 'pending' && conn.direction === 'incoming' ? (
                  <span className="text-sm uppercase tracking-wide text-steel-light">Requested You</span>
                ) : (
                  <Button onClick={() => connect(fighter.user_id)}>Connect</Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
