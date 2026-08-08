import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { Avatar } from '../components/Avatar'
import type { MessageItem, PostAuthor } from '../types'

export function MessageThread() {
  const { userId } = useParams<{ userId: string }>()
  const otherId = Number(userId)
  const { me } = useAuth()
  const location = useLocation()
  const [messages, setMessages] = useState<MessageItem[] | null>(null)
  const [otherUser, setOtherUser] = useState<PostAuthor | null>(
    (location.state as { otherUser?: PostAuthor } | null)?.otherUser ?? null,
  )
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const [thread, conversations] = await Promise.all([
      api.get<MessageItem[]>(`/messages/${otherId}`),
      api.get<{ other_user: PostAuthor }[]>('/messages/conversations'),
    ])
    setMessages(thread)
    const match = conversations.find((c) => c.other_user.user_id === otherId)
    if (match) setOtherUser(match.other_user)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 3000) // near-real-time via polling
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!draft.trim()) return
    setSending(true)
    try {
      const message = await api.post<MessageItem>(`/messages/${otherId}`, { body: draft })
      setMessages((prev) => (prev ? [...prev, message] : [message]))
      setDraft('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto mt-8 flex h-[calc(100vh-10rem)] max-w-lg flex-col px-4">
      <div className="flex items-center gap-3 border-b border-steel pb-4">
        {otherUser && <Avatar name={otherUser.display_name} pictureUrl={otherUser.profile_picture_url} size={40} />}
        <h1 className="font-display text-2xl">{otherUser?.display_name ?? 'Conversation'}</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {messages === null ? (
          <p className="text-steel-light">Loading...</p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.sender_id === me?.id
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded px-3 py-2 text-sm ${
                      mine ? 'bg-jab text-bone' : 'bg-surface text-bone'
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-steel pt-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Write a message..."
          className="flex-1 rounded border border-steel bg-surface px-3 py-2 text-sm text-bone placeholder:text-steel-light focus:border-jab focus:outline-none"
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          className="rounded bg-jab px-4 py-2 text-sm text-bone disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
