import { useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import Login from './components/Login.jsx'
import ProgramEditor from './components/ProgramEditor.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import CalendarShell from './components/calendar/CalendarShell.jsx'

// Shared huynh.place app header (same bar as B.E.T., Home Search HQ and Video Reviews; styled by
// https://huynh.place/shared/huynh-ui.css), used on every screen of the app.
function AppShell({ actions, children }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="hu-shell">
        <div className="hu-shell-inner">
          <a className="hu-home" href="https://huynh.place">
            ← huynh.place
          </a>
          <div className="hu-app-id">
            <div>
              <h1 className="hu-app-name">Gym Dashboard</h1>
            </div>
          </div>
          <div className="hu-shell-actions">
            {actions}
            <ThemeToggle />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}

function App() {
  const { user, loading, signOut } = useAuth()
  const [showPrograms, setShowPrograms] = useState(false)

  if (loading) {
    return (
      <AppShell>
        <p className="text-sm text-neutral-500 text-center py-16">Loading...</p>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell>
        <Login />
      </AppShell>
    )
  }

  return (
    <AppShell
      actions={
        <>
          <button type="button" onClick={() => setShowPrograms(true)} className="hu-btn hu-btn-small">
            Programs
          </button>
          <button type="button" onClick={signOut} className="hu-btn hu-btn-small">
            Exit
          </button>
        </>
      }
    >
      <main>{showPrograms ? <ProgramEditor onClose={() => setShowPrograms(false)} /> : <CalendarShell />}</main>
    </AppShell>
  )
}

export default App
