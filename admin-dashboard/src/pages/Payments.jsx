import { useMemo, useState } from 'react'
import {
  Banknote,
  CreditCard,
  Eye,
  Filter,
  ReceiptText,
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
import { initialPayments, paymentMethods, paymentStatuses } from '@/data/paymentData'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const statusVariant = {
  pending: 'warning',
  paid: 'success',
  failed: 'destructive',
  refunded: 'purple',
}

const statusLabel = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
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

function isSameDay(dateValue, referenceDate = new Date()) {
  if (!dateValue) return false
  const date = new Date(dateValue)
  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate()
  )
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

  const details = [
    ['Payment ID', `PAY-${String(payment.id).padStart(4, '0')}`],
    ['Booking ID', payment.booking_id],
    ['Booking Number', payment.booking_no],
    ['Guest Name', payment.guest_name],
    ['Amount', formatCurrency(payment.amount)],
    ['Payment Method', payment.payment_method],
    ['Payment Gateway', payment.payment_gateway],
    ['Transaction ID', payment.transaction_id],
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
        </div>
      </div>
    </div>
  )
}

export default function Payments() {
  const [payments] = useState(initialPayments)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [toast, setToast] = useState('')

  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        payment.transaction_id.toLowerCase().includes(query) ||
        payment.booking_no.toLowerCase().includes(query) ||
        payment.guest_name.toLowerCase().includes(query)

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
        description="Track successful payments, pending transactions, and booking refunds."
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

              <div className="grid grid-cols-2 gap-3 md:col-span-2 xl:col-span-1">
                <div>
                  <Label htmlFor="date-from">From</Label>
                  <Input id="date-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="date-to">To</Label>
                  <Input id="date-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-2" />
                </div>
              </div>
            </div>

            <Button type="button" variant="outline" onClick={handleResetFilters}>
              <Filter className="h-4 w-4" />
              Reset
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Booking Number</th>
                    <th className="px-4 py-3">Guest Name</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Gateway</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Paid Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="transition hover:bg-blue-50/40">
                        <td className="px-4 py-4 font-semibold text-text-primary">{payment.transaction_id}</td>
                        <td className="px-4 py-4 text-text-secondary">{payment.booking_no}</td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-text-primary">{payment.guest_name}</div>
                          <div className="text-xs text-text-secondary">{payment.guest_email}</div>
                        </td>
                        <td className="px-4 py-4 font-semibold text-text-primary">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-4 text-text-secondary">{payment.payment_method}</td>
                        <td className="px-4 py-4 text-text-secondary">{payment.payment_gateway}</td>
                        <td className="px-4 py-4"><PaymentStatusBadge status={payment.payment_status} /></td>
                        <td className="px-4 py-4 text-text-secondary">{formatDate(payment.paid_at)}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-4 py-12 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center">
                          <div className="rounded-full bg-blue-50 p-4 text-blue-700">
                            <ReceiptText className="h-8 w-8" />
                          </div>
                          <h3 className="mt-4 text-base font-semibold text-text-primary">No payments found</h3>
                          <p className="mt-1 text-sm text-text-secondary">Try changing your filters or search keyword.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentDetailsModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
    </div>
  )
}
