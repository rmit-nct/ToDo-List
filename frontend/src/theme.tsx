import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'

import { ThemeContext, type ThemePreference } from './themeContext'
const key = 'neo:theme:v1'
const valid = (value: string | null): ThemePreference =>
  value === 'light' || value === 'dark' ? value : 'system'

function readPreference(): ThemePreference {
  try { return valid(localStorage.getItem(key)) } catch { return 'system' }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, updatePreference] = useState(readPreference)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [storageError, setStorageError] = useState('')
  const dark = preference === 'dark' || (preference === 'system' && systemDark)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(media.matches)
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) updatePreference(readPreference())
    }
    media.addEventListener('change', onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      media.removeEventListener('change', onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.themeChanging = ''
    root.dataset.theme = dark ? 'dark' : 'light'
    root.classList.toggle('theme-dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'

    // Keep transitions disabled through the first paint of the new palette.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => { delete root.dataset.themeChanging })
    })
    return () => {
      cancelAnimationFrame(frame)
      delete root.dataset.themeChanging
    }
  }, [dark])

  const setPreference = (value: ThemePreference) => {
    updatePreference(value)
    try {
      localStorage.setItem(key, value)
      setStorageError('')
    } catch {
      setStorageError('Your theme changed, but this browser could not save it for your next visit.')
    }
  }

  return <ThemeContext.Provider value={{ preference, dark, setPreference, toggleTheme: () => setPreference(dark ? 'light' : 'dark'), storageError }}>{children}</ThemeContext.Provider>
}
