import { createContext, useContext } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

export const ThemeContext = createContext<{
  preference: ThemePreference
  dark: boolean
  setPreference: (value: ThemePreference) => void
  toggleTheme: () => void
  storageError: string
} | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme requires ThemeProvider')
  return context
}
