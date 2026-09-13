import { createContext, useContext, useEffect, useState } from 'react'
import { pb } from '../lib/pocketbase'

const AuthContext = createContext(undefined)

// Adapts a PocketBase auth record to the shape the rest of the app already
// expects (it grew up around Firebase's `user.uid` / `user.email`).
function toUser(record) {
  if (!record) return null
  return { uid: record.id, email: record.email, ...record }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => toUser(pb.authStore.record))
  // PocketBase restores a persisted session synchronously from localStorage
  // on construction, so there's no real async "loading" phase like Firebase
  // had — but we still expose the flag so callers don't need to change.
  const loading = false

  useEffect(() => {
    return pb.authStore.onChange((_token, record) => {
      setUser(toUser(record))
    })
  }, [])

  const signIn = (email, password) => pb.collection('users').authWithPassword(email, password)
  const signOut = () => {
    pb.authStore.clear()
    return Promise.resolve()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
