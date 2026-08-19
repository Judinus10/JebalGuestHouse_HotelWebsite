import { API_BASE_URL } from './config'
import { requestJson } from './publicErrors'

export async function fetchExperiences() {
  const payload = await requestJson(`${API_BASE_URL}/experience/public-list.php`, {}, 'experiences')

  return payload.data || []
}
