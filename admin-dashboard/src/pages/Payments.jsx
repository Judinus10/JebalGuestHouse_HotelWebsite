import { useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  CreditCard,
  Download,
  Eye,
  Search,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { fetchPayments } from '@/services/paymentsApi'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
})

const paymentStatuses = ['pending', 'paid', 'failed', 'cancelled', 'refunded']
const paymentMethods = ['PayHere']

const statusVariant = {
  pending: 'warning',
  paid: 'success',
  failed: 'destructive',
  cancelled: 'secondary',
  refunded: 'purple',
}

const statusLabel = {
  pending: 'Payment Pending',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return 'Not paid yet'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function isInDateRange(value, from, to) {
  if (!from && !to) return true
  if (!value) return false

  const date = new Date(value)
  date.setHours(0, 0, 0, 0)

  if (from) {
    const start = new Date(from)
    start.setHours(0, 0, 0, 0)
    if (date < start) return false
  }

  if (to) {
    const end = new Date(to)
    end.setHours(23, 59, 59, 999)
    if (date > end) return false
  }

  return true
}

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{value}</p>
            {description ? <p className="mt-1 text-xs text-text-secondary">{description}</p> : null}
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentStatusBadge({ status }) {
  return <Badge variant={statusVariant[status] || 'secondary'}>{statusLabel[status] || status}</Badge>
}

function PaymentDetailsModal({ payment, onClose }) {
  if (!payment) return null

  const invoiceDownloadUrl = payment.invoice_number ? `/api/invoices/download.php?id=${payment.booking_id}` : ''

  const details = [
    ['Payment ID', payment.payment_id || `PAY-${String(payment.id).padStart(4, '0')}`],
    ['Booking ID', payment.booking_id],
    ['Booking Number', payment.booking_no],
    ['Guest Name', payment.guest_name],
    ['Room Name', payment.room_name || '-'],
    ['Amount', formatCurrency(payment.amount)],
    ['Payment Method', payment.payment_method],
    ['Payment Gateway', payment.payment_gateway],
    ['Transaction ID', payment.transaction_id],
    ['Invoice Number', payment.invoice_number || 'Not generated yet'],
    ['Email Status', payment.email_status || 'Not Sent'],
    ['Paid Date', formatDate(payment.paid_at)],
    ['Created Date', formatDate(payment.created_at)],
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Payment Details</h2>
            <p className="text-sm text-text-secondary">{payment.transaction_id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Payment Amount</p>
                <p className="mt-1 text-3xl font-bold text-blue-950">{formatCurrency(payment.amount)}</p>
              </div>
              <PaymentStatusBadge status={payment.payment_status} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
                <p className="mt-1 break-words text-sm font-semibold text-text-primary">{value}</p>
              </div>
            ))}
          </div>

          {invoiceDownloadUrl ? (
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => window.open(invoiceDownloadUrl, '_blank', 'noopener,noreferrer')}>
                <Download className="h-4 w-4" />
                Download Invoice
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true

    async function loadPayments() {
      try {
        setLoading(true)
        setError('')
        const data = await fetchPayments()
        if (active) setPayments(data)
      } catch (err) {
        if (active) setError(err.message || 'Unable to load payments.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPayments()

    return () => {
      active = false
    }
  }, [])

  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        payment.transaction_id.toLowerCase().includes(query) ||
        payment.booking_no.toLowerCase().includes(query) ||
        payment.guest_name.toLowerCase().includes(query) ||
        payment.invoice_number.toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter
      const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter
      const matchesDate = isInDateRange(payment.paid_at || payment.created_at, dateFrom, dateTo)

      return matchesSearch && matchesStatus && matchesMethod && matchesDate
    })
  }, [payments, searchTerm, statusFilter, methodFilter, dateFrom, dateTo])

  const summary = useMemo(() => {
    return payments.reduce(
      (acc, payment) => {
        if (payment.payment_status === 'paid') acc.totalPaid += Number(payment.amount)
        if (payment.payment_status === 'pending') acc.pending += Number(payment.amount)
        if (payment.payment_status === 'refunded') acc.refunded += Number(payment.amount)
        return acc
      },
      { totalPaid: 0, pending: 0, refunded: 0 }
    )
  }, [payments])

  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setMethodFilter('all')
    setDateFrom('')
    setDateTo('')
    setToast('Payment filters reset.')
    window.setTimeout(() => setToast(''), 2200)
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-medium text-blue-900 shadow-lg shadow-slate-200">
          {toast}
        </div>
      ) : null}

      <PageHeader
        title="Payments"
        description="Track PayHere payments, invoice details, and payment email delivery."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total Revenue" value={formatCurrency(summary.totalPaid)} description="Successfully collected" icon={TrendingUp} />
        <StatCard title="Pending Payments" value={formatCurrency(summary.pending)} description="Awaiting confirmation" icon={WalletCards} />
        <StatCard title="Refunded Amount" value={formatCurrency(summary.refunded)} description="Returned to guests" icon={Banknote} />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="xl:col-span-2">
                <Label htmlFor="payment-search">Search payments</Label>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="payment-search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Transaction, guest, booking no"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="payment-status">Status</Label>
                <select
                  id="payment-status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-medium text-text-primary shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">All statuses</option>
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>{statusLabel[status]}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="payment-method">Method</Label>
                <select
                  id="payment-method"
                  value={methodFilter}
                  onChange={(event) => setMethodFilter(event.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-medium text-text-primary shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">All methods</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="date-from">From</Label>
                <Input id="date-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-2" />
              </div>
            </div>

            <Button type="button" variant="outline" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{error}</div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-text-secondary">
                  <th className="px-3 py-3">Transaction</th>
                  <th className="px-3 py-3">Booking</th>
                  <th className="px-3 py-3">Guest</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Invoice</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="px-3 py-8 text-center text-text-secondary">Loading payments...</td></tr>
                ) : filteredPayments.length === 0 ? (
                  <tr><td colSpan="9" className="px-3 py-8 text-center text-text-secondary">No payments found.</td></tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-4 font-semibold text-text-primary">{payment.transaction_id}</td>
                      <td className="px-3 py-4 text-text-secondary">{payment.booking_no}</td>
                      <td className="px-3 py-4 text-text-secondary">{payment.guest_name}</td>
                      <td className="px-3 py-4 font-semibold text-text-primary">{formatCurrency(payment.amount)}</td>
                      <td className="px-3 py-4"><PaymentStatusBadge status={payment.payment_status} /></td>
                      <td className="px-3 py-4 text-text-secondary">{payment.invoice_number || 'Not generated'}</td>
                      <td className="px-3 py-4 text-text-secondary">{payment.email_status || 'Not Sent'}</td>
                      <td className="px-3 py-4 text-text-secondary">{formatDate(payment.paid_at || payment.created_at)}</td>
                      <td className="px-3 py-4 text-right">
                        <Button type="button" variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedPayment ? <PaymentDetailsModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} /> : null}
    </div>
  )
}
