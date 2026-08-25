import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
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
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const touchStartRef = useRef(null)

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

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
    touchStartRef.current = null
  }, [])

  const showPreviousImage = useCallback(() => {
    if (filteredImages.length < 2) return
    setLightboxIndex((current) => (current - 1 + filteredImages.length) % filteredImages.length)
  }, [filteredImages.length])

  const showNextImage = useCallback(() => {
    if (filteredImages.length < 2) return
    setLightboxIndex((current) => (current + 1) % filteredImages.length)
  }, [filteredImages.length])

  const lightboxOpen = lightboxIndex !== null

  useEffect(() => {
    if (!lightboxOpen) return undefined

    const scrollY = window.scrollY
    const body = document.body
    const previousStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    }

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeLightbox()
      if (event.key === 'ArrowLeft') showPreviousImage()
      if (event.key === 'ArrowRight') showNextImage()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      body.style.overflow = previousStyles.overflow
      body.style.position = previousStyles.position
      body.style.top = previousStyles.top
      body.style.width = previousStyles.width
      window.scrollTo(0, scrollY)
    }
  }, [closeLightbox, lightboxOpen, showNextImage, showPreviousImage])

  useEffect(() => {
    if (lightboxIndex !== null && !filteredImages[lightboxIndex]) closeLightbox()
  }, [closeLightbox, filteredImages, lightboxIndex])

  const handleTouchStart = (event) => {
    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event) => {
    const start = touchStartRef.current
    const touch = event.changedTouches[0]
    touchStartRef.current = null

    if (!start || !touch) return

    const horizontalDistance = touch.clientX - start.x
    const verticalDistance = touch.clientY - start.y
    if (Math.abs(horizontalDistance) < 50 || Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) return

    if (horizontalDistance > 0) showPreviousImage()
    else showNextImage()
  }

  useEffect(() => {
    if (!loading && !error && filteredImages.length === 0) toast.info('No gallery images are available in this category yet.')
  }, [error, filteredImages.length, loading, toast])

  return (
    <>
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
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(index)}
                        className="group block w-full overflow-hidden bg-ice-light text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                        aria-label={`Open ${item.title || 'gallery image'} in image viewer`}
                      >
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
                      </button>
                    </FadeUp>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
        </section>
      </PageTransition>

      {lightboxIndex !== null && filteredImages[lightboxIndex] && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 px-3 py-16 sm:px-8"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image viewer"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white hover:text-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-7 sm:top-6"
            aria-label="Close image viewer"
          >
            <X size={25} />
          </button>

          {filteredImages.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                showPreviousImage()
              }}
              className="absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white hover:text-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-7 sm:h-12 sm:w-12"
              aria-label="Previous image"
            >
              <ChevronLeft size={29} />
            </button>
          )}

          <figure
            className="flex max-h-full max-w-[calc(100vw-5.5rem)] flex-col items-center sm:max-w-[calc(100vw-11rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={filteredImages[lightboxIndex].image_path}
              alt={filteredImages[lightboxIndex].title || 'Gallery image'}
              className="max-h-[78vh] max-w-full select-none object-contain shadow-2xl"
              draggable="false"
            />
            <figcaption className="mt-4 text-center text-white">
              {filteredImages[lightboxIndex].title && (
                <p className="font-serif text-lg">{filteredImages[lightboxIndex].title}</p>
              )}
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/70">
                {filteredImages[lightboxIndex].folder_name || 'Gallery'} · {lightboxIndex + 1} / {filteredImages.length}
              </p>
            </figcaption>
          </figure>

          {filteredImages.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                showNextImage()
              }}
              className="absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white hover:text-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-7 sm:h-12 sm:w-12"
              aria-label="Next image"
            >
              <ChevronRight size={29} />
            </button>
          )}
        </div>,
        document.body,
      )}
    </>
  )
}
