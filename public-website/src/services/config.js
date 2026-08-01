const localApiBaseUrl = 'http://localhost/project_Jebal/api'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || localApiBaseUrl).replace(/\/$/, '')
