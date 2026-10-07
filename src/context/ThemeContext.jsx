import { createContext, useContext, useEffect, useState } from 'react'

// The theme is the shared huynh.place one (https://huynh.place/shared/huynh-ui.js, loaded in
// index.html): one light/dark choice across the main site, B.E.T., Home Search HQ, Video Reviews
// and this app. This context mirrors it into React state and into Tailwind's `.dark` class.
const ThemeContext = createContext(undefined)

function sharedTheme() {
  return window.HuynhUI ? window.HuynhUI.getTheme() : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(sharedTheme)

  useEffect(() => {
    const sync = () => setTheme(sharedTheme())
    document.addEventListener('hu-themechange', sync)
    return () => document.removeEventListener('hu-themechange', sync)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => {
    if (window.HuynhUI) window.HuynhUI.toggleTheme() // fires hu-themechange -> sync
    else setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (ctx === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
