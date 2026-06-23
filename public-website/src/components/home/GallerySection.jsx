import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FadeUp from '../ui/FadeUp'
import SectionHeading from '../ui/SectionHeading'
import { fetchPublicGallery } from '../../services/galleryApi'

const fallbackItems = []
const maxPreviewItems = 5

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

function formatTitle(value) {
  return String(value || 'Property')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function GallerySection() {
  const [items, setItems] = useState(fallbackItems)

  useEffect(() => {
    let ignore = false

    async function loadGalleryPreview() {
      try {
        const data = await fetchPublicGallery()
        const folders = data.folders || []
        const images = data.images || []

        const selected = []

        const roomsFolder = folders.find(
          (folder) => normalize(folder.slug) === 'rooms' || normalize(folder.name) === 'rooms'
        )

        if (roomsFolder) {
          const firstRoomImage = images.find(
            (image) => Number(image.folder_id) === Number(roomsFolder.id)
          )

          if (firstRoomImage) {
            selected.push({
              ...firstRoomImage,
              display_name: 'Room',
            })
          }
        }

        for (const folder of folders) {
          const folderSlug = normalize(folder.slug)
          const folderName = normalize(folder.name)

          if (folderSlug === 'rooms' || folderName === 'rooms') continue

          const folderImage = images.find(
            (image) => Number(image.folder_id) === Number(folder.id)
          )

          if (!folderImage) continue

          selected.push({
            ...folderImage,
            display_name: formatTitle(folder.name),
          })

          if (selected.length >= maxPreviewItems) break
        }

        if (!ignore) setItems(selected)
      } catch (error) {
        console.error('Gallery preview load failed:', error)
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
          description="A glimpse into the rooms, cottage, garden, parking, and other spaces that define Jebal Homes."
        />

        {items.length === 0 ? (
          <p className="text-center text-charcoal/70">
            Property images will appear here once added from admin.
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {items.map((item, index) => (
              <FadeUp key={`${item.folder_id}-${item.id}`} delay={index * 0.08}>
                <Link to="/gallery" className="group block w-[270px]">
                  <div className="image-zoom aspect-[2/3] overflow-hidden bg-ice">
                    <img
                      src={item.image_path}
                      alt={item.display_name || 'Property image'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <p className="mt-3 text-center text-xs tracking-[0.15em] uppercase text-charcoal transition-colors group-hover:text-gold">
                    {item.display_name}
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