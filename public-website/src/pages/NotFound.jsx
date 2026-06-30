import { Link } from 'react-router-dom'
import PageTransition from '../components/layout/PageTransition'
import FadeUp from '../components/ui/FadeUp'

export default function NotFound() {
  return (
    <PageTransition>
      <section className="relative flex min-h-[70vh] items-center bg-white py-24">
        <div className="mx-auto w-full max-w-4xl px-6 text-center">
          <FadeUp>
            <p className="text-xs tracking-[0.35em] uppercase text-gold">
              404
            </p>
            <h1 className="mt-4 font-serif text-4xl text-charcoal md:text-6xl">
              Page Not Found
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted md:text-base">
              The page you are looking for does not exist or may have been moved.
              Please return to the homepage or continue browsing our rooms.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/"
                className="inline-flex min-w-[160px] items-center justify-center rounded-full bg-charcoal px-6 py-3 text-sm font-medium text-white transition hover:bg-black"
              >
                Go Home
              </Link>
              <Link
                to="/rooms"
                className="inline-flex min-w-[160px] items-center justify-center rounded-full border border-gold px-6 py-3 text-sm font-medium text-charcoal transition hover:bg-gold hover:text-white"
              >
                View Rooms
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </PageTransition>
  )
}
