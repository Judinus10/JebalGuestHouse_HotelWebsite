import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FadeUp from '../ui/FadeUp'
import ImageReveal from '../ui/ImageReveal'
import SectionHeading from '../ui/SectionHeading'
import { fetchExperiences } from '../../services/experienceApi'
import { publicErrorMessage } from '../../services/publicErrors'
import { useToast } from '../ui/ToastProvider'

export default function ExperienceSection() {
  const toast = useToast()
  const [experiences, setExperiences] = useState([])

  useEffect(() => {
    async function loadExperiences() {
      try {
        const data = await fetchExperiences()
        setExperiences(data.slice(0, 4))
      } catch (error) {
        console.error('Failed to load experiences:', error)
        toast.error(publicErrorMessage(error, 'experiences'))
      }
    }

    loadExperiences()
  }, [toast])

  return (
    <section id="experience" className="bg-charcoal py-24 text-white md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          subtitle="Guest House Comforts"
          title="Experience the Stay"
          description="Enjoy a clean, peaceful, and comfortable guest house environment designed for families, couples, and short stays."
          light
          align="left"
        />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {experiences.map((item, index) => (
            <ImageReveal key={item.id} direction="up" delay={index * 0.1}>
              <FadeUp delay={index * 0.1}>
                <Link
                  to="/experience"
                  className="group relative block h-80 overflow-hidden rounded-2xl"
                >
                  <img
                    src={item.image_path}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                    width="800"
                    height="600"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  <div className="absolute bottom-0 left-0 p-5">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-gold-light">
                      {item.location || item.category}
                    </p>
                    <h3 className="mt-1 font-serif text-xl text-white">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              </FadeUp>
            </ImageReveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/experience"
            className="inline-flex rounded-xl border border-gold px-6 py-3 text-sm font-medium text-gold transition hover:bg-gold hover:text-charcoal"
          >
            View All Experiences
          </Link>
        </div>
      </div>
    </section>
  )
}
