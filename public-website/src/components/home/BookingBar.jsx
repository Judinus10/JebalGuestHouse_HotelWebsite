import { useRef, useState } from 'react'
import { Calendar, Users, BedDouble, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FadeUp from '../ui/FadeUp'

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(dateString, days = 1) {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-').map(Number)
  return formatLocalDate(new Date(year, month - 1, day + days))
}

const roomTypes = [
  'All Rooms',
  'Ground Floor',
  'First Floor',
  'Family Room',
  'Private Cottage',
]

export default function BookingBar() {
  const navigate = useNavigate()
  const checkInRef = useRef(null)
  const checkOutRef = useRef(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('2')
  const [roomType, setRoomType] = useState('All Rooms')
  const [error, setError] = useState('')
  const today = formatLocalDate(new Date())

  const openDatePicker = (inputRef) => {
    const input = inputRef.current
    if (!input || input.disabled) return

    input.focus()
    if (typeof input.showPicker === 'function') input.showPicker()
  }

  const handleCheckInChange = (e) => {
    const nextCheckIn = e.target.value
    setCheckIn(nextCheckIn)
    setError('')

    if (checkOut && nextCheckIn && checkOut <= nextCheckIn) setCheckOut('')
  }

  const changeGuests = (amount) => {
    setGuests((current) => String(Math.min(6, Math.max(1, Number(current) + amount))))
    setError('')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setError('')

    if (!checkIn || !checkOut) {
      setError('Please select both check-in and check-out dates.')
      return
    }

    if (checkOut <= checkIn) {
      setError('Check-out date must be after check-in date.')
      return
    }

    const params = new URLSearchParams()
    params.set('check_in_date', checkIn)
    params.set('check_out_date', checkOut)
    params.set('guests', guests)
    if (roomType !== 'All Rooms') params.set('room_type', roomType)
    navigate(`/rooms?${params.toString()}`)
  }

  return (
    <div className="relative z-10 -mt-16 px-4 pb-2 md:-mt-20 md:px-6 md:pb-4">
      <FadeUp>
        <form
          onSubmit={handleSearch}
          className="relative mx-auto max-w-6xl border border-black/5 bg-white p-6 shadow-xl md:p-8"
          noValidate
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            <div
              role="button"
              tabIndex={0}
              aria-label="Select check-in date"
              onClick={() => openDatePicker(checkInRef)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openDatePicker(checkInRef)
                }
              }}
              className="group w-full cursor-pointer space-y-2 outline-none"
            >
              <span className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted">
                <Calendar size={14} /> Check In
              </span>
              <div
                role="presentation"
                className={`w-full border-b bg-transparent transition-colors group-hover:border-gold group-focus:border-gold ${error && !checkIn ? 'border-red-500' : 'border-ice-dark'}`}
              >
                <input
                  ref={checkInRef}
                  id="booking-check-in"
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={handleCheckInChange}
                  aria-invalid={Boolean(error && !checkIn)}
                  className="pointer-events-none block h-10 w-full cursor-pointer bg-transparent px-1 text-sm text-charcoal outline-none"
                />
              </div>
            </div>

            <div
              role="button"
              tabIndex={checkIn ? 0 : -1}
              aria-label="Select check-out date"
              aria-disabled={!checkIn}
              onClick={() => openDatePicker(checkOutRef)}
              onKeyDown={(event) => {
                if ((event.key === 'Enter' || event.key === ' ') && checkIn) {
                  event.preventDefault()
                  openDatePicker(checkOutRef)
                }
              }}
              className={`group w-full space-y-2 outline-none ${checkIn ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              <span className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted">
                <Calendar size={14} /> Check Out
              </span>
              <div
                role="presentation"
                className={`w-full border-b bg-transparent transition-colors ${checkIn ? 'group-hover:border-gold group-focus:border-gold' : ''} ${error && !checkOut ? 'border-red-500' : 'border-ice-dark'}`}
              >
                <input
                  ref={checkOutRef}
                  id="booking-check-out"
                  type="date"
                  value={checkOut}
                  min={checkIn ? addDays(checkIn) : today}
                  disabled={!checkIn}
                  onChange={(e) => {
                    setCheckOut(e.target.value)
                    setError('')
                  }}
                  aria-invalid={Boolean(error && !checkOut)}
                  className="pointer-events-none block h-10 w-full cursor-pointer bg-transparent px-1 text-sm text-charcoal outline-none disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted">
                <Users size={14} /> Guests
              </span>
              <div className="grid h-10 w-full grid-cols-[1fr_auto_1fr] items-stretch border-b border-ice-dark text-sm text-charcoal focus-within:border-gold">
                <button
                  type="button"
                  aria-label="Remove one guest"
                  disabled={Number(guests) <= 1}
                  onClick={() => changeGuests(-1)}
                  className="flex h-full min-w-12 cursor-pointer items-center justify-start px-3 text-lg transition-colors hover:bg-black/[0.03] hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
                >
                  &minus;
                </button>
                <output aria-live="polite" className="pointer-events-none flex min-w-20 items-center justify-center px-2 text-center">
                  {guests} Guest{Number(guests) !== 1 ? 's' : ''}
                </output>
                <button
                  type="button"
                  aria-label="Add one guest"
                  disabled={Number(guests) >= 6}
                  onClick={() => changeGuests(1)}
                  className="flex h-full min-w-12 cursor-pointer items-center justify-end px-3 text-lg transition-colors hover:bg-black/[0.03] hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="booking-room-type" className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted">
                <BedDouble size={14} /> Room Type
              </label>
              <select
                id="booking-room-type"
                value={roomType}
                onChange={(e) => {
                  setRoomType(e.target.value)
                  setError('')
                }}
                className="h-10 w-full cursor-pointer border-b border-ice-dark bg-transparent px-1 text-sm text-charcoal outline-none focus:border-gold"
              >
                {roomTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button type="submit" className="flex w-full items-center justify-center gap-2 bg-charcoal px-6 py-3.5 text-xs font-medium tracking-[0.2em] uppercase text-white transition-colors hover:bg-charcoal-light">
                <Search size={16} /> Search
              </button>
            </div>
          </div>

          {error && <p role="alert" className="mt-4 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        </form>
      </FadeUp>
    </div>
  )
}
