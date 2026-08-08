export type Sport = 'boxing' | 'mma' | 'bjj'
export type FighterStatus = 'pro' | 'amateur'
export type AccountType = 'fighter' | 'gym'
export type BeltColor = 'white' | 'blue' | 'purple' | 'brown' | 'black'

export interface FighterSport {
  id: number
  sport: Sport
  gym: string | null
  status: FighterStatus
  belt: BeltColor | null
  amateur_wins: number
  amateur_losses: number
  amateur_draws: number
  pro_wins: number
  pro_losses: number
  pro_draws: number
}

export interface FighterProfile {
  id: number
  user_id: number
  first_name: string
  last_name: string
  fight_name: string | null
  profile_picture_url: string | null
  bio: string | null
  age: number
  sports: FighterSport[]
  follower_count: number
  following_count: number
  connection_count: number
}

export interface GymProfile {
  id: number
  user_id: number
  org_name: string
  location: string | null
  bio: string | null
  sports: Sport[]
  follower_count: number
  following_count: number
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
  sports: FighterSport[]
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

export interface FollowEntry {
  id: number
  target: PostAuthor
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

export interface ReactionSummary {
  emoji: string
  count: number
  reacted_by_me: boolean
}

export interface SharedPostItem {
  id: number
  post_type: PostType
  body: string | null
  author: PostAuthor
  media: PostMediaItem[]
  fight_result: FightResultData | null
  sparring_session: SparringSessionData | null
}

export interface MessageItem {
  id: number
  conversation_id: number
  sender_id: number
  body: string | null
  shared_post: SharedPostItem | null
  edited_at: string | null
  created_at: string
  reactions: ReactionSummary[]
}

export interface ConversationItem {
  id: number
  is_group: boolean
  name: string | null
  participants: PostAuthor[]
  last_message: MessageItem | null
  unread_count: number
}
