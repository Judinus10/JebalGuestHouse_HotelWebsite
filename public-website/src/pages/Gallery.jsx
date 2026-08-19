import { useEffect, useMemo, useState } from 'react'
import PageTransition from '../components/layout/PageTransition'
import SectionHeading from '../components/ui/SectionHeading'
import FadeUp from '../components/ui/FadeUp'
import { fetchPublicGallery } from '../services/galleryApi'
import galleryBanner from '../assets/images/banners/gallery-banner.webp'
import { publicErrorMessage } from '../services/publicErrors'
import { useToast } from '../components/ui/ToastProvider'

export default function Gallery() {
  const toast = useToast()
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
        if (!ignore) {
          const text = publicErrorMessage(err, 'gallery')
          setError(text)
          toast.error(text)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadGallery()

    return () => {
      ignore = true
    }
  }, [toast])

  const filteredImages = useMemo(() => {
    if (activeFolder === 'all') return images
    return images.filter((image) => String(image.folder_id) === String(activeFolder))
  }, [images, activeFolder])

  useEffect(() => {
    if (!loading && !error && filteredImages.length === 0) toast.info('No gallery images are available in this category yet.')
  }, [error, filteredImages.length, loading, toast])

  return (
    <PageTransition>
      <section className="relative flex h-[40vh] min-h-[300px] items-end bg-charcoal">
        <img
          src={galleryBanner}
          alt="Jebal Guest House gallery"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          width="1942"
          height="809"
          fetchPriority="high"
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

              {filteredImages.length === 0 ? null : (
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
                            decoding="async"
                            width="800"
                            height="600"
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
