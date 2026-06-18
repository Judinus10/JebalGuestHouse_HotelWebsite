import FadeUp from '../ui/FadeUp'
import SectionHeading from '../ui/SectionHeading'

const galleryItems = [
  { label: 'Comfortable Rooms', image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80' },
  { label: 'Balcony Area', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80' },
  { label: 'Attached Bathroom', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80' },
  { label: 'Parking Area', image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&q=80' },
  { label: 'Garden Access', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80' },
]

/**
 * Gallery section with vertical image cards in a row.
 */
export default function GallerySection() {
  return (
    <section id="gallery" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          subtitle="Visual Journey"
          title="Explore the Property"
          description="A glimpse into the clean rooms, calm surroundings, and practical comforts that define Jebal Homes."
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-6">
          {galleryItems.map((item, index) => (
            <FadeUp key={item.label} delay={index * 0.08}>
              <div className="group">
                <div className="image-zoom aspect-[2/3] overflow-hidden bg-ice">
                  <img
                    src={item.image}
                    alt={item.label}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="mt-3 text-center text-xs tracking-[0.15em] uppercase text-charcoal transition-colors group-hover:text-gold">
                  {item.label}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}
