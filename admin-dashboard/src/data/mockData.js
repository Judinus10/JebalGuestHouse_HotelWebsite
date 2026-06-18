export const dashboardStats = [
  { label: 'Total Bookings', value: '248', change: '+12% from last month', key: 'bookings' },
  { label: 'Occupancy Rate', value: '87%', change: '+5% from last week', key: 'occupancy' },
  { label: 'Revenue', value: '$124,580', change: '+18% from last month', key: 'revenue' },
  { label: 'Active Guests', value: '64', change: '32 check-ins today', key: 'guests' },
]

export const revenueChartData = [
  { month: 'Jan', revenue: 82000, bookings: 180 },
  { month: 'Feb', revenue: 91000, bookings: 195 },
  { month: 'Mar', revenue: 88000, bookings: 188 },
  { month: 'Apr', revenue: 102000, bookings: 220 },
  { month: 'May', revenue: 115000, bookings: 235 },
  { month: 'Jun', revenue: 124580, bookings: 248 },
]

export const occupancyChartData = [
  { day: 'Mon', rate: 72 },
  { day: 'Tue', rate: 68 },
  { day: 'Wed', rate: 75 },
  { day: 'Thu', rate: 82 },
  { day: 'Fri', rate: 95 },
  { day: 'Sat', rate: 98 },
  { day: 'Sun', rate: 87 },
]

export const recentBookings = [
  { id: 'BK-1042', guest: 'Eleanor Whitmore', room: 'Presidential Suite', checkIn: 'Jun 15, 2026', status: 'Confirmed' },
  { id: 'BK-1041', guest: 'James Chen', room: 'Deluxe King', checkIn: 'Jun 15, 2026', status: 'Checked In' },
  { id: 'BK-1040', guest: 'Sophia Laurent', room: 'Ocean View Twin', checkIn: 'Jun 16, 2026', status: 'Pending' },
  { id: 'BK-1039', guest: 'Marcus Rivera', room: 'Executive Suite', checkIn: 'Jun 16, 2026', status: 'Confirmed' },
  { id: 'BK-1038', guest: 'Amelia Foster', room: 'Garden Villa', checkIn: 'Jun 17, 2026', status: 'Confirmed' },
]

export const rooms = [
  { id: 'R-001', name: 'Presidential Suite', type: 'Suite', price: '$890', status: 'Occupied', floor: '12' },
  { id: 'R-002', name: 'Executive Suite', type: 'Suite', price: '$620', status: 'Available', floor: '10' },
  { id: 'R-003', name: 'Deluxe King', type: 'Deluxe', price: '$380', status: 'Occupied', floor: '8' },
  { id: 'R-004', name: 'Ocean View Twin', type: 'Standard', price: '$290', status: 'Maintenance', floor: '6' },
  { id: 'R-005', name: 'Garden Villa', type: 'Villa', price: '$1,200', status: 'Available', floor: '1' },
]

export const bookings = [
  { id: 'BK-1042', guest: 'Eleanor Whitmore', room: 'Presidential Suite', dates: 'Jun 15 – Jun 20', amount: '$4,450', status: 'Confirmed' },
  { id: 'BK-1041', guest: 'James Chen', room: 'Deluxe King', dates: 'Jun 15 – Jun 18', amount: '$1,140', status: 'Checked In' },
  { id: 'BK-1040', guest: 'Sophia Laurent', room: 'Ocean View Twin', dates: 'Jun 16 – Jun 19', amount: '$870', status: 'Pending' },
  { id: 'BK-1039', guest: 'Marcus Rivera', room: 'Executive Suite', dates: 'Jun 16 – Jun 22', amount: '$3,720', status: 'Confirmed' },
  { id: 'BK-1038', guest: 'Amelia Foster', room: 'Garden Villa', dates: 'Jun 17 – Jun 24', amount: '$8,400', status: 'Confirmed' },
]

export const calendarEvents = [
  { date: '2026-06-15', title: 'Presidential Suite — Whitmore', type: 'check-in' },
  { date: '2026-06-15', title: 'Deluxe King — Chen', type: 'occupied' },
  { date: '2026-06-16', title: 'Ocean View Twin — Laurent', type: 'check-in' },
  { date: '2026-06-17', title: 'Garden Villa — Foster', type: 'check-in' },
  { date: '2026-06-20', title: 'Presidential Suite — Whitmore', type: 'check-out' },
]

export const payments = [
  { id: 'PAY-8821', guest: 'Eleanor Whitmore', amount: '$4,450', method: 'Visa •••• 4821', date: 'Jun 14, 2026', status: 'Completed' },
  { id: 'PAY-8820', guest: 'James Chen', amount: '$1,140', method: 'Mastercard •••• 9034', date: 'Jun 14, 2026', status: 'Completed' },
  { id: 'PAY-8819', guest: 'Sophia Laurent', amount: '$870', method: 'Amex •••• 1102', date: 'Jun 13, 2026', status: 'Pending' },
  { id: 'PAY-8818', guest: 'Marcus Rivera', amount: '$3,720', method: 'Visa •••• 7723', date: 'Jun 13, 2026', status: 'Completed' },
]

export const galleryItems = [
  { id: 'G-01', title: 'Lobby Atrium', category: 'Interior', status: 'Published' },
  { id: 'G-02', title: 'Presidential Suite', category: 'Rooms', status: 'Published' },
  { id: 'G-03', title: 'Rooftop Pool', category: 'Amenities', status: 'Published' },
  { id: 'G-04', title: 'Fine Dining Restaurant', category: 'Dining', status: 'Draft' },
]

export const offers = [
  {
    id: 'O-01',
    title: 'Honeymoon Package',
    description: 'Private stay package for couples with decorated room setup and flexible check-in support.',
    package_category: 'Honeymoon Package',
    discount_type: 'percentage',
    discount_value: 12,
    start_date: '2026-06-01',
    end_date: '2026-12-31',
    status: 'active',
    image_path: '',
    image_preview: '',
    created_at: '2026-06-01T08:00:00Z',
    updated_at: '2026-06-15T08:00:00Z',
  },
  {
    id: 'O-02',
    title: 'Family Package',
    description: 'Comfortable family stay package with larger room allocation and access to shared facilities.',
    package_category: 'Family Package',
    discount_type: 'fixed',
    discount_value: 25,
    start_date: '2026-06-10',
    end_date: '2026-09-30',
    status: 'active',
    image_path: '',
    image_preview: '',
    created_at: '2026-06-02T08:00:00Z',
    updated_at: '2026-06-15T08:00:00Z',
  },
  {
    id: 'O-03',
    title: 'Entire Villa Package',
    description: 'Book the full guest house for a private group or family stay.',
    package_category: 'Entire Villa Package',
    discount_type: 'percentage',
    discount_value: 18,
    start_date: '2026-07-01',
    end_date: '2026-12-15',
    status: 'upcoming',
    image_path: '',
    image_preview: '',
    created_at: '2026-06-03T08:00:00Z',
    updated_at: '2026-06-15T08:00:00Z',
  },
  {
    id: 'O-04',
    title: 'Long Stay Offer',
    description: 'Discounted rate for guests staying one week or more.',
    package_category: 'Long Stay Offer',
    discount_type: 'percentage',
    discount_value: 15,
    start_date: '2026-06-01',
    end_date: '2026-11-30',
    status: 'active',
    image_path: '',
    image_preview: '',
    created_at: '2026-06-04T08:00:00Z',
    updated_at: '2026-06-15T08:00:00Z',
  },
  {
    id: 'O-05',
    title: 'Weekend Stay Offer',
    description: 'Simple weekend promotion for short guest house stays.',
    package_category: 'Weekend Stay Offer',
    discount_type: 'fixed',
    discount_value: 15,
    start_date: '2026-06-15',
    end_date: '2026-08-31',
    status: 'active',
    image_path: '',
    image_preview: '',
    created_at: '2026-06-05T08:00:00Z',
    updated_at: '2026-06-15T08:00:00Z',
  },
]

export const messages = [
  { id: 'M-301', from: 'Eleanor Whitmore', subject: 'Late check-in request', date: 'Jun 14, 2026', status: 'Unread' },
  { id: 'M-300', from: 'James Chen', subject: 'Room service inquiry', date: 'Jun 14, 2026', status: 'Read' },
  { id: 'M-299', from: 'Corporate Events Team', subject: 'Conference room booking', date: 'Jun 13, 2026', status: 'Unread' },
]

export const reviews = [
  { id: 'RV-88', guest: 'Amelia Foster', rating: 5, comment: 'Absolutely stunning property with impeccable service.', date: 'Jun 12, 2026', status: 'Published' },
  { id: 'RV-87', guest: 'David Park', rating: 4, comment: 'Beautiful rooms and excellent dining experience.', date: 'Jun 10, 2026', status: 'Published' },
  { id: 'RV-86', guest: 'Isabella Rossi', rating: 5, comment: 'The spa was extraordinary. Will return soon.', date: 'Jun 8, 2026', status: 'Pending' },
]

export const users = [
  { id: 'U-01', name: 'Admin User', email: 'admin@grandaurelia.com', role: 'Administrator', status: 'Active' },
  { id: 'U-02', name: 'Sarah Mitchell', email: 'sarah.m@grandaurelia.com', role: 'Front Desk', status: 'Active' },
  { id: 'U-03', name: 'David Okonkwo', email: 'david.o@grandaurelia.com', role: 'Manager', status: 'Active' },
  { id: 'U-04', name: 'Lisa Tran', email: 'lisa.t@grandaurelia.com', role: 'Content Editor', status: 'Inactive' },
]

export const activityLogs = [
  { id: 'AL-501', user: 'Admin User', action: 'Updated room pricing', module: 'Rooms', timestamp: 'Jun 15, 2026 08:42' },
  { id: 'AL-500', user: 'Sarah Mitchell', action: 'Confirmed booking BK-1042', module: 'Bookings', timestamp: 'Jun 15, 2026 08:15' },
  { id: 'AL-499', user: 'David Okonkwo', action: 'Published gallery item G-03', module: 'Gallery', timestamp: 'Jun 14, 2026 17:30' },
  { id: 'AL-498', user: 'Lisa Tran', action: 'Updated homepage hero content', module: 'Content', timestamp: 'Jun 14, 2026 14:22' },
]

export const notifications = [
  { id: 'N-101', title: 'New booking received', message: 'Booking BK-1042 from Eleanor Whitmore', time: '2 hours ago', read: false },
  { id: 'N-100', title: 'Payment confirmed', message: 'Payment PAY-8821 processed successfully', time: '4 hours ago', read: false },
  { id: 'N-099', title: 'Review submitted', message: 'New 5-star review from Amelia Foster', time: '1 day ago', read: true },
]

export const languages = [
  { code: 'en', name: 'English', status: 'Default', progress: '100%' },
  { code: 'fr', name: 'French', status: 'Active', progress: '92%' },
  { code: 'es', name: 'Spanish', status: 'Active', progress: '88%' },
  { code: 'de', name: 'German', status: 'Draft', progress: '45%' },
]

export const seoPages = [
  { page: 'Homepage', title: 'Grand Aurelia — Luxury Hotel & Resort', score: 92, status: 'Optimized' },
  { page: 'Rooms', title: 'Luxury Rooms & Suites | Grand Aurelia', score: 88, status: 'Optimized' },
  { page: 'Dining', title: 'Fine Dining Experience | Grand Aurelia', score: 76, status: 'Needs Review' },
  { page: 'Spa', title: 'Wellness & Spa | Grand Aurelia', score: 81, status: 'Optimized' },
]

export const contentPages = [
  { id: 'CP-01', title: 'Homepage Hero', type: 'Hero Banner', lastUpdated: 'Jun 14, 2026', status: 'Published' },
  { id: 'CP-02', title: 'About Us', type: 'Page Content', lastUpdated: 'Jun 10, 2026', status: 'Published' },
  { id: 'CP-03', title: 'Amenities Overview', type: 'Section', lastUpdated: 'Jun 8, 2026', status: 'Draft' },
]

export const websiteSettings = {
  hotelName: 'Grand Aurelia Hotel & Resort',
  tagline: 'Where elegance meets tranquility',
  email: 'reservations@grandaurelia.com',
  phone: '+1 (555) 123-4567',
  address: '1 Aurelia Boulevard, Coastal Bay, CA 90210',
  timezone: 'America/Los_Angeles',
  currency: 'USD',
}

export const currentUser = {
  name: 'Admin User',
  email: 'admin@grandaurelia.com',
  role: 'Administrator',
  avatar: 'AU',
}
