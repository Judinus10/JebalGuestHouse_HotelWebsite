import { clearStoredSession } from '@/utils/auth'
import { AdminRequestError, responseError } from '@/services/adminErrors'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!configuredApiBaseUrl) {
  throw new Error('VITE_API_BASE_URL must be set in the admin dashboard .env file')
}

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '')

let csrfToken = ''
const DEFAULT_REQUEST_TIMEOUT_MS = 15000

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
  const controller = new AbortController()
  const timeoutMs = Number(options.timeoutMs || DEFAULT_REQUEST_TIMEOUT_MS)
  const externalSignal = options.signal
  const abortFromExternalSignal = () => controller.abort()

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort()
    else externalSignal.addEventListener('abort', abortFromExternalSignal, { once: true })
  }

  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
  const headers = new Headers(options.headers || {})

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const method = String(options.method || 'GET').toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (csrfToken) headers.set('X-CSRF-Token', csrfToken)
  }

  let response

  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new AdminRequestError('The server took too long to respond. Please try again.', { code: 'TIMEOUT' })
    }

    throw new AdminRequestError('Unable to connect to the server. Check your internet connection and try again.', { code: 'NETWORK_ERROR' })
  } finally {
    window.clearTimeout(timeoutId)
    externalSignal?.removeEventListener?.('abort', abortFromExternalSignal)
  }

  if (response.status === 401) {
    setCsrfToken('')
    clearStoredSession()
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
  }

  return response
}

export async function readJsonResponse(response, context = '') {
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw responseError(payload, response, context)
  }

  return payload
}
