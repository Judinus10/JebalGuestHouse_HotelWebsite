import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BedDouble,
  CalendarCheck,
  CreditCard,
  DollarSign,
  Image,
  Mail,
  MessageSquareText,
  Tag,
  TrendingUp,
  Home,
  Layers,
  Building2,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchDashboardStats } from '@/services/dashboardApi'

const defaultDashboardData = {
  cards: {
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalEnquiries: 0,
    totalRevenue: 0,
    paidBookings: 0,
    paymentPendingBookings: 0,
  },
  revenue: {
    today: 0,
    currentMonth: 0,
    currentYear: 0,
    lifetime: 0,
  },
  rooms: {
    totalRooms: 6,
    availableRooms: 6,
    groundFloorRooms: 2,
    firstFloorRooms: 2,
    cottageUnits: 1,
    mostBookedRoom: 'No confirmed bookings yet',
    occupancyRate: 0,
  },
  charts: {
    monthlyBookingTrend: [],
    revenueTrend: [],
    bookingStatusDistribution: [],
    paymentStatusDistribution: [],
  },
  enquiries: {
    new: 0,
    read: 0,
    replied: 0,
  },
  payments: {
    paid: 0,
    failed: 0,
    refunded: 0,
    pending: 0,
  },
  lists: {
    recentBookings: [],
    upcomingCheckIns: [],
    recentPayments: [],
    latestMessages: [],
  },
}

const chartColors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

const statusVariant = {
  Available: 'success',
  Occupied: 'secondary',
  Pending: 'warning',
  Confirmed: 'success',
  Cancelled: 'destructive',
  Completed: 'default',
  Paid: 'success',
  Failed: 'destructive',
  Refunded: 'secondary',
  'Payment Pending': 'warning',
  New: 'warning',
  Read: 'secondary',
  Replied: 'success',
  Active: 'success',
  Scheduled: 'warning',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
})

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

function formatDate(date) {
  if (!date) return 'Not set'
  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return 'Not set'
  return shortDateFormatter.format(parsedDate)
}

function getPercentage(value, total) {
  if (!total) return 0
  return Math.round((Number(value || 0) / Number(total || 0)) * 100)
}

function normalizeDistribution(items) {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0)

  return items.map((item) => ({
    ...item,
    percentage: item.percentage ?? getPercentage(item.value, total),
  }))
}

function KpiCard({ title, value, helper, icon: Icon }) {
  return (
    <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted">{title}</p>
            <p className="mt-2 text-2xl font-semibold text-charcoal">{value}</p>
            {helper && <p className="mt-1 text-xs text-muted">{helper}</p>}
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniSummaryCard({ title, value, helper, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted">{title}</p>
            <p className="text-xl font-semibold text-charcoal">{value}</p>
            {helper && <p className="truncate text-xs text-muted">{helper}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartLegend({ data }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {data.map((item, index) => (
        <div key={item.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
            <span className="truncate text-charcoal">{item.name}</span>
          </div>
          <span className="font-semibold text-blue-700">{item.percentage}%</span>
        </div>
      ))}
    </div>
  )
}

function StatusDonut({ title, data }) {
  const chartData = normalizeDistribution(data)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
              formatter={(value, name, item) => [`${item.payload.percentage}% (${value})`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <ChartLegend data={chartData} />
      </CardContent>
    </Card>
  )
}

function CompactList({ title, description, items, emptyText, renderItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted">{description}</p>}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-slate-50 p-6 text-center text-sm text-muted">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-3">{items.map(renderItem)}</div>
        )}
      </CardContent>
    </Card>
  )
}

function ListRow({ title, subtitle, right, badge }) {
  return (
    <div className="rounded-xl border border-border p-4 transition-colors hover:bg-blue-50/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-charcoal">{title}</p>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
          {badge}
          {right && <span className="font-semibold text-charcoal">{right}</span>}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(defaultDashboardData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadDashboardStats() {
      try {
        setIsLoading(true)
        setError('')
        const data = await fetchDashboardStats()

        if (isMounted) {
          setDashboardData({
            ...defaultDashboardData,
            ...data,
            cards: { ...defaultDashboardData.cards, ...(data?.cards || {}) },
            revenue: { ...defaultDashboardData.revenue, ...(data?.revenue || {}) },
            rooms: { ...defaultDashboardData.rooms, ...(data?.rooms || {}) },
            charts: { ...defaultDashboardData.charts, ...(data?.charts || {}) },
            enquiries: { ...defaultDashboardData.enquiries, ...(data?.enquiries || {}) },
            payments: { ...defaultDashboardData.payments, ...(data?.payments || {}) },
            lists: { ...defaultDashboardData.lists, ...(data?.lists || {}) },
          })
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load dashboard statistics.')
          setDashboardData(defaultDashboardData)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboardStats()

    return () => {
      isMounted = false
    }
  }, [])

  const bookingStatusData = useMemo(
    () => normalizeDistribution(dashboardData.charts.bookingStatusDistribution),
    [dashboardData.charts.bookingStatusDistribution]
  )

  const paymentStatusData = useMemo(
    () => normalizeDistribution(dashboardData.charts.paymentStatusDistribution),
    [dashboardData.charts.paymentStatusDistribution]
  )

  const kpis = [
    { title: 'Total Bookings', value: dashboardData.cards.totalBookings, helper: 'All booking inquiries', icon: CalendarCheck },
    { title: 'Pending Bookings', value: dashboardData.cards.pendingBookings, helper: 'Need confirmation', icon: TrendingUp },
    { title: 'Confirmed Bookings', value: dashboardData.cards.confirmedBookings, helper: 'Confirmed stays', icon: CalendarCheck },
    { title: 'Cancelled Bookings', value: dashboardData.cards.cancelledBookings, helper: 'Cancelled requests', icon: BedDouble },
    { title: 'Total Enquiries', value: dashboardData.cards.totalEnquiries, helper: 'Contact form messages', icon: Mail },
    { title: 'Total Revenue', value: currencyFormatter.format(dashboardData.cards.totalRevenue), helper: 'Paid bookings only', icon: DollarSign },
    { title: 'Paid Bookings', value: dashboardData.cards.paidBookings, helper: 'Payment completed', icon: CreditCard },
    { title: 'Payment Pending', value: dashboardData.cards.paymentPendingBookings, helper: 'Awaiting payment', icon: CreditCard },
  ]

  const quickActions = [
    { label: 'Add Room', to: '/rooms', icon: BedDouble },
    { label: 'View Bookings', to: '/bookings', icon: CalendarCheck },
    { label: 'Open Calendar', to: '/booking-calendar', icon: CalendarCheck },
    { label: 'Manage Gallery', to: '/gallery', icon: Image },
    { label: 'Website Settings', to: '/website-settings', icon: Tag },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Guest house overview for rooms, reservations, payments, messages, packages, and website content."
      />

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          Loading real dashboard statistics...
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-3">
          <MiniSummaryCard title="Today Revenue" value={currencyFormatter.format(dashboardData.revenue.today)} helper="Paid today" icon={DollarSign} />
          <MiniSummaryCard title="Month Revenue" value={currencyFormatter.format(dashboardData.revenue.currentMonth)} helper="Paid this month" icon={TrendingUp} />
          <MiniSummaryCard title="Year Revenue" value={currencyFormatter.format(dashboardData.revenue.currentYear)} helper="Paid this year" icon={CreditCard} />
          <MiniSummaryCard title="Ground Floor Rooms" value={dashboardData.rooms.groundFloorRooms} helper="Easy access units" icon={Home} />
          <MiniSummaryCard title="First Floor Rooms" value={dashboardData.rooms.firstFloorRooms} helper="Balcony-level units" icon={Building2} />
          <MiniSummaryCard title="Cottage Units" value={dashboardData.rooms.cottageUnits} helper="Separate cottage" icon={Layers} />
          <MiniSummaryCard title="Most Booked Room" value={dashboardData.rooms.mostBookedRoom} helper="Confirmed bookings" icon={BedDouble} />
          <MiniSummaryCard title="Occupancy Rate" value={`${dashboardData.rooms.occupancyRate}%`} helper="Confirmed active stays" icon={Home} />
          <MiniSummaryCard title="New Enquiries" value={dashboardData.enquiries.new} helper="Need attention" icon={MessageSquareText} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-sm text-muted">Fast links to key daily operations.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  className="inline-flex h-10 w-full items-center justify-start gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-sm transition-colors hover:bg-slate-50"
                >
                  <Icon className="h-4 w-4 text-blue-700" />
                  {action.label}
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Booking Trend</CardTitle>
            <p className="text-sm text-muted">Reservation volume by month.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.charts.monthlyBookingTrend}>
                <defs>
                  <linearGradient id="bookingTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
                <Area type="monotone" dataKey="bookings" stroke="#2563EB" strokeWidth={2} fill="url(#bookingTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <p className="text-sm text-muted">Paid accommodation revenue trend.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.charts.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }}
                  formatter={(value) => [currencyFormatter.format(value), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <StatusDonut title="Booking Status" data={bookingStatusData} />
        <StatusDonut title="Payment Status" data={paymentStatusData} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <CompactList
          title="Recent Bookings"
          description="Latest reservations created in the system."
          emptyText="No recent bookings found."
          items={dashboardData.lists.recentBookings}
          renderItem={(booking) => (
            <ListRow
              key={booking.bookingNo}
              title={`${booking.guest} • ${booking.room}`}
              subtitle={`${booking.bookingNo} • Check-in ${formatDate(booking.checkIn)}`}
              right={currencyFormatter.format(booking.amount)}
              badge={<Badge variant={statusVariant[booking.status] || 'secondary'}>{booking.status}</Badge>}
            />
          )}
        />

        <CompactList
          title="Upcoming Check-ins"
          description="Arrivals from today onward."
          emptyText="No upcoming check-ins."
          items={dashboardData.lists.upcomingCheckIns}
          renderItem={(booking) => (
            <ListRow
              key={booking.bookingNo}
              title={`${formatDate(booking.checkIn)} • ${booking.guest}`}
              subtitle={`${booking.room} • ${booking.nights} night${booking.nights > 1 ? 's' : ''}`}
              badge={<Badge variant={statusVariant[booking.status] || 'secondary'}>{booking.status}</Badge>}
            />
          )}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <CompactList
          title="Recent Payments"
          description="Latest payment activity."
          emptyText="No payment records found."
          items={dashboardData.lists.recentPayments}
          renderItem={(payment) => (
            <ListRow
              key={payment.transaction}
              title={`${payment.transaction} • ${payment.guest}`}
              subtitle={formatDate(payment.createdAt)}
              right={currencyFormatter.format(payment.amount)}
              badge={<Badge variant={statusVariant[payment.status] || 'secondary'}>{payment.status}</Badge>}
            />
          )}
        />

        <CompactList
          title="Latest Messages"
          description="Newest guest inquiries."
          emptyText="No messages found."
          items={dashboardData.lists.latestMessages}
          renderItem={(message) => (
            <ListRow
              key={message.id}
              title={message.subject}
              subtitle={`${message.from} • ${message.message}`}
              badge={<Badge variant={statusVariant[message.status] || 'secondary'}>{message.status}</Badge>}
            />
          )}
        />
      </section>
    </div>
  )
}
