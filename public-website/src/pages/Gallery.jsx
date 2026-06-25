import { useEffect, useMemo, useState } from 'react'
import PageTransition from '../components/layout/PageTransition'
import SectionHeading from '../components/ui/SectionHeading'
import FadeUp from '../components/ui/FadeUp'
import { fetchPublicGallery } from '../services/galleryApi'

const fallbackHero = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920&q=80'

export default function Gallery() {
  const [folders, setFolders] = useState([])
  const [images, setImages] = useState([])
  const [activeFolder, setActiveFolder] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadGallery() {
      try {
        setLoading(true)
        setError('')
        const data = await fetchPublicGallery()
        if (!ignore) {
          setFolders(data.folders)
          setImages(data.images)
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load gallery.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadGallery()

    return () => {
      ignore = true
    }
  }, [])

  const filteredImages = useMemo(() => {
    if (activeFolder === 'all') return images
    return images.filter((image) => String(image.folder_id) === String(activeFolder))
  }, [images, activeFolder])

  return (
    <PageTransition>
      <section className="relative flex h-[40vh] min-h-[300px] items-end bg-charcoal">
        <img
          src={images[0]?.image_path || fallbackHero}
          alt="Jebal Guest House gallery"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-12">
          <FadeUp>
            <p className="text-xs tracking-[0.3em] uppercase text-gold-light">Gallery</p>
            <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
              Explore Jebal Guest House
            </h1>
          </FadeUp>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            subtitle="Property Photos"
            title="Guest House Gallery"
            description="A visual look at rooms, facilities, outdoor areas, and guest comforts available at Jebal Guest House."
          />

          {loading ? (
            <p className="text-center text-charcoal/70">Loading gallery...</p>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {!loading && !error ? (
            <>
              <div className="mb-10 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveFolder('all')}
                  className={`rounded-full border px-5 py-2 text-sm transition ${
                    activeFolder === 'all'
                      ? 'border-gold bg-gold text-white'
                      : 'border-charcoal/10 bg-white text-charcoal hover:border-gold'
                  }`}
                >
                  All
                </button>

                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setActiveFolder(folder.id)}
                    className={`rounded-full border px-5 py-2 text-sm transition ${
                      String(activeFolder) === String(folder.id)
                        ? 'border-gold bg-gold text-white'
                        : 'border-charcoal/10 bg-white text-charcoal hover:border-gold'
                    }`}
                  >
                    {folder.name}
                  </button>
                ))}
              </div>

              {filteredImages.length === 0 ? (
                <p className="text-center text-charcoal/70">No gallery images available yet.</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredImages.map((item, index) => (
                    <FadeUp key={item.id} delay={index * 0.04}>
                      <div className="group overflow-hidden bg-ice-light">
                        <div className="image-zoom aspect-[4/3] bg-ice">
                          <img
                            src={item.image_path}
                            alt={item.title || 'Gallery image'}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        <div className="p-5">
                          <p className="text-[11px] tracking-[0.25em] uppercase text-gold">
                            {item.folder_name || 'Gallery'}
                          </p>
                        </div>
                      </div>
                    </FadeUp>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>
    </PageTransition>
  )
}
