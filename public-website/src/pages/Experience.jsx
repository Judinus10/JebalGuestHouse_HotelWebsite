import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import PageTransition from '../components/layout/PageTransition'
import SectionHeading from '../components/ui/SectionHeading'
import FadeUp from '../components/ui/FadeUp'
import { fetchExperiences } from '../services/experienceApi'
import experienceBanner from '../assets/images/banners/experience-banner.webp'
import { nearbyPlaces } from '../data/business'
import { publicErrorMessage } from '../services/publicErrors'
import { useToast } from '../components/ui/ToastProvider'

export default function Experience() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchExperiences()
        setItems(data)
      } catch (error) {
        const text = publicErrorMessage(error, 'experiences')
        setError(text)
        toast.error(text)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  return (
    <PageTransition>
      <section className="relative flex h-[40vh] min-h-[300px] items-end bg-charcoal">
        <img
          src={experienceBanner}
          alt="Experience Jaffna"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          width="1942"
          height="809"
          fetchPriority="high"
        />

        <div className="relative mx-auto w-full max-w-7xl px-6 pb-12">
          <FadeUp>
            <p className="text-xs tracking-[0.3em] uppercase text-gold-light">
              Local Experiences
            </p>
            <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
              Experience Jaffna
            </h1>
          </FadeUp>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            subtitle="Explore Around Us"
            title="Discover Local Experiences"
            description="Explore culture, food, islands, beaches and attractions around Jaffna during your stay at Jebal Guest House."
          />


          {loading ? (
            <p className="text-center text-charcoal/70">
              Loading experiences...
            </p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <FadeUp key={item.id} delay={index * 0.04}>
                  <div className="group overflow-hidden bg-ice-light transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="image-zoom h-60 bg-ice">
                      <img
                        src={item.image_path}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width="800"
                        height="600"
                      />
                    </div>

                    <div className="p-6">
                      <p className="text-[11px] tracking-[0.25em] uppercase text-gold">
                        {item.category || 'Experience'}
                      </p>

                      <h3 className="mt-3 font-serif text-2xl text-charcoal">
                        {item.title}
                      </h3>

                      <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                        <MapPin className="h-4 w-4 shrink-0" />

                        {item.location && <span>{item.location}</span>}

                        {item.location && item.distance && <span>•</span>}

                        {item.distance && <span>{item.distance}</span>}
                      </div>

                      <p className="mt-4 text-sm leading-7 text-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-ice-light py-20">
        <div className="mx-auto mb-20 max-w-6xl px-6">
          <SectionHeading subtitle="Nearby Jaffna Attractions" title="Places Near Jebal Guest House" description="Approximate travel distances from Jebal Guest House in Uyarappulam, Annaicoddai. Travel time depends on the route and transport conditions." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyPlaces.map(([place, distance]) => (
              <div key={place} className="flex items-center justify-between gap-4 bg-white px-5 py-4">
                <span className="text-sm text-charcoal">{place}</span>
                <span className="shrink-0 text-sm font-medium text-gold">{distance}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-6 text-center">
          <FadeUp>
            <p className="text-xs tracking-[0.3em] uppercase text-gold">
              Plan Your Stay
            </p>

            <h2 className="mt-3 font-serif text-4xl text-charcoal">
              Ready To Explore Jaffna?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-muted">
              Stay with Jebal Guest House and discover unforgettable experiences across
              Northern Sri Lanka.
            </p>

            <a
              href="/rooms"
              className="mt-8 inline-flex bg-charcoal px-8 py-3 text-xs tracking-[0.2em] uppercase text-white transition hover:bg-gold"
            >
              Book Your Stay
            </a>
          </FadeUp>
        </div>
      </section>
    </PageTransition>
  )
}
