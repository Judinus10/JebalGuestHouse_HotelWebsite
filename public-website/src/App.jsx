import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/layout/Layout'
import ScrollToTop from './components/layout/ScrollToTop'
import RouteSEO from './components/RouteSEO'

const Home = lazy(() => import('./pages/Home'))
const Rooms = lazy(() => import('./pages/Rooms'))
const RoomDetails = lazy(() => import('./pages/RoomDetails'))
const BookingBill = lazy(() => import('./pages/BookingBill'))
const Contact = lazy(() => import('./pages/Contact'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Experience = lazy(() => import('./pages/Experience'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const NotFound = lazy(() => import('./pages/NotFound'))

/**
 * Root application with route-based page transitions.
 */
function App() {
  const location = useLocation()

  return (
    <Layout>
      <ScrollToTop />
      <RouteSEO />
      <AnimatePresence mode="wait">
        <Suspense fallback={<div className="min-h-screen bg-white" aria-label="Loading page" />}>
          <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/booking-bill" element={<BookingBill />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </Layout>
  )
}

export default App
