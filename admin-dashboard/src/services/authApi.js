import { API_BASE_URL, getCsrfToken } from '@/services/apiClient'

const SESSION_CHECK_TIMEOUT_MS = 10000

async function readJsonResponse(response) {
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Request failed. Please try again.')
  }

  return payload
}

export async function loginAdmin({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  return readJsonResponse(response)
}

export async function logoutAdmin() {
  const csrfToken = getCsrfToken()
  await fetch(`${API_BASE_URL}/auth/logout.php`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
    credentials: 'include',
  }).catch(() => null)
}

export async function verifyAdminSession() {
  const hasCsrfCookie = document.cookie
    .split(';')
    .some((cookie) => cookie.trim().startsWith('jebal_admin_csrf='))

  // A valid login always sets this readable companion cookie. Avoid a noisy
  // 401 request when the user opens a protected URL before signing in.
  if (!hasCsrfCookie) return null

  const controller = new AbortController()
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    SESSION_CHECK_TIMEOUT_MS
  )

  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/me.php`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Session check timed out. Check Apache and MySQL, then retry.')
    }

    throw new Error('Unable to contact the server. Check Apache and your API configuration.')
  } finally {
    window.clearTimeout(timeoutId)
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    return null
  }

  return payload.data || null
}
