import { useEffect, useState } from 'react'
import { api, API_BASE } from '../api/client'
import { Avatar } from './Avatar'
import { SharePostModal } from './SharePostModal'
import type { CommentItem, PostAuthor, PostItem, RepostOfItem } from '../types'

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

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function RepostIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function PostHeader({ author, createdAt }: { author: PostAuthor; createdAt: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={author.display_name} pictureUrl={author.profile_picture_url} />
      <div>
        <p className="font-display text-lg leading-tight">{author.display_name}</p>
        <p className="text-xs text-steel-light">{timeAgo(createdAt)}</p>
      </div>
    </div>
  )
}

function PostBody({ post }: { post: Pick<PostItem, 'post_type' | 'body' | 'fight_result' | 'sparring_session' | 'media'> | RepostOfItem }) {
  return (
    <>
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
              <img key={m.id} src={`${API_BASE}${m.media_url}`} className="max-h-96 w-full rounded object-cover" alt="" />
            ) : (
              <video key={m.id} src={`${API_BASE}${m.media_url}`} controls className="max-h-96 w-full rounded" />
            ),
          )}
        </div>
      )}
    </>
  )
}

export function PostCard({ post: initialPost }: { post: PostItem }) {
  const [post, setPost] = useState(initialPost)
  const [showComments, setShowComments] = useState(false)
  const [showRepostComposer, setShowRepostComposer] = useState(false)
  const [repostCaption, setRepostCaption] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [busy, setBusy] = useState(false)

  async function toggleLike() {
    if (busy) return
    setBusy(true)
    try {
      const updated = post.liked_by_me
        ? await api.delete<PostItem>(`/posts/${post.id}/like`)
        : await api.post<PostItem>(`/posts/${post.id}/like`)
      setPost(updated)
    } catch {
      // best-effort; UI just stays as-is on failure
    } finally {
      setBusy(false)
    }
  }

  function handleRepostClick() {
    if (post.my_repost_id) undoRepost()
    else setShowRepostComposer((s) => !s)
  }

  async function undoRepost() {
    if (busy) return
    setBusy(true)
    try {
      await api.delete(`/posts/${post.my_repost_id}`)
      setPost((p) => ({ ...p, my_repost_id: null, repost_count: Math.max(0, p.repost_count - 1) }))
    } catch {
      // best-effort; UI just stays as-is on failure
    } finally {
      setBusy(false)
    }
  }

  async function submitRepost() {
    if (busy) return
    setBusy(true)
    try {
      const form = new FormData()
      if (repostCaption.trim()) form.append('body', repostCaption.trim())
      const created = await api.postForm<PostItem>(`/posts/${post.id}/repost`, form)
      setPost((p) => ({ ...p, my_repost_id: created.id, repost_count: p.repost_count + 1 }))
      setShowRepostComposer(false)
      setRepostCaption('')
    } catch {
      // best-effort; UI just stays as-is on failure (e.g. a duplicate-repost race)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded border border-steel p-4">
      <PostHeader author={post.author} createdAt={post.created_at} />

      {post.post_type === 'repost' ? (
        <>
          {post.body && <p className="mt-3 whitespace-pre-wrap">{post.body}</p>}
          {post.repost_of ? (
            <div className="mt-3 rounded border border-steel p-3">
              <PostHeader author={post.repost_of.author} createdAt={post.repost_of.created_at} />
              <PostBody post={post.repost_of} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-steel-light">Original post is no longer available.</p>
          )}
        </>
      ) : (
        <PostBody post={post} />
      )}

      {post.tags.length > 0 && (
        <p className="mt-3 text-sm text-steel-light">with {post.tags.map((t) => t.display_name).join(', ')}</p>
      )}

      <div className="mt-4 flex items-center gap-6 border-t border-steel pt-3 text-steel-light">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-sm hover:text-jab ${post.liked_by_me ? 'text-jab' : ''}`}
        >
          <HeartIcon filled={post.liked_by_me} />
          {post.like_count > 0 && post.like_count}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className={`flex items-center gap-1.5 text-sm hover:text-jab ${showComments ? 'text-jab' : ''}`}
        >
          <CommentIcon />
          {post.comment_count > 0 && post.comment_count}
        </button>
        <button
          onClick={handleRepostClick}
          className={`flex items-center gap-1.5 text-sm hover:text-amber ${post.my_repost_id ? 'text-amber' : ''}`}
        >
          <RepostIcon />
          {post.repost_count > 0 && post.repost_count}
        </button>
        <button onClick={() => setShowShareModal(true)} className="flex items-center gap-1.5 text-sm hover:text-jab">
          <ShareIcon />
        </button>
      </div>

      {showShareModal && <SharePostModal postId={post.id} onClose={() => setShowShareModal(false)} />}

      {showRepostComposer && (
        <div className="mt-3 border-t border-steel pt-3">
          <textarea
            value={repostCaption}
            onChange={(e) => setRepostCaption(e.target.value)}
            placeholder="Add a comment (optional)"
            rows={2}
            className="w-full rounded border border-steel bg-surface px-3 py-2 text-sm text-bone placeholder:text-steel-light focus:border-jab focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={submitRepost}
              disabled={busy}
              className="rounded bg-jab px-3 py-1.5 text-sm text-bone disabled:opacity-50"
            >
              Repost
            </button>
            <button
              onClick={() => {
                setShowRepostComposer(false)
                setRepostCaption('')
              }}
              className="px-3 py-1.5 text-sm text-steel-light hover:text-bone"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showComments && (
        <CommentsSection
          postId={post.id}
          onCommentAdded={() => setPost((p) => ({ ...p, comment_count: p.comment_count + 1 }))}
        />
      )}
    </div>
  )
}

function CommentsSection({ postId, onCommentAdded }: { postId: number; onCommentAdded: () => void }) {
  const [comments, setComments] = useState<CommentItem[] | null>(null)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    const res = await api.get<CommentItem[]>(`/posts/${postId}/comments`)
    setComments(res)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  async function submit() {
    if (!draft.trim()) return
    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('body', draft)
      const comment = await api.postForm<CommentItem>(`/posts/${postId}/comments`, form)
      setComments((prev) => (prev ? [...prev, comment] : [comment]))
      setDraft('')
      onCommentAdded()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3 border-t border-steel pt-3">
      {comments === null ? (
        <p className="text-sm text-steel-light">Loading comments...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar name={c.author.display_name} pictureUrl={c.author.profile_picture_url} size={32} />
              <div className="rounded bg-surface px-3 py-2">
                <p className="text-sm font-semibold">{c.author.display_name}</p>
                <p className="text-sm">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Write a comment..."
          className="flex-1 rounded border border-steel bg-surface px-3 py-1.5 text-sm text-bone placeholder:text-steel-light focus:border-jab focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={submitting || !draft.trim()}
          className="rounded bg-jab px-3 py-1.5 text-sm text-bone disabled:opacity-50"
        >
          Post
        </button>
      </div>
    </div>
  )
}
