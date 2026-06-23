import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { fetchExperiences } from '../services/experienceApi'

export default function Experience() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchExperiences()
        setItems(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[450px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
          alt="Experience"
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/50" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl px-6 text-center text-white">
            <h1 className="font-serif text-5xl font-bold md:text-6xl">
              Experience Jaffna
            </h1>

            <p className="mt-5 text-lg text-white/90">
              Explore culture, food, islands, beaches and attractions around
              Jaffna during your stay at Jebal Homes.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-4xl font-bold text-slate-900">
            Discover Local Experiences
          </h2>

          <p className="mt-3 text-slate-600">
            Curated experiences managed directly from the hotel administration.
          </p>
        </div>

        {loading ? (
          <div className="text-center">Loading experiences...</div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-60 overflow-hidden">
                  <img
                    src={item.image_path}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-6">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {item.category}
                  </span>

                  <h3 className="mt-4 text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 shrink-0" />

                    {item.location && (
                      <span>{item.location}</span>
                    )}

                    {item.location && item.distance && (
                      <span>•</span>
                    )}

                    {item.distance && (
                      <span>{item.distance}</span>
                    )}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="font-serif text-4xl font-bold text-slate-900">
            Ready To Explore Jaffna?
          </h2>

          <p className="mt-4 text-slate-600">
            Stay with Jebal Homes and discover unforgettable experiences across
            Northern Sri Lanka.
          </p>

          <a
            href="/rooms"
            className="mt-8 inline-flex rounded-xl bg-slate-900 px-8 py-3 font-medium text-white transition hover:bg-slate-800"
          >
            Book Your Stay
          </a>
        </div>
      </section>
    </div>
  )
}