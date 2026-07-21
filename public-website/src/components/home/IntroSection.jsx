import FadeUp from '../ui/FadeUp'
import ImageReveal from '../ui/ImageReveal'
import Button from '../ui/Button'
import storyImage from '../../assets/images/home/home-story.webp'

/**
 * Intro welcome section with text left and portrait image right.
 */
export default function IntroSection() {
  return (
    <section className="pattern-diamond pt-36 pb-24 md:pt-44 md:pb-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-20">
        {/* Text content */}
        <FadeUp>
          <p className="mb-4 text-xs font-medium tracking-[0.3em] uppercase text-gold">
            Our Story
          </p>
          <h2 className="font-serif text-3xl leading-tight text-charcoal md:text-4xl lg:text-5xl">
            A Comfortable Guest House for Peaceful Stays
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-muted md:text-base">
            Jebal Guest House welcomes guests with clean rooms, a calm environment,
            and practical facilities for a relaxed stay. Our guest house is
            suitable for families, couples, and travelers looking for short or
            comfortable extended stays.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
            Each room is arranged with essential comforts such as air
            conditioning, television, free WiFi, attached bathrooms, parking,
            balcony space, and access to the garden area.
          </p>
          <Button to="/rooms" variant="outline" className="mt-8">
            Discover Our Rooms
          </Button>
        </FadeUp>

        {/* Portrait image */}
        <ImageReveal direction="right">
          <div className="relative mx-auto max-w-md lg:max-w-none">
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={storyImage}
                alt="Comfortable guest house interior"
                className="h-full w-full object-cover"
              />
            </div>
            {/* Decorative offset frame */}
            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full border border-gold/30" />
          </div>
        </ImageReveal>
      </div>
    </section>
  )
}
