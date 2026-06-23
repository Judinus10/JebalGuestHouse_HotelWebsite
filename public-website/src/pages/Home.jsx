import PageTransition from '@/components/layout/PageTransition'
import Hero from '@/components/home/Hero'
import BookingBar from '@/components/home/BookingBar'
import IntroSection from '@/components/home/IntroSection'
import PrivateStaySection from '@/components/home/PrivateStaySection'
import FeaturedRooms from '@/components/home/FeaturedRooms'
import ExperienceSection from '@/components/home/ExperienceSection'
import GallerySection from '@/components/home/GallerySection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import ContactPreview from '@/components/home/ContactPreview'

export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <BookingBar />
      <IntroSection />
      <PrivateStaySection />
      <FeaturedRooms />
      <ExperienceSection />
      <GallerySection />
      <TestimonialsSection />
      <ContactPreview />
    </PageTransition>
  )
}