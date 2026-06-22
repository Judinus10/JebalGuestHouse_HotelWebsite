import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FadeUp from '../ui/FadeUp'
import SectionHeading from '../ui/SectionHeading'
import { fetchPublicGallery } from '../../services/galleryApi'

const fallbackItems = []

export default function GallerySection() {
  const [items, setItems] = useState(fallbackItems)

  useEffect(() => {
    let ignore = false

    async function loadGalleryPreview() {
      try {
        const data = await fetchPublicGallery()
        if (!ignore) setItems((data.images || []).slice(0, 5))
      } catch {
        if (!ignore) setItems([])
      }
    }

    loadGalleryPreview()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <section id="gallery" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          subtitle="Visual Journey"
          title="Explore the Property"
          description="A glimpse into the clean rooms, calm surroundings, and practical comforts that define Jebal Homes."
        />

        {items.length === 0 ? (
          <p className="text-center text-charcoal/70">Gallery images will appear here once added from admin.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-6">
            {items.map((item, index) => (
              <FadeUp key={item.id} delay={index * 0.08}>
                <Link to="/gallery" className="group block">
                  <div className="image-zoom aspect-[2/3] overflow-hidden bg-ice">
                    <img
                      src={item.image_path}
                      alt={item.title || 'Gallery image'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-3 text-center text-xs tracking-[0.15em] uppercase text-charcoal transition-colors group-hover:text-gold">
                    {item.title || item.folder_name || 'Gallery'}
                  </p>
                </Link>
              </FadeUp>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
