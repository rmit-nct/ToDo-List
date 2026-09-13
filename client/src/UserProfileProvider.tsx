import { useMemo, useState, type ReactNode } from 'react'
import type { Member } from './types'
import { UserProfileContext, type UserProfile } from './userProfileContext'

const storageKey = 'neo-user-profile:v1'
const defaultProfile: UserProfile = { name: 'Workspace User', email: '' }

function loadProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return defaultProfile
    const value = JSON.parse(saved) as Partial<UserProfile>
    return {
      name: typeof value.name === 'string' && value.name.trim() ? value.name.trim() : defaultProfile.name,
      email: typeof value.email === 'string' ? value.email : '',
    }
  } catch {
    return defaultProfile
  }
}

function initialsFor(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length > 1) return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
  return (words[0] ?? 'WU').slice(0, 2).toUpperCase()
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, updateProfile] = useState<UserProfile>(loadProfile)

  const setProfile = (nextProfile: UserProfile) => {
    const normalized = { name: nextProfile.name.trim(), email: nextProfile.email.trim() }
    updateProfile(normalized)
    try {
      localStorage.setItem(storageKey, JSON.stringify(normalized))
    } catch {
      // The profile still works for this session when browser storage is unavailable.
    }
  }

  const currentMember = useMemo<Member>(() => ({
    id: 'm1',
    name: profile.name,
    initials: initialsFor(profile.name),
    color: '#fbb61b',
  }), [profile.name])

  const value = useMemo(() => ({ profile, currentMember, setProfile }), [currentMember, profile])
  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
}
