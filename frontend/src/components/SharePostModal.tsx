import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Avatar } from './Avatar'
import { conversationTitle } from '../pages/Messages'
import { useAuth } from '../context/AuthContext'
import type { ConversationItem } from '../types'

export function SharePostModal({ postId, onClose }: { postId: number; onClose: () => void }) {
  const { me } = useAuth()
  const [conversations, setConversations] = useState<ConversationItem[] | null>(null)
  const [sentTo, setSentTo] = useState<Set<number>>(new Set())

  useEffect(() => {
    api.get<ConversationItem[]>('/conversations').then(setConversations)
  }, [])

  async function sendTo(conversationId: number) {
    await api.post(`/conversations/${conversationId}/messages`, { shared_post_id: postId })
    setSentTo((prev) => new Set(prev).add(conversationId))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/60 px-4 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-md rounded border border-steel bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-xl">Send Post</p>
        <p className="mt-1 text-sm text-steel-light">People you've recently messaged</p>

        <div className="mt-3 flex max-h-80 flex-col gap-1 overflow-y-auto">
          {conversations === null ? (
            <p className="px-2 py-2 text-sm text-steel-light">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-2 text-sm text-steel-light">No conversations yet.</p>
          ) : (
            conversations.map((c) => {
              const title = conversationTitle(c, me?.id)
              const avatarPerson = c.is_group ? null : c.participants.find((p) => p.user_id !== me?.id)
              const sent = sentTo.has(c.id)
              return (
                <button
                  key={c.id}
                  onClick={() => sendTo(c.id)}
                  disabled={sent}
                  className="flex items-center justify-between gap-3 rounded px-2 py-2 text-left hover:bg-jab/10 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={title} pictureUrl={avatarPerson?.profile_picture_url} size={32} />
                    <span className="text-sm">{title}</span>
                  </div>
                  <span className="text-xs text-jab">{sent ? 'Sent' : 'Send'}</span>
                </button>
              )
            })
          )}
        </div>

        <button onClick={onClose} className="mt-4 text-sm text-steel-light hover:text-bone">
          Done
        </button>
      </div>
    </div>
  )
}
