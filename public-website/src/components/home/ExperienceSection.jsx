import FadeUp from '../ui/FadeUp'
import ImageReveal from '../ui/ImageReveal'
import SectionHeading from '../ui/SectionHeading'

const experiences = [
  {
    title: 'Comfortable Rooms',
    location: 'Clean Guest Rooms',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
    height: 'h-72',
  },
  {
    title: 'Family Friendly Stay',
    location: 'Suitable for Families',
    image: 'https://images.unsplash.com/photo-1584132915807-fd1f5aed9f76?w=600&q=80',
    height: 'h-96',
  },
  {
    title: 'Garden Access',
    location: 'Peaceful Garden Area',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
    height: 'h-80',
  },
  {
    title: 'Easy Booking Inquiry',
    location: 'Contact Our Team',
    image: 'https://images.unsplash.com/photo-1423666639043-560641683e4c?w=600&q=80',
    height: 'h-64',
  },
]

/**
 * Dark "Experience the Stay" section with staggered image cards.
 */
export default function ExperienceSection() {
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

        {/* Staggered image gallery */}
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {experiences.map((item, index) => (
            <ImageReveal key={item.title} direction="up" delay={index * 0.1}>
              <FadeUp delay={index * 0.1}>
                <div className={`group relative ${item.height} overflow-hidden`}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4 md:p-6">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-gold-light">
                      {item.location}
                    </p>
                    <h3 className="mt-1 font-serif text-lg md:text-xl">{item.title}</h3>
                  </div>
                </div>
              </FadeUp>
            </ImageReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
