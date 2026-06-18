export const AUTH_USER_KEY = 'hotel_auth_user'
export const AUTH_TOKEN_KEY = 'hotel_auth_token'
export const MOCK_AUTH_TOKEN = 'hotel-admin-token'

export const MOCK_USER = {
  id: 1,
  name: 'Hotel Administrator',
  email: 'admin@hotel.com',
  role: 'admin',
}

export function getStoredUser() {
  try {
    const rawUser = localStorage.getItem(AUTH_USER_KEY)
    const token = localStorage.getItem(AUTH_TOKEN_KEY)

    if (!rawUser || token !== MOCK_AUTH_TOKEN) {
      return null
    }

    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return Boolean(getStoredUser() && getStoredToken() === MOCK_AUTH_TOKEN)
}

export function createMockSession() {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(MOCK_USER))
  localStorage.setItem(AUTH_TOKEN_KEY, MOCK_AUTH_TOKEN)
  return MOCK_USER
}

export function clearMockSession() {
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_TOKEN_KEY)
}
