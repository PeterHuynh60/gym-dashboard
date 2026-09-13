import { useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import Login from './components/Login.jsx'
import ProgramEditor from './components/ProgramEditor.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import CalendarShell from './components/calendar/CalendarShell.jsx'

function App() {
  const { user, loading, signOut } = useAuth()
  const [showPrograms, setShowPrograms] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="fixed top-4 right-4">
          <ThemeToggle />
        </div>
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative">
        <div className="fixed top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <Login />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="flex items-center justify-between px-4 py-4 border-b-2 border-brand-500">
        <h1 className="text-lg font-semibold text-brand-700 dark:text-brand-400">Gym Dashboard</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setShowPrograms(true)}
            className="min-h-10 px-4 rounded-lg text-sm font-medium border border-neutral-300 dark:border-neutral-700"
          >
            Programs
          </button>
          <button
            onClick={signOut}
            className="min-h-10 px-4 rounded-lg text-sm font-medium border border-neutral-300 dark:border-neutral-700"
          >
            Exit
          </button>
        </div>
      </header>
      <main>{showPrograms ? <ProgramEditor onClose={() => setShowPrograms(false)} /> : <CalendarShell />}</main>
    </div>
  )
}

export default App
