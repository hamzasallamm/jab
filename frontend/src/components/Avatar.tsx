import { API_BASE } from '../api/client'

export function Avatar({ name, pictureUrl, size = 44 }: { name: string; pictureUrl?: string | null; size?: number }) {
  const src = pictureUrl ? `${API_BASE}${pictureUrl}` : null
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-steel bg-surface font-display text-sm text-steel-light"
      style={{ width: size, height: size }}
    >
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials}
    </div>
  )
}
