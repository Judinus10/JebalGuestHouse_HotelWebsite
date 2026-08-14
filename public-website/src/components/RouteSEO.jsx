import { useLocation } from 'react-router-dom'
import SEO from './SEO'
import { breadcrumbSchema, lodgingSchema } from '../data/business'

const pages = {
  '/': {
    title: 'Jebal Guest House | Affordable Rooms in Jaffna',
    description: 'Stay at Jebal Guest House in Jaffna, Sri Lanka. Discover clean, comfortable and affordable rooms with WiFi, parking and convenient direct booking.',
  },
  '/rooms': {
    title: 'Affordable Rooms in Jaffna | Jebal Guest House',
    description: 'Browse comfortable rooms in Jaffna at Jebal Guest House, including family rooms and private accommodation with WiFi, parking and essential facilities.',
  },
  '/gallery': {
    title: 'Guest House Photos in Jaffna | Jebal Guest House Gallery',
    description: 'View room, property and guest house photos from Jebal Guest House in Jaffna before planning your stay.',
  },
  '/experience': {
    title: 'Things to Do in Jaffna | Jebal Guest House',
    description: 'Discover attractions, culture, food, beaches and local experiences around Jaffna during your stay at Jebal Guest House.',
  },
  '/contact': {
    title: 'Contact Jebal Guest House | Booking and Directions in Jaffna',
    description: 'Contact Jebal Guest House for room enquiries, direct booking and directions to our guest house in Jaffna, Sri Lanka.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Jebal Guest House',
    description: 'Read how Jebal Guest House handles information submitted through its website and booking enquiry services.',
  },
  '/terms-of-service': {
    title: 'Terms of Service | Jebal Guest House',
    description: 'Read the website, enquiry and reservation terms for Jebal Guest House in Jaffna.',
  },
  '/booking-bill': {
    title: 'Booking Details | Jebal Guest House',
    description: 'Private booking information for a Jebal Guest House reservation.',
    robots: 'noindex, nofollow, noarchive',
  },
  '/multi-room-booking': {
    title: 'Multi-Room Booking | Jebal Guest House',
    description: 'Choose and reserve multiple available rooms for your group at Jebal Guest House.',
    robots: 'noindex, nofollow, noarchive',
  },
}

export default function RouteSEO() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/rooms/')) return null

  const page = pages[pathname] || {
    title: 'Page Not Found | Jebal Guest House',
    description: 'The requested page could not be found.',
    robots: 'noindex, nofollow',
  }

  const structuredData = pathname === '/'
    ? [lodgingSchema()]
    : page.robots?.startsWith('noindex')
      ? []
      : [breadcrumbSchema([{ name: 'Home', path: '/' }, { name: page.title.split('|')[0].trim(), path: pathname }])]

  return <SEO {...page} path={pathname} structuredData={structuredData} />
}
