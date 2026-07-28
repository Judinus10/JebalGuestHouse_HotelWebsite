export function clearStoredSession() {
  try {
    localStorage.removeItem('jebal_admin_user')
    localStorage.removeItem('jebal_admin_token')
    localStorage.removeItem('jebal_admin_storage_mode')
    sessionStorage.removeItem('jebal_admin_user')
    sessionStorage.removeItem('jebal_admin_token')
  } catch {
    // Ignore storage errors.
  }
}
