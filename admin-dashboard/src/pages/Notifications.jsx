import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  MoreHorizontal,
  LogIn,
  LogOut,
  Search,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'

const initialActivities = [
  {
    id: 1,
    type: 'Booking',
    title: 'New Booking Received',
    reference_id: 'BK-2026-1048',
    description: 'New booking received for Ground Floor Room 1.',
    related_room: 'Ground Floor Room 1',
    related_booking: 'BK-2026-1048',
    status: 'New',
    created_at: '2026-06-15T09:40:00Z',
    details: 'Guest requested attached bathroom and parking access. Confirmation is pending.',
  },
  {
    id: 2,
    type: 'Payment',
    title: 'Payment Received',
    reference_id: 'PAY-9042',
    description: 'Payment received: $180 for Booking BK-2026-1048.',
    related_room: 'Ground Floor Room 1',
    related_booking: 'BK-2026-1048',
    status: 'Viewed',
    created_at: '2026-06-15T09:12:00Z',
    details: 'Advance payment has been recorded in the local payment tracker.',
  },
  {
    id: 3,
    type: 'Cancellation',
    title: 'Booking Cancelled',
    reference_id: 'BK-2026-1039',
    description: 'Booking cancelled. Refund review required.',
    related_room: 'First Floor Room 2',
    related_booking: 'BK-2026-1039',
    status: 'New',
    created_at: '2026-06-15T08:20:00Z',
    details: 'Cancellation was requested after 48 hours. Refund should follow the 80% refund rule.',
  },
  {
    id: 4,
    type: 'Check-in',
    title: 'Guest Checked In',
    reference_id: 'BK-2026-1038',
    description: 'Guest checked in to Room G01.',
    related_room: 'Room G01',
    related_booking: 'BK-2026-1038',
    status: 'Resolved',
    created_at: '2026-06-15T07:50:00Z',
    details: 'Guest arrived and room key was handed over by reception.',
  },
  {
    id: 5,
    type: 'Check-out',
    title: 'Guest Checked Out',
    reference_id: 'BK-2026-1035',
    description: 'Guest checked out from Room F02.',
    related_room: 'Room F02',
    related_booking: 'BK-2026-1035',
    status: 'Viewed',
    created_at: '2026-06-15T06:30:00Z',
    details: 'Room should be cleaned and prepared for the next reservation.',
  },
  {
    id: 6,
    type: 'Offer',
    title: 'Offer Expiring Soon',
    reference_id: 'OFF-004',
    description: 'Honeymoon Package expires in 3 days.',
    related_room: 'All rooms',
    related_booking: 'Not linked',
    status: 'New',
    created_at: '2026-06-14T16:10:00Z',
    details: 'Review package status if the offer should be extended.',
  },
  {
    id: 7,
    type: 'System',
    title: 'Pending Confirmation Reminder',
    reference_id: 'SYS-221',
    description: 'Two bookings are still waiting for confirmation.',
    related_room: 'Multiple rooms',
    related_booking: 'Multiple',
    status: 'New',
    created_at: '2026-06-14T11:05:00Z',
    details: 'Check pending reservations and confirm availability with the guest.',
  },
]

const typeVariants = {
  Booking: 'default',
  Payment: 'success',
  'Check-in': 'info',
  'Check-out': 'secondary',
  Cancellation: 'destructive',
  Offer: 'warning',
  System: 'outline',
}

const statusVariants = {
  New: 'warning',
  Viewed: 'secondary',
  Resolved: 'success',
}

const types = ['All Types', 'Booking', 'Payment', 'Check-in', 'Check-out', 'Cancellation', 'Offer', 'System']
const statuses = ['All Statuses', 'New', 'Viewed', 'Resolved']

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary-600">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Notifications() {
  const [activities, setActivities] = useState(initialActivities)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [toast, setToast] = useState('')

  const stats = useMemo(
    () => ({
      newBookings: activities.filter((item) => item.type === 'Booking').length,
      pendingConfirmations: activities.filter((item) => item.type === 'System' && item.status === 'New').length,
      checkIns: activities.filter((item) => item.type === 'Check-in').length,
      checkOuts: activities.filter((item) => item.type === 'Check-out').length,
      cancellations: activities.filter((item) => item.type === 'Cancellation').length,
      unread: activities.filter((item) => item.status === 'New').length,
    }),
    [activities]
  )

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase()
    return activities
      .filter((item) => {
        const matchesSearch = !query || [item.title, item.reference_id, item.description, item.related_room, item.related_booking]
          .join(' ')
          .toLowerCase()
          .includes(query)
        const matchesType = typeFilter === 'All Types' || item.type === typeFilter
        const matchesStatus = statusFilter === 'All Statuses' || item.status === statusFilter
        return matchesSearch && matchesType && matchesStatus
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [activities, search, typeFilter, statusFilter])

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const markViewed = (id) => {
    setActivities((current) => current.map((item) => (item.id === id ? { ...item, status: 'Viewed' } : item)))
    setSelectedActivity((current) => (current?.id === id ? { ...current, status: 'Viewed' } : current))
    showToast('Notification marked as viewed.')
  }

  const deleteActivity = (id) => {
    if (!window.confirm('Delete this activity notification?')) return
    setActivities((current) => current.filter((item) => item.id !== id))
    setSelectedActivity(null)
    showToast('Notification deleted.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hotel Activity Center"
        description="Monitor booking, payment, check-in, cancellation, offer, and system activity."
      />

      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard title="New Bookings" value={stats.newBookings} icon={CalendarCheck} />
        <StatCard title="Pending Confirmations" value={stats.pendingConfirmations} icon={Clock} />
        <StatCard title="Check-ins Today" value={stats.checkIns} icon={LogIn} />
        <StatCard title="Check-outs Today" value={stats.checkOuts} icon={LogOut} />
        <StatCard title="Cancellation Requests" value={stats.cancellations} icon={AlertTriangle} />
        <StatCard title="Unread Notifications" value={stats.unread} icon={Bell} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Notification Log</CardTitle>
              <p className="mt-1 text-sm text-text-secondary">Search and review operational notifications.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[720px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity..." className="pl-9" />
              </div>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                {types.map((type) => <option key={type}>{type}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-slate-50 p-8 text-center text-sm text-text-secondary">
              No notifications match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Type', 'Reference ID', 'Description', 'Related Room', 'Related Booking', 'Date & Time', 'Status', 'Actions'].map((header) => (
                      <th key={header} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {filteredActivities.map((item) => (
                    <tr key={item.id} className="align-middle hover:bg-blue-50/40">
                      <td className="whitespace-nowrap px-4 py-3"><Badge variant={typeVariants[item.type] || 'outline'}>{item.type}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-primary-700">{item.reference_id}</td>
                      <td className="px-4 py-3 text-text-primary">
                        <div className="max-w-[320px]">
                          <p className="line-clamp-1 font-medium text-text-primary">{item.title}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-text-secondary">{item.description}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{item.related_room}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{item.related_booking}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDate(item.created_at)}</td>
                      <td className="whitespace-nowrap px-4 py-3"><Badge variant={statusVariants[item.status]}>{item.status}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Dropdown
                          align="right"
                          trigger={
                            <Button size="sm" variant="outline" className="h-9 gap-2">
                              Actions
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        >
                          {(close) => (
                            <>
                              <DropdownItem onClick={() => { setSelectedActivity(item); close() }}>
                                <Eye className="h-4 w-4" />
                                View
                              </DropdownItem>
                              <DropdownItem onClick={() => { markViewed(item.id); close() }}>
                                <CheckCircle2 className="h-4 w-4" />
                                Mark Read
                              </DropdownItem>
                              <DropdownItem destructive onClick={() => { close(); deleteActivity(item.id) }}>
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownItem>
                            </>
                          )}
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-border p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-700">{selectedActivity.reference_id}</p>
                  <h2 className="mt-1 text-xl font-bold text-text-primary">{selectedActivity.title}</h2>
                  <p className="mt-1 text-sm text-text-secondary">{formatDate(selectedActivity.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={typeVariants[selectedActivity.type] || 'outline'}>{selectedActivity.type}</Badge>
                  <Badge variant={statusVariants[selectedActivity.status]}>{selectedActivity.status}</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-text-primary">Activity Details</h3>
                <p className="mt-3 text-sm leading-6 text-text-secondary">{selectedActivity.details}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4 text-sm">
                  <p><span className="text-text-secondary">Related Room:</span> {selectedActivity.related_room}</p>
                  <p className="mt-2"><span className="text-text-secondary">Related Booking:</span> {selectedActivity.related_booking}</p>
                </div>
                <div className="rounded-xl border border-border p-4 text-sm">
                  <p><span className="text-text-secondary">Type:</span> {selectedActivity.type}</p>
                  <p className="mt-2"><span className="text-text-secondary">Status:</span> {selectedActivity.status}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-border p-6 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => markViewed(selectedActivity.id)}>Mark Read</Button>
              <Button variant="outline" onClick={() => deleteActivity(selectedActivity.id)}>Delete</Button>
              <Button onClick={() => setSelectedActivity(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
