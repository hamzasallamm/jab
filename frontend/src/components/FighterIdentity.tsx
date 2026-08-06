import { API_BASE } from '../api/client'
import type { FighterProfile, FighterSummary } from '../types'

type NamedFighter = Pick<FighterProfile | FighterSummary, 'first_name' | 'last_name' | 'fight_name'>
type PicturedFighter = NamedFighter & Pick<FighterProfile | FighterSummary, 'profile_picture_url'>

export function fighterDisplayName(profile: NamedFighter) {
  return profile.fight_name
    ? `${profile.first_name} "${profile.fight_name}" ${profile.last_name}`
    : `${profile.first_name} ${profile.last_name}`
}

function initials(profile: NamedFighter) {
  return `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase()
}

export function FighterAvatar({ profile, size = 96 }: { profile: PicturedFighter; size?: number }) {
  const src = profile.profile_picture_url ? `${API_BASE}${profile.profile_picture_url}` : null
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-steel bg-surface font-display text-2xl text-steel-light"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={fighterDisplayName(profile)} className="h-full w-full object-cover" />
      ) : (
        initials(profile)
      )}
    </div>
  )
}
