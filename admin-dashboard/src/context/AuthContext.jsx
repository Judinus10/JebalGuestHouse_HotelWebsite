import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { clearStoredSession } from '@/utils/auth'
import { loginAdmin, logoutAdmin, verifyAdminSession } from '@/services/authApi'
import { setCsrfToken } from '@/services/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const [sessionRetryKey, setSessionRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      clearStoredSession()
      setSessionError('')

      try {
        const session = await verifyAdminSession()

        if (cancelled) return

        if (session?.user) {
          setCsrfToken(session.csrf_token)
          setUser(session.user)
        } else {
          setCsrfToken('')
          clearStoredSession()
          setUser(null)
        }
      } catch (error) {
        if (cancelled) return

        setCsrfToken('')
        clearStoredSession()
        setUser(null)
        setSessionError(error?.message || 'Unable to verify the admin session.')
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [sessionRetryKey])

  const retrySession = () => {
    setInitializing(true)
    setSessionError('')
    setSessionRetryKey((value) => value + 1)
  }

  const login = async ({ email, password }) => {
    const payload = await loginAdmin({ email, password })
    const nextUser = payload.data.user

    setCsrfToken(payload.data.csrf_token)
    setUser(nextUser)

    return nextUser
  }

  const logout = async () => {
    clearStoredSession()
    const logoutRequest = logoutAdmin()
    setCsrfToken('')
    setUser(null)
    await logoutRequest
  }

  const value = useMemo(
    () => ({
      user,
      initializing,
      sessionError,
      isAuthenticated: Boolean(user),
      retrySession,
      login,
      logout,
    }),
    [user, initializing, sessionError]
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
