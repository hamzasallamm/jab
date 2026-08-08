import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/ui'
import { NewConversationModal } from '../components/NewConversationModal'
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

export function conversationTitle(conv: Pick<ConversationItem, 'is_group' | 'name' | 'participants'>, meId?: number) {
  if (conv.is_group) return conv.name || 'Group Chat'
  const other = conv.participants.find((p) => p.user_id !== meId)
  return other?.display_name ?? 'Conversation'
}

export function Messages() {
  const { me } = useAuth()
  const [conversations, setConversations] = useState<ConversationItem[] | null>(null)
  const [showNew, setShowNew] = useState(false)
  const navigate = useNavigate()

  async function load() {
    const res = await api.get<ConversationItem[]>('/conversations')
    setConversations(res)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000) // near-real-time via polling
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mx-auto mt-12 max-w-lg px-4 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Messages</h1>
        <Button onClick={() => setShowNew(true)}>New</Button>
      </div>

      {conversations === null ? (
        <p className="mt-8 text-steel-light">Loading...</p>
      ) : conversations.length === 0 ? (
        <p className="mt-8 text-steel-light">No conversations yet. Start one with the New button above.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {conversations.map((c) => {
            const title = conversationTitle(c, me?.id)
            const avatarPerson = c.is_group ? null : c.participants.find((p) => p.user_id !== me?.id)
            return (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className="flex items-center gap-4 rounded border border-steel p-4 hover:border-jab"
              >
                <Avatar name={title} pictureUrl={avatarPerson?.profile_picture_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-lg">{title}</p>
                    {c.last_message && (
                      <p className="shrink-0 text-xs text-steel-light">{timeAgo(c.last_message.created_at)}</p>
                    )}
                  </div>
                  <p className="truncate text-sm text-steel-light">
                    {c.last_message ? c.last_message.body ?? '📎 Shared a post' : 'No messages yet'}
                  </p>
                </div>
                {c.unread_count > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-jab px-1.5 text-xs text-bone">
                    {c.unread_count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {showNew && (
        <NewConversationModal
          onClose={() => setShowNew(false)}
          onCreated={(conv) => navigate(`/messages/${conv.id}`)}
        />
      )}
    </div>
  )
}
