import { API_BASE } from '../api/client'
import { Avatar } from './Avatar'
import type { PostItem } from '../types'

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function PostCard({ post }: { post: PostItem }) {
  return (
    <div className="rounded border border-steel p-4">
      <div className="flex items-center gap-3">
        <Avatar name={post.author.display_name} pictureUrl={post.author.profile_picture_url} />
        <div>
          <p className="font-display text-lg leading-tight">{post.author.display_name}</p>
          <p className="text-xs text-steel-light">{timeAgo(post.created_at)}</p>
        </div>
      </div>

      {post.post_type === 'fight_result' && post.fight_result && (
        <div className="mt-3 rounded border border-jab/40 bg-jab/10 p-3">
          <p className="font-display text-xs uppercase tracking-wide text-jab">Fight Result</p>
          <p className="mt-1 font-display text-lg">
            {post.fight_result.result.replace('_', ' ').toUpperCase()} vs {post.fight_result.opponent_name}
          </p>
          <p className="text-xs uppercase tracking-wide text-steel-light">
            {post.fight_result.sport}
            {post.fight_result.event_name ? ` · ${post.fight_result.event_name}` : ''}
            {post.fight_result.event_date ? ` · ${post.fight_result.event_date}` : ''}
          </p>
        </div>
      )}

      {post.post_type === 'sparring_session' && post.sparring_session && (
        <div className="mt-3 rounded border border-amber/40 bg-amber/10 p-3">
          <p className="font-display text-xs uppercase tracking-wide text-amber">Sparring Session</p>
          <p className="mt-1 font-display text-lg">
            {post.sparring_session.sport} · {post.sparring_session.session_date} @ {post.sparring_session.session_time}
          </p>
          <p className="text-xs uppercase tracking-wide text-steel-light">{post.sparring_session.location}</p>
          {post.sparring_session.skill_level_notes && (
            <p className="mt-1 text-sm">{post.sparring_session.skill_level_notes}</p>
          )}
        </div>
      )}

      {post.body && <p className="mt-3 whitespace-pre-wrap">{post.body}</p>}

      {post.media.length > 0 && (
        <div className={`mt-3 grid gap-2 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.media.map((m) =>
            m.media_type === 'image' ? (
              <img
                key={m.id}
                src={`${API_BASE}${m.media_url}`}
                className="max-h-96 w-full rounded object-cover"
                alt=""
              />
            ) : (
              <video key={m.id} src={`${API_BASE}${m.media_url}`} controls className="max-h-96 w-full rounded" />
            ),
          )}
        </div>
      )}

      {post.tags.length > 0 && (
        <p className="mt-3 text-sm text-steel-light">with {post.tags.map((t) => t.display_name).join(', ')}</p>
      )}
    </div>
  )
}
