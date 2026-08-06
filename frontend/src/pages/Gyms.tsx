import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../api/client'
import { Button, Select, TextInput } from '../components/ui'
import type { FollowEntry, GymSummary, Sport } from '../types'

export function Gyms() {
  const { me } = useAuth()
  const [gyms, setGyms] = useState<GymSummary[]>([])
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set())
  const [sport, setSport] = useState<Sport | ''>('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)

  const canFollow = me?.account_type === 'fighter'

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (sport) params.set('sport', sport)
      if (location) params.set('location', location)
      const [gymsRes, followsRes] = await Promise.all([
        api.get<GymSummary[]>(`/follows/gyms?${params.toString()}`),
        canFollow ? api.get<FollowEntry[]>('/follows/me') : Promise.resolve([] as FollowEntry[]),
      ])
      setGyms(gymsRes)
      setFollowedIds(new Set(followsRes.map((f) => f.gym.user_id)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, location])

  async function follow(userId: number) {
    setActionError(null)
    try {
      await api.post(`/follows/${userId}`)
      await load()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  async function unfollow(userId: number) {
    setActionError(null)
    try {
      await api.delete(`/follows/${userId}`)
      await load()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-2xl px-4 pb-16">
      <h1 className="font-display text-4xl">Gyms &amp; Orgs</h1>
      <div className="mt-6 flex gap-3">
        <Select value={sport} onChange={(e) => setSport(e.target.value as Sport | '')} className="w-40">
          <option value="">All Sports</option>
          <option value="boxing">Boxing</option>
          <option value="mma">MMA</option>
          <option value="bjj">BJJ</option>
        </Select>
        <TextInput placeholder="Filter by location" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      {actionError && <p className="mt-3 text-sm text-jab">{actionError}</p>}

      {loading ? (
        <p className="mt-8 text-steel-light">Loading...</p>
      ) : gyms.length === 0 ? (
        <p className="mt-8 text-steel-light">No gyms found.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {gyms.map((gym) => {
            const following = followedIds.has(gym.user_id)
            return (
              <div key={gym.user_id} className="flex items-center justify-between gap-4 rounded border border-steel p-4">
                <div>
                  <p className="font-display text-xl">{gym.org_name}</p>
                  <p className="text-xs uppercase tracking-wide text-steel-light">
                    {gym.location || 'Location not set'} · {gym.sports.join(', ') || 'No sports listed'}
                  </p>
                </div>
                {canFollow &&
                  (following ? (
                    <Button variant="ghost" onClick={() => unfollow(gym.user_id)}>
                      Following
                    </Button>
                  ) : (
                    <Button onClick={() => follow(gym.user_id)}>Follow</Button>
                  ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
