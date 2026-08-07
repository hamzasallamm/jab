export type Sport = 'boxing' | 'mma' | 'bjj'
export type FighterStatus = 'pro' | 'amateur'
export type AccountType = 'fighter' | 'gym'

export interface FighterProfile {
  id: number
  user_id: number
  first_name: string
  last_name: string
  fight_name: string | null
  profile_picture_url: string | null
  age: number
  sport: Sport
  gym: string | null
  status: FighterStatus
  amateur_wins: number
  amateur_losses: number
  amateur_draws: number
  pro_wins: number
  pro_losses: number
  pro_draws: number
}

export interface GymProfile {
  id: number
  user_id: number
  org_name: string
  location: string | null
  bio: string | null
  sports: Sport[]
}

export interface Me {
  id: number
  email: string
  account_type: AccountType
  fighter_profile: FighterProfile | null
  gym_profile: GymProfile | null
}

export type ConnectionStatusType = 'pending' | 'accepted' | 'declined'

export interface FighterSummary {
  user_id: number
  first_name: string
  last_name: string
  fight_name: string | null
  profile_picture_url: string | null
  sport: Sport
  gym: string | null
  status: FighterStatus
}

export interface GymSummary {
  user_id: number
  org_name: string
  location: string | null
  sports: Sport[]
}

export interface ConnectionEntry {
  id: number
  status: ConnectionStatusType
  direction: 'incoming' | 'outgoing'
  fighter: FighterSummary
}

export interface FollowEntry {
  id: number
  gym: GymSummary
}

export type PostType = 'text' | 'fight_result' | 'sparring_session' | 'repost'
export type MediaType = 'image' | 'video'
export type FightOutcome = 'win' | 'loss' | 'draw' | 'no_contest'

export interface PostMediaItem {
  id: number
  media_url: string
  media_type: MediaType
}

export interface PostTagItem {
  user_id: number
  display_name: string
}

export interface PostAuthor {
  user_id: number
  account_type: AccountType
  display_name: string
  profile_picture_url: string | null
}

export interface FightResultData {
  opponent_name: string
  sport: Sport
  result: FightOutcome
  event_name: string | null
  event_date: string | null
}

export interface SparringSessionData {
  id: number
  sport: Sport
  session_date: string
  session_time: string
  location: string
  skill_level_notes: string | null
}

export interface RepostOfItem {
  id: number
  post_type: PostType
  body: string | null
  created_at: string
  author: PostAuthor
  media: PostMediaItem[]
  fight_result: FightResultData | null
  sparring_session: SparringSessionData | null
}

export interface PostItem {
  id: number
  post_type: PostType
  body: string | null
  created_at: string
  author: PostAuthor
  media: PostMediaItem[]
  tags: PostTagItem[]
  fight_result: FightResultData | null
  sparring_session: SparringSessionData | null
  repost_of: RepostOfItem | null
  like_count: number
  comment_count: number
  repost_count: number
  liked_by_me: boolean
  my_repost_id: number | null
}

export interface CommentItem {
  id: number
  body: string
  created_at: string
  author: PostAuthor
}

export type SparringRequestStatusType = 'pending' | 'accepted' | 'declined'
export type MyRequestStatus = 'none' | SparringRequestStatusType

export interface SparringSessionCard {
  post_id: number
  session_id: number
  sport: Sport
  session_date: string
  session_time: string
  location: string
  skill_level_notes: string | null
  body: string | null
  created_at: string
  author: PostAuthor
  is_owner: boolean
  my_request_status: MyRequestStatus
  pending_request_count: number
}

export interface SparringRequesterItem {
  request_id: number
  status: SparringRequestStatusType
  requester_user_id: number
  requester_display_name: string
  requester_profile_picture_url: string | null
}
