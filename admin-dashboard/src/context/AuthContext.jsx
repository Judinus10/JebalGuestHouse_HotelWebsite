import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { clearMockSession, createMockSession, getStoredToken, getStoredUser } from '@/utils/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const storedUser = getStoredUser()
    const storedToken = getStoredToken()

    if (storedUser && storedToken) {
      setUser(storedUser)
      setToken(storedToken)
    }

    setInitializing(false)
  }, [])

  const login = () => {
    const sessionUser = createMockSession()
    const sessionToken = getStoredToken()

    setUser(sessionUser)
    setToken(sessionToken)

    return sessionUser
  }

  const logout = () => {
    clearMockSession()
    setUser(null)
    setToken(null)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
    }),
    [user, token, initializing]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
