import PageTransition from '../components/layout/PageTransition'
import Hero from '../components/home/Hero'
import BookingBar from '../components/home/BookingBar'
import IntroSection from '../components/home/IntroSection'
import FeaturedRooms from '../components/home/FeaturedRooms'
import ExperienceSection from '../components/home/ExperienceSection'
import PrivateStaySection from '../components/home/PrivateStaySection'
import GallerySection from '../components/home/GallerySection'
import TestimonialsSection from '../components/home/TestimonialsSection'
import ContactPreview from '../components/home/ContactPreview'

/**
 * Homepage — assembles all guest house sections in order.
 */
export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <BookingBar />
      <IntroSection />
      <FeaturedRooms />
      <ExperienceSection />
      <PrivateStaySection />
      <GallerySection />
      <TestimonialsSection />
      <ContactPreview />
    </PageTransition>
  )
}
