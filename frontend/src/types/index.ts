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
