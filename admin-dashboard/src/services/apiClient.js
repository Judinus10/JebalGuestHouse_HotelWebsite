import { clearStoredSession, getStoredToken } from '@/utils/auth'

export async function apiFetch(url, options = {}) {
  const token = getStoredToken()
  const headers = new Headers(options.headers || {})

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearStoredSession()
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
  }

  return response
}

export async function readJsonResponse(response) {
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Request failed. Please try again.')
  }

  return payload
}

