const API_BASE_URL = import.meta.env.VITE_DASHBOARD_API_BASE_URL || '/api/dashboard'

async function readJsonResponse(response) {
  let payload = null

  try {
    payload = await response.json()
  } catch (error) {
    payload = null
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Unable to load dashboard statistics.')
  }

  return payload
}

export async function fetchDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/stats.php`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const payload = await readJsonResponse(response)
  return payload.data
}