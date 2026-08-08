import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Avatar } from '../components/Avatar'
import type { ConversationItem } from '../types'

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

export function Messages() {
  const [conversations, setConversations] = useState<ConversationItem[] | null>(null)

  async function load() {
    const res = await api.get<ConversationItem[]>('/messages/conversations')
    setConversations(res)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000) // near-real-time via polling
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mx-auto mt-12 max-w-lg px-4 pb-16">
      <h1 className="font-display text-4xl">Messages</h1>

      {conversations === null ? (
        <p className="mt-8 text-steel-light">Loading...</p>
      ) : conversations.length === 0 ? (
        <p className="mt-8 text-steel-light">
          No conversations yet. Visit a fighter's profile to send them a message.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {conversations.map((c) => (
            <Link
              key={c.other_user.user_id}
              to={`/messages/${c.other_user.user_id}`}
              className="flex items-center gap-4 rounded border border-steel p-4 hover:border-jab"
            >
              <Avatar name={c.other_user.display_name} pictureUrl={c.other_user.profile_picture_url} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg">{c.other_user.display_name}</p>
                  <p className="shrink-0 text-xs text-steel-light">{timeAgo(c.last_message.created_at)}</p>
                </div>
                <p className="truncate text-sm text-steel-light">{c.last_message.body}</p>
              </div>
              {c.unread_count > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-jab px-1.5 text-xs text-bone">
                  {c.unread_count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
