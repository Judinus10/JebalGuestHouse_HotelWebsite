const messagesByCode = {
  INVALID_LOGIN: 'The email address or password is incorrect.',
  AUTH_REQUIRED: 'Your session has expired. Please sign in again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  RATE_LIMITED: 'Too many attempts. Please wait a few minutes before trying again.',
  IMAGE_TOO_LARGE: 'The selected image is too large. Reduce its file size and upload it again.',
  INVALID_IMAGE: 'The selected file is not a valid image. Choose another image.',
  UNSUPPORTED_IMAGE_TYPE: 'This image format is not supported. Use JPG, PNG or WEBP.',
  ROOM_UNAVAILABLE: 'The selected room is no longer available for these dates. Choose another room or change the dates.',
  ROOM_CAPACITY_EXCEEDED: 'The selected room cannot accommodate this number of guests.',
  BOOKING_CONFLICT: 'This booking conflicts with another active reservation.',
  DUPLICATE_AMENITY: 'An amenity with this name already exists.',
}

const contextFallbacks = {
  rooms: 'The room operation could not be completed. Check the details and try again.',
  bookings: 'The booking operation could not be completed. Refresh the booking and try again.',
  payments: 'The payment operation could not be completed. Refresh the booking and try again.',
  gallery: 'The gallery operation could not be completed. Please try again.',
  experience: 'The experience operation could not be completed. Please try again.',
  amenities: 'The amenity operation could not be completed. Please try again.',
  settings: 'Website settings could not be saved. Please try again.',
  messages: 'The customer-message operation could not be completed. Please try again.',
  dashboard: 'Dashboard information could not be loaded. Refresh the page to try again.',
  calendar: 'The booking calendar could not be loaded. Refresh the page to try again.',
  auth: 'The sign-in request could not be completed. Please try again.',
}

const technicalPattern = /(sql|pdo|mysqli|exception|stack|trace|fatal|warning|undefined|database|query|syntax|constraint|\/home\/|[a-z]:\\|\.php\b|vendor\/|localhost|apache|mysql|csrf token)/i

export class AdminRequestError extends Error {
  constructor(message, { code = '', status = 0 } = {}) {
    super(message)
    this.name = 'AdminRequestError'
    this.code = code
    this.status = status
  }
}

export function adminErrorMessage(error, context = '') {
  if (error?.name === 'AbortError' || error?.code === 'TIMEOUT') return 'The server took too long to respond. Please try again.'
  if (messagesByCode[error?.code]) return messagesByCode[error.code]
  if (error?.status === 401) return 'Your session has expired. Please sign in again.'
  if (error?.status === 403) return 'You do not have permission to perform this action.'
  if (error?.status === 429) return messagesByCode.RATE_LIMITED
  const candidate = String(error?.message || '').trim()
  if (candidate && candidate.length <= 240 && !technicalPattern.test(candidate)) return candidate
  return contextFallbacks[context] || 'Something went wrong on the server. Please try again. If the problem continues, contact technical support.'
}

export function responseError(payload, response, context = '') {
  const error = new AdminRequestError(payload?.message || '', {
    code: payload?.error_code || '',
    status: response?.status || 0,
  })
  error.message = adminErrorMessage(error, context)
  return error
}
