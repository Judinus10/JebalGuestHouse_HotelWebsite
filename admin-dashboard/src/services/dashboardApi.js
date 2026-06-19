import { apiFetch, readJsonResponse } from '@/services/apiClient'

const API_BASE_URL = import.meta.env.VITE_DASHBOARD_API_BASE_URL || '/api/dashboard'

export async function fetchDashboardStats() {
  const response = await apiFetch(`${API_BASE_URL}/stats.php`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const payload = await readJsonResponse(response)
  return payload.data
}
