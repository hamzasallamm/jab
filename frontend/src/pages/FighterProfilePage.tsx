import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../api/client'
import { Button } from '../components/ui'
import { FighterAvatar, fighterDisplayName } from '../components/FighterIdentity'
import { FighterSportsSection } from '../components/FighterSportsSection'
import { SocialCounts } from '../components/SocialCounts'
import { PostCard } from '../components/PostCard'
import type { ConnectionEntry, FighterProfile, FollowEntry, PostItem } from '../types'

type ConnState = { connectionId: number; status: 'pending' | 'accepted'; direction: 'incoming' | 'outgoing' } | null

export function FighterProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const targetId = Number(userId)
  const { me } = useAuth()
  const isSelf = me?.id === targetId

  const [profile, setProfile] = useState<FighterProfile | null>(null)
  const [posts, setPosts] = useState<PostItem[] | null>(null)
  const [connState, setConnState] = useState<ConnState>(null)
  const [following, setFollowing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const [profileRes, postsRes] = await Promise.all([
      api.get<FighterProfile>(`/profiles/fighters/${targetId}`),
      api.get<PostItem[]>(`/posts/by-user/${targetId}`),
    ])
    setProfile(profileRes)
    setPosts(postsRes)

    if (!isSelf && me?.account_type === 'fighter') {
      const connections = await api.get<ConnectionEntry[]>('/connections')
      const match = connections.find((c) => c.fighter.user_id === targetId && c.status !== 'declined')
      setConnState(match ? { connectionId: match.id, status: match.status as 'pending' | 'accepted', direction: match.direction } : null)
    }
    if (!isSelf) {
      const follows = await api.get<FollowEntry[]>('/follows/me')
      setFollowing(follows.some((f) => f.target.user_id === targetId))
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId])

  async function connect() {
    setError(null)
    setBusy(true)
    try {
      await api.post(`/connections/${targetId}`)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function cancelRequest() {
    if (!connState) return
    setError(null)
    setBusy(true)
    try {
      await api.delete(`/connections/${connState.connectionId}`)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function toggleFollow() {
    setError(null)
    setBusy(true)
    try {
      if (following) await api.delete(`/follows/${targetId}`)
      else await api.post(`/follows/${targetId}`)
      setFollowing((f) => !f)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (!profile) return <p className="mt-16 text-center text-steel-light">Loading...</p>

  return (
    <div className="mx-auto mt-12 max-w-lg px-4 pb-16">
      <div className="flex items-center gap-5">
        <FighterAvatar profile={profile} />
        <div>
          <h1 className="font-display text-4xl">{fighterDisplayName(profile)}</h1>
          <p className="mt-1 text-steel-light text-sm">Age {profile.age}</p>
        </div>
      </div>
      {profile.bio && <p className="mt-4 whitespace-pre-wrap">{profile.bio}</p>}
      <SocialCounts
        followerCount={profile.follower_count}
        followingCount={profile.following_count}
        connectionCount={profile.connection_count}
      />

      {error && <p className="mt-3 text-sm text-jab">{error}</p>}

      {!isSelf && (
        <div className="mt-6 flex gap-3">
          <Button onClick={toggleFollow} disabled={busy} variant={following ? 'ghost' : 'primary'}>
            {following ? 'Following' : 'Follow'}
          </Button>
          {me?.account_type === 'fighter' &&
            (connState?.status === 'accepted' ? (
              <span className="flex items-center text-sm uppercase tracking-wide text-amber">Connected</span>
            ) : connState?.status === 'pending' && connState.direction === 'outgoing' ? (
              <Button variant="ghost" onClick={cancelRequest} disabled={busy}>
                Cancel Request
              </Button>
            ) : connState?.status === 'pending' && connState.direction === 'incoming' ? (
              <span className="flex items-center text-sm uppercase tracking-wide text-steel-light">
                Requested You
              </span>
            ) : (
              <Button variant="ghost" onClick={connect} disabled={busy}>
                Connect
              </Button>
            ))}
          <Link
            to={`/messages/${targetId}`}
            state={{ otherUser: { user_id: targetId, account_type: 'fighter', display_name: fighterDisplayName(profile), profile_picture_url: profile.profile_picture_url } }}
            className="flex items-center rounded border border-steel px-6 py-2.5 text-sm hover:border-jab hover:text-jab"
          >
            Message
          </Link>
        </div>
      )}

      <h2 className="font-display mt-10 text-2xl">Sports</h2>
      <FighterSportsSection sports={profile.sports} />

      <h2 className="font-display mt-10 text-2xl">Posts</h2>
      {posts === null ? (
        <p className="mt-4 text-steel-light">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="mt-4 text-steel-light">No posts yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}
