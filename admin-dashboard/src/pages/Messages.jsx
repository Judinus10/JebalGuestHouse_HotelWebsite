import { useEffect, useMemo, useState } from 'react'
import {
  Clipboard,
  Eye,
  Inbox,
  Mail,
  MessageSquareText,
  MoreHorizontal,
  Search,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/services/apiClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const inquiryTypes = [
  'All Types',
  'General Inquiry',
  'Room Reservation',
  'Room Availability',
  'Special Request',
]

const statuses = ['All Statuses', 'New', 'Read', 'Replied']

const statusVariant = {
  New: 'warning',
  Read: 'secondary',
  Replied: 'success',
}

const typeVariant = {
  'General Inquiry': 'outline',
  'Room Reservation': 'default',
  'Room Availability': 'success',
  'Special Request': 'secondary',
}

function formatDate(value) {
  if (!value) return '-'
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

export default function Messages() {
  const [inquiries, setInquiries] = useState([])
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [toast, setToast] = useState('')
  const [openActionId, setOpenActionId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const stats = useMemo(
    () => ({
      total: inquiries.length,
      new: inquiries.filter((item) => item.status === 'New').length,
      read: inquiries.filter((item) => item.status === 'Read').length,
      replied: inquiries.filter((item) => item.status === 'Replied').length,
    }),
    [inquiries]
  )

  const filteredInquiries = useMemo(() => {
    const query = search.trim().toLowerCase()

    return inquiries
      .filter((item) => {
        const matchesSearch =
          !query ||
          [item.inquiry_id, item.name, item.email, item.phone, item.subject, item.inquiry_type]
            .join(' ')
            .toLowerCase()
            .includes(query)
        const matchesStatus = statusFilter === 'All Statuses' || item.status === statusFilter
        const matchesType = typeFilter === 'All Types' || item.inquiry_type === typeFilter
        return matchesSearch && matchesStatus && matchesType
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [inquiries, search, statusFilter, typeFilter])

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const normalizeInquiry = (item) => ({
    id: Number(item.id),
    inquiry_id: item.inquiry_id || `INQ-${item.id}`,
    name: item.name || '-',
    email: item.email || '-',
    phone: item.phone || '-',
    inquiry_type: item.subject || 'General Inquiry',
    subject: item.subject || 'General Inquiry',
    message: item.message || '-',
    status: item.status || 'New',
    created_at: item.created_at,
    updated_at: item.updated_at,
  })

  const loadInquiries = async () => {
    setIsLoading(true)
    try {
      const response = await apiFetch(`${API_BASE_URL}/contact/list_enquiries.php`, {
        headers: { Accept: 'application/json' },
      })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Could not load enquiries.')
      }

      setInquiries((result.data || []).map(normalizeInquiry))
    } catch (error) {
      showToast(error.message || 'Could not load enquiries.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInquiries()
  }, [])

  const updateStatus = async (id, status) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/contact/update_enquiry_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id, status }),
      })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Could not update enquiry status.')
      }

      setInquiries((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))
      setSelectedInquiry((current) => (current?.id === id ? { ...current, status } : current))
      showToast(`Inquiry marked as ${status.toLowerCase()}.`)
    } catch (error) {
      showToast(error.message || 'Could not update enquiry status.')
    }
  }

  const deleteInquiry = async (id) => {
    if (!window.confirm('Delete this enquiry? This action cannot be undone.')) return

    try {
      const response = await apiFetch(`${API_BASE_URL}/contact/delete_enquiry.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id }),
      })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Could not delete enquiry.')
      }

      setInquiries((current) => current.filter((item) => item.id !== id))
      setSelectedInquiry(null)
      showToast('Inquiry deleted.')
    } catch (error) {
      showToast(error.message || 'Could not delete enquiry.')
    }
  }

  const copyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email)
      showToast('Email copied to clipboard.')
    } catch {
      showToast('Could not copy email.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inquiry Management"
        description="Manage room, booking, and general website enquiries from guests."
      />

      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Inquiries" value={stats.total} icon={Inbox} />
        <StatCard title="New" value={stats.new} icon={Mail} />
        <StatCard title="Read" value={stats.read} icon={Eye} />
        <StatCard title="Replied" value={stats.replied} icon={MessageSquareText} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Website Inquiry Inbox</CardTitle>
              <p className="mt-1 text-sm text-text-secondary">Track guest questions and follow-up status.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[680px]">
              <div className="relative sm:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search inquiries..."
                  className="pl-9"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                {inquiryTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-text-secondary">
              Loading enquiries...
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-text-secondary">
              No enquiries found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Inquiry ID', 'Guest Details', 'Inquiry Type', 'Subject', 'Received Date', 'Status', 'Actions'].map((header) => (
                      <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {filteredInquiries.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-primary-700">{item.inquiry_id}</td>
                      <td className="px-4 py-3">
                        <div className="min-w-[180px]">
                          <p className="font-semibold text-text-primary">{item.name}</p>
                          <p className="mt-0.5 text-xs text-text-secondary">{item.email}</p>
                          <p className="mt-0.5 text-xs text-text-secondary">{item.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={typeVariant[item.inquiry_type] || 'outline'}>{item.inquiry_type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        <div className="max-w-[260px]">
                          <p className="line-clamp-1 font-medium">{item.subject}</p>
                          <p className="mt-1 line-clamp-1 text-xs text-text-secondary">{item.message}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDate(item.created_at)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative inline-block text-left">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setOpenActionId((current) => (current === item.id ? null : item.id))}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            Actions
                          </Button>

                          {openActionId === item.id && (
                            <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedInquiry(item)
                                  setOpenActionId(null)
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4 text-primary-600" />
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateStatus(item.id, 'Read')
                                  setOpenActionId(null)
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-blue-50"
                              >
                                <Mail className="h-4 w-4 text-primary-600" />
                                Mark Read
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateStatus(item.id, 'Replied')
                                  setOpenActionId(null)
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-blue-50"
                              >
                                <MessageSquareText className="h-4 w-4 text-primary-600" />
                                Mark Replied
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionId(null)
                                  deleteInquiry(item.id)
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-border p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-700">{selectedInquiry.inquiry_id}</p>
                  <h2 className="mt-1 text-xl font-bold text-text-primary">{selectedInquiry.subject}</h2>
                  <p className="mt-1 text-sm text-text-secondary">Received {formatDate(selectedInquiry.created_at)}</p>
                </div>
                <Badge variant={statusVariant[selectedInquiry.status]}>{selectedInquiry.status}</Badge>
              </div>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-text-primary">Guest Information</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p><span className="text-text-secondary">Name:</span> {selectedInquiry.name}</p>
                  <p><span className="text-text-secondary">Email:</span> {selectedInquiry.email}</p>
                  <p><span className="text-text-secondary">Phone:</span> {selectedInquiry.phone}</p>
                </div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-text-primary">Inquiry Information</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p><span className="text-text-secondary">Type:</span> {selectedInquiry.inquiry_type}</p>
                  <p><span className="text-text-secondary">Status:</span> {selectedInquiry.status}</p>
                  <p><span className="text-text-secondary">Updated:</span> {formatDate(selectedInquiry.updated_at)}</p>
                </div>
              </div>
              <div className="rounded-xl border border-border p-4 md:col-span-2">
                <h3 className="text-sm font-semibold text-text-primary">Message</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text-secondary">{selectedInquiry.message}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-border p-6 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => updateStatus(selectedInquiry.id, 'Read')}>Mark Read</Button>
              <Button variant="outline" onClick={() => updateStatus(selectedInquiry.id, 'Replied')}>Mark Replied</Button>
              <Button variant="outline" onClick={() => copyEmail(selectedInquiry.email)}><Clipboard className="h-4 w-4" />Copy Email</Button>
              <Button variant="outline" onClick={() => deleteInquiry(selectedInquiry.id)}>Delete</Button>
              <Button onClick={() => setSelectedInquiry(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
