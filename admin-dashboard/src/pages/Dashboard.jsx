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

const rooms = [
  {
    id: 'R-001',
    name: 'Ground Floor Room 1',
    propertyType: 'Ground Floor',
    category: 'Standard',
    status: 'Available',
    price: 45,
  },
  {
    id: 'R-002',
    name: 'Ground Floor Room 2',
    propertyType: 'Ground Floor',
    category: 'Deluxe',
    status: 'Available',
    price: 50,
  },
  {
    id: 'R-003',
    name: 'First Floor Room 1',
    propertyType: 'First Floor',
    category: 'Deluxe',
    status: 'Occupied',
    price: 55,
  },
  {
    id: 'R-004',
    name: 'First Floor Room 2',
    propertyType: 'First Floor',
    category: 'Standard',
    status: 'Available',
    price: 50,
  },
  {
    id: 'R-005',
    name: 'Family Room',
    propertyType: 'First Floor',
    category: 'Family',
    status: 'Occupied',
    price: 75,
  },
  {
    id: 'R-006',
    name: 'Private Cottage',
    propertyType: 'Cottage',
    category: 'Cottage',
    status: 'Available',
    price: 95,
  },
]

const bookings = [
  {
    bookingNo: 'BK-1048',
    guest: 'Sarah Williams',
    room: 'Private Cottage',
    checkIn: '2026-06-18',
    nights: 3,
    amount: 285,
    status: 'Confirmed',
    createdAt: '2026-06-15T10:30:00Z',
  },
  {
    bookingNo: 'BK-1047',
    guest: 'Kavindu Perera',
    room: 'Family Room',
    checkIn: '2026-06-17',
    nights: 2,
    amount: 150,
    status: 'Pending',
    createdAt: '2026-06-15T08:10:00Z',
  },
  {
    bookingNo: 'BK-1046',
    guest: 'Meera Nadarajah',
    room: 'First Floor Room 1',
    checkIn: '2026-06-16',
    nights: 4,
    amount: 220,
    status: 'Confirmed',
    createdAt: '2026-06-14T15:45:00Z',
  },
  {
    bookingNo: 'BK-1045',
    guest: 'Daniel Joseph',
    room: 'Ground Floor Room 1',
    checkIn: '2026-06-14',
    nights: 2,
    amount: 90,
    status: 'Completed',
    createdAt: '2026-06-13T11:20:00Z',
  },
  {
    bookingNo: 'BK-1044',
    guest: 'Ayesha Khan',
    room: 'Ground Floor Room 2',
    checkIn: '2026-06-20',
    nights: 1,
    amount: 50,
    status: 'Cancelled',
    createdAt: '2026-06-12T09:00:00Z',
  },
  {
    bookingNo: 'BK-1043',
    guest: 'Nimal Fernando',
    room: 'First Floor Room 2',
    checkIn: '2026-06-21',
    nights: 5,
    amount: 250,
    status: 'Pending',
    createdAt: '2026-06-11T18:15:00Z',
  },
  {
    bookingNo: 'BK-1042',
    guest: 'Priya Selvarajah',
    room: 'Private Cottage',
    checkIn: '2026-06-22',
    nights: 2,
    amount: 190,
    status: 'Confirmed',
    createdAt: '2026-06-10T13:30:00Z',
  },
]

const payments = [
  { transaction: 'TXN-9021', guest: 'Sarah Williams', amount: 285, status: 'Paid', createdAt: '2026-06-15T11:15:00Z' },
  { transaction: 'TXN-9020', guest: 'Kavindu Perera', amount: 150, status: 'Pending', createdAt: '2026-06-15T08:20:00Z' },
  { transaction: 'TXN-9019', guest: 'Meera Nadarajah', amount: 220, status: 'Paid', createdAt: '2026-06-14T16:10:00Z' },
  { transaction: 'TXN-9018', guest: 'Daniel Joseph', amount: 90, status: 'Paid', createdAt: '2026-06-13T12:00:00Z' },
  { transaction: 'TXN-9017', guest: 'Ayesha Khan', amount: 50, status: 'Refunded', createdAt: '2026-06-12T09:30:00Z' },
  { transaction: 'TXN-9016', guest: 'Nimal Fernando', amount: 250, status: 'Failed', createdAt: '2026-06-11T18:40:00Z' },
]

const messages = [
  {
    id: 'M-301',
    from: 'Sarah Williams',
    subject: 'Cottage availability question',
    message: 'Is the private cottage available for a quiet family stay next weekend?',
    status: 'Unread',
    createdAt: '2026-06-15T08:35:00Z',
  },
  {
    id: 'M-300',
    from: 'Meera Nadarajah',
    subject: 'Kitchen access details',
    message: 'Can guests use the common kitchen and refrigerator during the stay?',
    status: 'Read',
    createdAt: '2026-06-14T13:20:00Z',
  },
  {
    id: 'M-299',
    from: 'Kavindu Perera',
    subject: 'Family room inquiry',
    message: 'Please confirm if the family room has an attached bathroom and WiFi.',
    status: 'Unread',
    createdAt: '2026-06-13T17:05:00Z',
  },
]

const galleryItems = [
  { title: 'Ground Floor Room', category: 'Rooms', status: 'Active' },
  { title: 'First Floor Balcony Room', category: 'Rooms', status: 'Active' },
  { title: 'Private Cottage', category: 'Cottage', status: 'Active' },
  { title: 'Garden Area', category: 'Garden', status: 'Active' },
  { title: 'Common Kitchen', category: 'Facilities', status: 'Active' },
]

const offers = [
  { title: 'Honeymoon Package', status: 'Active' },
  { title: 'Family Package', status: 'Active' },
  { title: 'Entire Villa Package', status: 'Active' },
  { title: 'Long Stay Offer', status: 'Scheduled' },
]

const monthlyBookingTrend = [
  { month: 'Jan', bookings: 12 },
  { month: 'Feb', bookings: 16 },
  { month: 'Mar', bookings: 14 },
  { month: 'Apr', bookings: 20 },
  { month: 'May', bookings: 22 },
  { month: 'Jun', bookings: 27 },
]

const revenueTrend = [
  { month: 'Jan', revenue: 1450 },
  { month: 'Feb', revenue: 1680 },
  { month: 'Mar', revenue: 1520 },
  { month: 'Apr', revenue: 2110 },
  { month: 'May', revenue: 2460 },
  { month: 'Jun', revenue: 2890 },
]

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
  Unread: 'warning',
  Read: 'secondary',
  Active: 'success',
  Scheduled: 'warning',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

function formatDate(date) {
  return shortDateFormatter.format(new Date(date))
}

function getCountByStatus(items, key, status) {
  return items.filter((item) => item[key] === status).length
}

function getPercentage(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function buildStatusData(items, key, statuses) {
  const total = items.length
  return statuses.map((status) => {
    const count = getCountByStatus(items, key, status)
    return {
      name: status,
      value: count,
      percentage: getPercentage(count, total),
    }
  })
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
              formatter={(value, name, item) => [`${item.payload.percentage}% (${value})`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <ChartLegend data={data} />
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
  const availableRooms = rooms.filter((room) => room.status === 'Available').length
  const totalRevenue = payments
    .filter((payment) => payment.status === 'Paid')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const pendingPaymentAmount = payments
    .filter((payment) => payment.status === 'Pending')
    .reduce((sum, payment) => sum + payment.amount, 0)

  const bookingStatusData = buildStatusData(bookings, 'status', ['Pending', 'Confirmed', 'Cancelled', 'Completed'])
  const paymentStatusData = buildStatusData(payments, 'status', ['Paid', 'Pending', 'Failed', 'Refunded'])

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const upcomingCheckIns = bookings
    .filter((booking) => booking.status !== 'Cancelled' && new Date(booking.checkIn) >= new Date('2026-06-15'))
    .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
    .slice(0, 5)

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const latestMessages = [...messages]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)

  const kpis = [
    { title: 'Total Rooms', value: rooms.length, helper: 'Small guest house inventory', icon: BedDouble },
    { title: 'Available Rooms', value: availableRooms, helper: 'Ready for reservation', icon: Home },
    { title: 'Total Bookings', value: bookings.length, helper: 'Current mock reservations', icon: CalendarCheck },
    { title: 'Pending Bookings', value: getCountByStatus(bookings, 'status', 'Pending'), helper: 'Need confirmation', icon: TrendingUp },
    { title: 'Confirmed Bookings', value: getCountByStatus(bookings, 'status', 'Confirmed'), helper: 'Expected arrivals', icon: CalendarCheck },
    { title: 'Total Revenue', value: currencyFormatter.format(totalRevenue), helper: 'Paid payments only', icon: DollarSign },
    { title: 'Pending Payments', value: currencyFormatter.format(pendingPaymentAmount), helper: 'Awaiting payment', icon: CreditCard },
    { title: 'Unread Messages', value: getCountByStatus(messages, 'status', 'Unread'), helper: 'Guest inquiries', icon: Mail },
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-3">
          <MiniSummaryCard title="Gallery Items" value={galleryItems.length} helper="Website media" icon={Image} />
          <MiniSummaryCard title="Active Packages" value={offers.filter((offer) => offer.status === 'Active').length} helper="Visible offers" icon={Tag} />
          <MiniSummaryCard title="Open Guest Tasks" value={getCountByStatus(messages, 'status', 'Unread')} helper="Need reply" icon={MessageSquareText} />
          <MiniSummaryCard title="Ground Floor Rooms" value={rooms.filter((room) => room.propertyType === 'Ground Floor').length} helper="Easy access units" icon={Home} />
          <MiniSummaryCard title="First Floor Rooms" value={rooms.filter((room) => room.propertyType === 'First Floor').length} helper="Balcony-level units" icon={Building2} />
          <MiniSummaryCard title="Cottage Units" value={rooms.filter((room) => room.propertyType === 'Cottage').length} helper="Separate cottage" icon={Layers} />
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
              <AreaChart data={monthlyBookingTrend}>
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
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
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
          items={recentBookings}
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
          items={upcomingCheckIns}
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
          items={recentPayments}
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
          items={latestMessages}
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
