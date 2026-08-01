import { clearStoredSession } from '@/utils/auth'

const localApiBaseUrl = 'http://localhost/project_Jebal/api'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || localApiBaseUrl).replace(/\/$/, '')

let csrfToken = ''

export function buildApiUrl(path) {
  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export function setCsrfToken(token) {
  csrfToken = String(token || '')
}

export function getCsrfToken() {
  return csrfToken
}

export async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {})

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const method = String(options.method || 'GET').toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (csrfToken) headers.set('X-CSRF-Token', csrfToken)
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (response.status === 401) {
    setCsrfToken('')
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
