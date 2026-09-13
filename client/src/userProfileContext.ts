import { createContext, useContext } from 'react'
import type { Member } from './types'

export type UserProfile = { name: string; email: string }
export type UserProfileValue = {
  profile: UserProfile
  currentMember: Member
  setProfile: (profile: UserProfile) => void
}

export const UserProfileContext = createContext<UserProfileValue | null>(null)

export function useUserProfile() {
  const value = useContext(UserProfileContext)
  if (!value) throw new Error('useUserProfile must be used inside UserProfileProvider')
  return value
}
