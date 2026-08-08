import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, API_BASE } from '../api/client'
import { Avatar } from '../components/Avatar'
import { conversationTitle } from './Messages'
import type { ConversationItem, MessageItem } from '../types'

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '🔥']

export function MessageThread() {
  const { userId: conversationIdParam } = useParams<{ userId: string }>()
  const conversationId = Number(conversationIdParam)
  const { me } = useAuth()
  const [conversation, setConversation] = useState<ConversationItem | null>(null)
  const [messages, setMessages] = useState<MessageItem[] | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const [thread, conversations] = await Promise.all([
      api.get<MessageItem[]>(`/conversations/${conversationId}/messages`),
      api.get<ConversationItem[]>('/conversations'),
    ])
    setMessages(thread)
    const match = conversations.find((c) => c.id === conversationId)
    if (match) setConversation(match)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 3000) // near-real-time via polling
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!draft.trim()) return
    setSending(true)
    try {
      const message = await api.post<MessageItem>(`/conversations/${conversationId}/messages`, { body: draft })
      setMessages((prev) => (prev ? [...prev, message] : [message]))
      setDraft('')
    } finally {
      setSending(false)
    }
  }

  function updateMessage(updated: MessageItem) {
    setMessages((prev) => prev?.map((m) => (m.id === updated.id ? updated : m)) ?? null)
  }

  const title = conversation ? conversationTitle(conversation, me?.id) : 'Conversation'
  const avatarPerson = conversation && !conversation.is_group ? conversation.participants.find((p) => p.user_id !== me?.id) : null

  return (
    <div className="mx-auto mt-8 flex h-[calc(100vh-10rem)] max-w-lg flex-col px-4">
      <div className="flex items-center gap-3 border-b border-steel pb-4">
        <Avatar name={title} pictureUrl={avatarPerson?.profile_picture_url} size={40} />
        <div>
          <h1 className="font-display text-2xl">{title}</h1>
          {conversation?.is_group && (
            <p className="text-xs text-steel-light">{conversation.participants.map((p) => p.display_name).join(', ')}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {messages === null ? (
          <p className="text-steel-light">Loading...</p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                mine={m.sender_id === me?.id}
                senderName={conversation?.participants.find((p) => p.user_id === m.sender_id)?.display_name}
                showSenderName={!!conversation?.is_group}
                conversationId={conversationId}
                onUpdated={updateMessage}
              />
            ))}
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

function MessageBubble({
  message,
  mine,
  senderName,
  showSenderName,
  conversationId,
  onUpdated,
}: {
  message: MessageItem
  mine: boolean
  senderName?: string
  showSenderName: boolean
  conversationId: number
  onUpdated: (m: MessageItem) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editDraft, setEditDraft] = useState(message.body ?? '')
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  async function saveEdit() {
    if (!editDraft.trim()) return
    const updated = await api.patch<MessageItem>(`/conversations/${conversationId}/messages/${message.id}`, {
      body: editDraft,
    })
    onUpdated(updated)
    setEditing(false)
  }

  async function react(emoji: string) {
    const updated = await api.post<MessageItem>(`/conversations/${conversationId}/messages/${message.id}/react`, {
      emoji,
    })
    onUpdated(updated)
    setShowReactionPicker(false)
  }

  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      {showSenderName && !mine && <p className="mb-0.5 px-1 text-xs text-steel-light">{senderName}</p>}

      <div className={`group flex items-center gap-1.5 ${mine ? 'flex-row-reverse' : ''}`}>
        <div className={`max-w-[75%] rounded px-3 py-2 text-sm ${mine ? 'bg-jab text-bone' : 'bg-surface text-bone'}`}>
          {message.shared_post ? (
            <SharedPostPreview post={message.shared_post} caption={message.body} />
          ) : editing ? (
            <div className="flex flex-col gap-2">
              <input
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                autoFocus
                className="rounded border border-bone/30 bg-transparent px-2 py-1 text-sm text-bone focus:outline-none"
              />
              <div className="flex gap-2 text-xs">
                <button onClick={saveEdit} className="underline">
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditDraft(message.body ?? '')
                    setEditing(false)
                  }}
                  className="underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.body}
              {message.edited_at && <span className="ml-1.5 text-[10px] opacity-60">(edited)</span>}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setShowReactionPicker((s) => !s)}
            className="text-xs text-steel-light hover:text-jab"
            title="React"
          >
            😊
          </button>
          {mine && !message.shared_post && (
            <button onClick={() => setEditing(true)} className="text-xs text-steel-light hover:text-jab" title="Edit">
              ✎
            </button>
          )}
        </div>
      </div>

      {showReactionPicker && (
        <div className="mt-1 flex gap-1 rounded border border-steel bg-surface p-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button key={emoji} onClick={() => react(emoji)} className="px-1 text-sm hover:scale-125">
              {emoji}
            </button>
          ))}
        </div>
      )}

      {message.reactions.length > 0 && (
        <div className="mt-1 flex gap-1">
          {message.reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => react(r.emoji)}
              className={`rounded-full border px-1.5 py-0.5 text-xs ${
                r.reacted_by_me ? 'border-jab bg-jab/20' : 'border-steel'
              }`}
            >
              {r.emoji} {r.count}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SharedPostPreview({ post, caption }: { post: NonNullable<MessageItem['shared_post']>; caption: string | null }) {
  return (
    <div>
      {caption && <p className="mb-2">{caption}</p>}
      <div className="rounded border border-bone/20 p-2">
        <p className="text-xs font-semibold">{post.author.display_name}</p>
        {post.body && <p className="mt-1 text-xs">{post.body}</p>}
        {post.media[0] && (
          <img
            src={`${API_BASE}${post.media[0].media_url}`}
            className="mt-2 max-h-40 w-full rounded object-cover"
            alt=""
          />
        )}
      </div>
    </div>
  )
}
