export class PublicRequestError extends Error {
  constructor(message, { code = 'REQUEST_FAILED', status = 0, retryable = false, outcomeUnknown = false } = {}) {
    super(message)
    this.name = 'PublicRequestError'
    this.code = code
    this.status = status
    this.retryable = retryable
    this.outcomeUnknown = outcomeUnknown
  }
}

const contextFallbacks = {
  rooms: 'Rooms could not be loaded right now. Please refresh the page or try again shortly.',
  room: 'This room could not be loaded right now. Please return to the rooms page and try again.',
  availability: 'We cannot check room availability right now. Please wait a moment and try again.',
  gallery: 'The gallery is temporarily unavailable. Please try again later.',
  experiences: 'Experience information is temporarily unavailable. Please try again later.',
  bill: 'Your booking bill is temporarily unavailable. Your booking has not been cancelled. Please try again shortly.',
  payment: 'Online payment could not be started. Your booking has not been cancelled. Please contact the property for help.',
  contact: 'Your message could not be sent. Please try again or contact the property by phone.',
  booking: 'Your booking could not be completed. Please review your details and try again.',
  multiBooking: 'Your multi-room booking could not be completed. Please review the room allocation and try again.',
}

const codeMessages = {
  ROOM_NOT_FOUND: 'This room is no longer available on our website. Please view the other rooms.',
  ROOM_UNAVAILABLE: 'This room was just booked for the selected dates. Please choose another room or change your dates.',
  INVALID_DATES: 'Please select valid dates. Check-out must be after check-in.',
  INVALID_EMAIL: 'Please enter a valid email address, for example name@example.com.',
  INVALID_PHONE: 'Please enter a valid contact number including the country code.',
  RATE_LIMITED: 'Too many requests were made from this device. Please wait a few minutes and try again.',
  INVALID_LINK: 'This booking link is invalid or has expired. Please use the latest link from your booking email or contact the property.',
}

function inferredCode(status, serverMessage = '') {
  const message = String(serverMessage).toLowerCase()
  if (status === 429) return 'RATE_LIMITED'
  if (status === 403 && (message.includes('token') || message.includes('link'))) return 'INVALID_LINK'
  if (status === 404 && message.includes('room')) return 'ROOM_NOT_FOUND'
  if (status === 409 && message.includes('available')) return 'ROOM_UNAVAILABLE'
  if (message.includes('email')) return 'INVALID_EMAIL'
  if (message.includes('phone')) return 'INVALID_PHONE'
  if (message.includes('date')) return 'INVALID_DATES'
  return ''
}

function safeServerMessage(message) {
  const value = String(message || '').trim()
  if (!value) return ''
  const technical = /(sql|pdo|exception|stack|trace|\.php|database|query|syntax|fatal|warning|undefined|json)/i
  return technical.test(value) ? '' : value
}

export function publicErrorMessage(error, context = 'rooms') {
  if (!navigator.onLine) return 'You appear to be offline. Check your internet connection and try again.'
  if (error?.name === 'AbortError' || error?.code === 'TIMEOUT') {
    return 'The request is taking longer than expected. Please check your connection and try again.'
  }
  if (codeMessages[error?.code]) return codeMessages[error.code]
  if (error?.status >= 500) return contextFallbacks[context] || 'This service is temporarily unavailable. Please try again shortly.'
  return safeServerMessage(error?.message) || contextFallbacks[context] || 'Something went wrong. Please try again.'
}

export async function requestJson(url, options = {}, context = 'rooms') {
  let response
  try {
    response = await fetch(url, options)
  } catch (error) {
    throw new PublicRequestError(publicErrorMessage(error, context), {
      code: error?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
      retryable: true,
      outcomeUnknown: ['booking', 'multiBooking', 'contact'].includes(context),
    })
  }

  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    throw new PublicRequestError(contextFallbacks[context] || 'The service returned an unexpected response. Please try again later.', {
      code: 'INVALID_RESPONSE',
      status: response.status,
      retryable: response.status >= 500,
      outcomeUnknown: ['booking', 'multiBooking', 'contact'].includes(context),
    })
  }

  if (!response.ok || payload?.success === false) {
    let code = payload?.error_code || inferredCode(response.status, payload?.message)
    if (context === 'bill' && [403, 404, 422].includes(response.status)) code = 'INVALID_LINK'
    const source = new PublicRequestError(payload?.message || '', {
      code,
      status: response.status,
      outcomeUnknown: ['BOOKING_OUTCOME_UNKNOWN', 'BOOKING_SAVED_BILL_UNAVAILABLE'].includes(code),
    })
    source.message = publicErrorMessage(source, context)
    throw source
  }

  return payload
}

export function bookingOutcomeUnknownMessage(saved = false) {
  return saved
    ? 'Your booking was saved, but we could not open the booking bill. Please do not book again. Contact the property at +31 6 28324956 or +94 77 951 8657.'
    : 'We could not confirm the final booking result. Your booking may already be saved. Please do not submit again. Contact the property at +31 6 28324956 or +94 77 951 8657 with your name and booking dates.'
}
