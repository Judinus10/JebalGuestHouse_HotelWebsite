import { useMemo, useState } from 'react'
import {
  Bath,
  BedDouble,
  BriefcaseBusiness,
  Building2,
  Check,
  Coffee,
  Eye,
  GlassWater,
  ImagePlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Waves,
  Wifi,
  Wind,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Label, Textarea } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  initialAmenities,
  initialRoomAmenities,
  initialRoomImages,
  initialRooms,
} from '@/data/roomData'

const emptyForm = {
  room_name: '',
  room_type: 'Standard',
  price_per_night: '',
  capacity: '',
  description: '',
  status: 'Available',
  image_path: '',
  amenity_ids: [],
}

const roomTypes = ['Ground Floor', 'First Floor', 'Family Room', 'Private Cottage']
const roomStatuses = ['Available', 'Occupied', 'Maintenance', 'Inactive']

const statusVariant = {
  Available: 'success',
  Occupied: 'info',
  Maintenance: 'warning',
  Inactive: 'secondary',
}

const amenityIcons = {
  Wifi,
  Wind,
  Coffee,
  Waves,
  Building2,
  GlassWater,
  BriefcaseBusiness,
  Bath,
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function RoomImage({ src, name }) {
  return (
    <div className="h-14 w-20 overflow-hidden rounded-xl border border-border bg-slate-100">
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-400">
          <BedDouble className="h-5 w-5" />
        </div>
      )}
    </div>
  )
}

function AmenitiesPreview({ amenities }) {
  const visibleAmenities = amenities.slice(0, 2)
  const hiddenAmenities = amenities.slice(2)

  return (
    <div className="flex max-w-[260px] flex-wrap items-center gap-1.5">
      {visibleAmenities.map((amenity) => (
        <Badge key={amenity.id} variant="secondary" className="whitespace-nowrap text-xs font-medium">
          {amenity.amenity_name}
        </Badge>
      ))}

      {hiddenAmenities.length > 0 && (
        <div className="group relative inline-flex">
          <Badge variant="outline" className="cursor-default whitespace-nowrap text-xs font-semibold">
            +{hiddenAmenities.length}
          </Badge>
          <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-56 -translate-x-1/2 rounded-xl border border-border bg-white p-3 text-left shadow-xl shadow-slate-900/10 group-hover:block">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">More amenities</p>
            <div className="space-y-1.5">
              {hiddenAmenities.map((amenity) => (
                <div key={amenity.id} className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                  {amenity.amenity_name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {amenities.length === 0 && <span className="text-xs font-medium text-text-secondary">No amenities</span>}
    </div>
  )
}

function RoomActionsDropdown({ room, isOpen, onToggle, onView, onEdit, onDelete }) {
  return (
    <div className="relative inline-flex justify-end">
      <Button type="button" variant="outline" size="sm" onClick={onToggle} className="gap-2">
        Actions
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-xl shadow-slate-900/10">
          <button
            type="button"
            onClick={() => onView(room)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-text-primary transition hover:bg-slate-50"
          >
            <Eye className="h-4 w-4 text-primary-600" />
            View Details
          </button>
          <button
            type="button"
            onClick={() => onEdit(room)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-text-primary transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4 text-primary-600" />
            Edit Room
          </button>
          <button
            type="button"
            onClick={() => onDelete(room)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Room
          </button>
        </div>
      )}
    </div>
  )
}

function Toast({ toast, onClose }) {
  if (!toast) return null

  return (
    <div className="fixed right-6 top-6 z-50 flex w-[calc(100%-3rem)] max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 text-sm shadow-xl shadow-slate-900/10 sm:w-full">
      <div className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-700">
        <Check className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-text-primary">{toast.title}</p>
        <p className="mt-0.5 text-text-secondary">{toast.message}</p>
      </div>
      <button onClick={onClose} className="text-slate-400 transition hover:text-slate-700">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function RoomFormModal({ mode, room, amenities, onClose, onSubmit }) {
  const [form, setForm] = useState(() => room || emptyForm)
  const [errors, setErrors] = useState({})

  const isEdit = mode === 'edit'

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function toggleAmenity(amenityId) {
    setForm((current) => {
      const exists = current.amenity_ids.includes(amenityId)
      return {
        ...current,
        amenity_ids: exists
          ? current.amenity_ids.filter((id) => id !== amenityId)
          : [...current.amenity_ids, amenityId],
      }
    })
  }

  function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (!form.room_name.trim()) nextErrors.room_name = 'Room name is required.'
    if (!form.room_type.trim()) nextErrors.room_type = 'Room type is required.'
    if (!String(form.price_per_night).trim()) nextErrors.price_per_night = 'Price is required.'
    if (Number(form.price_per_night) <= 0) nextErrors.price_per_night = 'Price must be greater than 0.'
    if (!String(form.capacity).trim()) nextErrors.capacity = 'Capacity is required.'
    if (Number(form.capacity) <= 0) nextErrors.capacity = 'Capacity must be greater than 0.'
    if (!form.description.trim()) nextErrors.description = 'Description is required.'
    if (!form.status.trim()) nextErrors.status = 'Status is required.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      ...form,
      price_per_night: Number(form.price_per_night),
      capacity: Number(form.capacity),
    })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{isEdit ? 'Edit Room' : 'Add Room'}</h2>
            <p className="text-sm text-text-secondary">
              {isEdit ? 'Update room details and amenities.' : 'Create a new room in the inventory.'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-81px)] overflow-y-auto p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="room_name">Room name</Label>
              <Input id="room_name" value={form.room_name} onChange={(e) => updateField('room_name', e.target.value)} placeholder="Ex: Ground Floor Room 1" />
              {errors.room_name && <p className="text-xs font-medium text-red-600">{errors.room_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="room_type">Room type</Label>
              <select
                id="room_type"
                value={form.room_type}
                onChange={(e) => updateField('room_type', e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {roomTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
              {errors.room_type && <p className="text-xs font-medium text-red-600">{errors.room_type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_per_night">Price per night</Label>
              <Input id="price_per_night" type="number" min="1" value={form.price_per_night} onChange={(e) => updateField('price_per_night', e.target.value)} placeholder="Ex: 380" />
              {errors.price_per_night && <p className="text-xs font-medium text-red-600">{errors.price_per_night}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" type="number" min="1" value={form.capacity} onChange={(e) => updateField('capacity', e.target.value)} placeholder="Ex: 2" />
              {errors.capacity && <p className="text-xs font-medium text-red-600">{errors.capacity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {roomStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
              {errors.status && <p className="text-xs font-medium text-red-600">{errors.status}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_path">Image upload mock</Label>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-slate-50 px-3 py-2">
                <ImagePlus className="h-5 w-5 text-primary-600" />
                <Input
                  id="image_path"
                  value={form.image_path}
                  onChange={(e) => updateField('image_path', e.target.value)}
                  placeholder="Paste image URL"
                  className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Short room description" />
              {errors.description && <p className="text-xs font-medium text-red-600">{errors.description}</p>}
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label>Amenities</Label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {amenities.map((amenity) => {
                  const Icon = amenityIcons[amenity.icon] || Check
                  const selected = form.amenity_ids.includes(amenity.id)

                  return (
                    <button
                      type="button"
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition',
                        selected
                          ? 'border-primary-600 bg-blue-50 text-primary-700 shadow-sm'
                          : 'border-border bg-white text-text-secondary hover:border-blue-200 hover:bg-slate-50'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate font-medium">{amenity.amenity_name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Add Room'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RoomDetailsModal({ room, amenities, image, onClose }) {
  if (!room) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Room Details</h2>
            <p className="text-sm text-text-secondary">Full room information, pricing, images, and amenities.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-81px)] overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="overflow-hidden rounded-2xl border border-border bg-slate-100">
              {image ? (
                <img src={image.image_path} alt={room.room_name} className="h-72 w-full object-cover" />
              ) : (
                <div className="flex h-72 items-center justify-center text-slate-400">
                  <BedDouble className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-bold text-text-primary">{room.room_name}</h3>
                  <p className="mt-1 text-sm font-medium text-text-secondary">{room.room_type} room · {room.capacity} guests</p>
                </div>
                <Badge variant={statusVariant[room.status] || 'secondary'}>{room.status}</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Price per night</p>
                  <p className="mt-1 text-xl font-bold text-text-primary">{formatCurrency(room.price_per_night)}</p>
                </div>
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Capacity</p>
                  <p className="mt-1 text-xl font-bold text-text-primary">{room.capacity} guests</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-text-primary">Description</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{room.description}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-text-primary">Amenities</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <Badge key={amenity.id} variant="secondary">{amenity.amenity_name}</Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-medium text-text-secondary">Created</p>
                  <p className="font-semibold text-text-primary">{formatDate(room.created_at)}</p>
                </div>
                <div>
                  <p className="font-medium text-text-secondary">Updated</p>
                  <p className="font-semibold text-text-primary">{formatDate(room.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeleteDialog({ room, onCancel, onConfirm }) {
  if (!room) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
          <Trash2 className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-text-primary">Delete room?</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          This will remove <span className="font-semibold text-text-primary">{room.room_name}</span> from the mock room list. This action only affects frontend state.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete Room</Button>
        </div>
      </div>
    </div>
  )
}

export default function Rooms() {
  const [rooms, setRooms] = useState(initialRooms)
  const [roomImages, setRoomImages] = useState(initialRoomImages)
  const [roomAmenities, setRoomAmenities] = useState(initialRoomAmenities)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [formMode, setFormMode] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [viewRoom, setViewRoom] = useState(null)
  const [deleteRoom, setDeleteRoom] = useState(null)
  const [toast, setToast] = useState(null)
  const [openActionsId, setOpenActionsId] = useState(null)

  function showToast(title, message) {
    setToast({ title, message })
    window.setTimeout(() => setToast(null), 2800)
  }

  const roomTypeOptions = useMemo(() => ['All', ...new Set(rooms.map((room) => room.room_type))], [rooms])
  const roomStatusOptions = ['All', ...roomStatuses]

  const enrichedRooms = useMemo(() => {
    return rooms.map((room) => {
      const image = roomImages.find((item) => item.room_id === room.id && item.is_main)
      const amenityIds = roomAmenities.filter((item) => item.room_id === room.id).map((item) => item.amenity_id)
      const amenities = initialAmenities.filter((amenity) => amenityIds.includes(amenity.id))

      return { ...room, image, amenities, amenity_ids: amenityIds }
    })
  }, [rooms, roomImages, roomAmenities])

  const filteredRooms = useMemo(() => {
    const term = search.trim().toLowerCase()

    return enrichedRooms.filter((room) => {
      const matchesSearch = !term || room.room_name.toLowerCase().includes(term) || room.room_type.toLowerCase().includes(term)
      const matchesStatus = statusFilter === 'All' || room.status === statusFilter
      const matchesType = typeFilter === 'All' || room.room_type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [enrichedRooms, search, statusFilter, typeFilter])

  function openAddModal() {
    setOpenActionsId(null)
    setSelectedRoom(null)
    setFormMode('add')
  }

  function openEditModal(room) {
    setOpenActionsId(null)
    setSelectedRoom({
      ...room,
      image_path: room.image?.image_path || '',
      amenity_ids: room.amenity_ids || [],
    })
    setFormMode('edit')
  }

  function closeFormModal() {
    setFormMode(null)
    setSelectedRoom(null)
  }

  function handleSubmitRoom(form) {
    const now = new Date().toISOString()
    const amenitySummary = initialAmenities
      .filter((amenity) => form.amenity_ids.includes(amenity.id))
      .map((amenity) => amenity.amenity_name)
      .join(', ')

    if (formMode === 'edit') {
      setRooms((current) => current.map((room) => (
        room.id === selectedRoom.id
          ? {
              ...room,
              room_name: form.room_name,
              room_type: form.room_type,
              price_per_night: form.price_per_night,
              capacity: form.capacity,
              description: form.description,
              amenities_summary: amenitySummary,
              status: form.status,
              updated_at: now,
            }
          : room
      )))

      setRoomImages((current) => {
        const exists = current.some((image) => image.room_id === selectedRoom.id && image.is_main)
        if (!form.image_path) return current.filter((image) => !(image.room_id === selectedRoom.id && image.is_main))
        if (exists) {
          return current.map((image) => image.room_id === selectedRoom.id && image.is_main ? { ...image, image_path: form.image_path } : image)
        }
        return [...current, { id: Date.now(), room_id: selectedRoom.id, image_path: form.image_path, is_main: true, sort_order: 1, created_at: now }]
      })

      setRoomAmenities((current) => {
        const withoutRoom = current.filter((item) => item.room_id !== selectedRoom.id)
        const nextLinks = form.amenity_ids.map((amenityId, index) => ({
          id: Date.now() + index,
          room_id: selectedRoom.id,
          amenity_id: amenityId,
        }))
        return [...withoutRoom, ...nextLinks]
      })

      showToast('Room updated', `${form.room_name} was updated successfully.`)
    } else {
      const nextRoomId = Math.max(0, ...rooms.map((room) => room.id)) + 1
      const nextRoom = {
        id: nextRoomId,
        room_name: form.room_name,
        room_type: form.room_type,
        price_per_night: form.price_per_night,
        capacity: form.capacity,
        description: form.description,
        amenities_summary: amenitySummary,
        status: form.status,
        created_at: now,
        updated_at: now,
      }

      setRooms((current) => [nextRoom, ...current])

      if (form.image_path) {
        setRoomImages((current) => [
          { id: Date.now(), room_id: nextRoomId, image_path: form.image_path, is_main: true, sort_order: 1, created_at: now },
          ...current,
        ])
      }

      setRoomAmenities((current) => [
        ...form.amenity_ids.map((amenityId, index) => ({ id: Date.now() + index, room_id: nextRoomId, amenity_id: amenityId })),
        ...current,
      ])

      showToast('Room added', `${form.room_name} was added successfully.`)
    }

    closeFormModal()
  }

  function confirmDeleteRoom() {
    setRooms((current) => current.filter((room) => room.id !== deleteRoom.id))
    setRoomImages((current) => current.filter((image) => image.room_id !== deleteRoom.id))
    setRoomAmenities((current) => current.filter((item) => item.room_id !== deleteRoom.id))
    showToast('Room deleted', `${deleteRoom.room_name} was removed from the mock list.`)
    setDeleteRoom(null)
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Rooms"
        description="Manage room inventory, pricing, amenities, images, and availability."
      >
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </PageHeader>

      <div className="grid gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm shadow-slate-200/60 lg:grid-cols-[1fr_220px_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by room name or type..." className="pl-9" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {roomStatusOptions.map((status) => <option key={status}>{status}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {roomTypeOptions.map((type) => <option key={type}>{type}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm shadow-slate-200/60">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-5 py-4">Room</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Price / Night</th>
                <th className="px-5 py-4">Capacity</th>
                <th className="px-5 py-4">Amenities</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRooms.map((room) => (
                <tr key={room.id} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <RoomImage src={room.image?.image_path} name={room.room_name} />
                      <div>
                        <p className="font-semibold text-text-primary">{room.room_name}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">Updated {formatDate(room.updated_at)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-text-primary">{room.room_type}</td>
                  <td className="px-5 py-4 font-semibold text-text-primary">{formatCurrency(room.price_per_night)}</td>
                  <td className="px-5 py-4 text-text-secondary">{room.capacity} guests</td>
                  <td className="px-5 py-4">
                    <AmenitiesPreview amenities={room.amenities} />
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={statusVariant[room.status] || 'secondary'}>{room.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <RoomActionsDropdown
                      room={room}
                      isOpen={openActionsId === room.id}
                      onToggle={() => setOpenActionsId((current) => (current === room.id ? null : room.id))}
                      onView={(selected) => {
                        setOpenActionsId(null)
                        setViewRoom(selected)
                      }}
                      onEdit={openEditModal}
                      onDelete={(selected) => {
                        setOpenActionsId(null)
                        setDeleteRoom(selected)
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRooms.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary-600">
              <BedDouble className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-text-primary">No rooms found</h3>
            <p className="mt-1 max-w-md text-sm text-text-secondary">
              Your filters did not match any rooms. Clear the filters or add a new room.
            </p>
            <Button className="mt-5" onClick={openAddModal}>
              <Plus className="h-4 w-4" />
              Add Room
            </Button>
          </div>
        )}
      </div>

      {formMode && (
        <RoomFormModal
          mode={formMode}
          room={selectedRoom}
          amenities={initialAmenities}
          onClose={closeFormModal}
          onSubmit={handleSubmitRoom}
        />
      )}

      {viewRoom && (
        <RoomDetailsModal
          room={viewRoom}
          amenities={viewRoom.amenities}
          image={viewRoom.image}
          onClose={() => setViewRoom(null)}
        />
      )}

      <DeleteDialog
        room={deleteRoom}
        onCancel={() => setDeleteRoom(null)}
        onConfirm={confirmDeleteRoom}
      />
    </div>
  )
}
