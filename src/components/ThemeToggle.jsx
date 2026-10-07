import { useTheme } from '../context/ThemeContext.jsx'

// The shared huynh.place theme toggle (styled by huynh-ui.css's .hu-theme-toggle).
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="hu-theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="hu-icon-light">🌙</span>
      <span className="hu-icon-dark">☀️</span>
    </button>
  )
}
