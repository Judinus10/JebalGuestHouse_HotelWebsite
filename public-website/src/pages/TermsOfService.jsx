import PageTransition from '../components/layout/PageTransition'
import FadeUp from '../components/ui/FadeUp'
import SectionHeading from '../components/ui/SectionHeading'

export default function TermsOfService() {
  return (
    <PageTransition>
      <section className="relative flex h-[40vh] min-h-[300px] items-end bg-charcoal">
        <img
          src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1920&q=80"
          alt="Terms of service"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-12">
          <FadeUp>
            <p className="text-xs tracking-[0.3em] uppercase text-gold-light">
              Legal
            </p>
            <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
              Terms of Service
            </h1>
          </FadeUp>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeading
            subtitle="Guest Guidelines"
            title="Terms for Using Our Website and Services"
            description="These terms explain the basic conditions for using the Jebal Guest House website, enquiries, and reservation-related services."
          />

          <div className="space-y-10 text-sm leading-7 text-muted">
            <div>
              <h2 className="font-serif text-2xl text-charcoal">1. Website Use</h2>
              <p className="mt-3">
                This website is provided to share information about Jebal Guest House, room
                availability, services, gallery images, and contact options.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-charcoal">2. Enquiries and Reservations</h2>
              <p className="mt-3">
                Submitting an enquiry does not guarantee a booking. Reservations are
                confirmed only after our team verifies availability and provides confirmation.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-charcoal">3. Guest Responsibility</h2>
              <p className="mt-3">
                Guests are expected to provide accurate details, respect property rules,
                and communicate any changes to arrival plans or reservation needs.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-charcoal">4. Payments and Cancellations</h2>
              <p className="mt-3">
                Payment, refund, and cancellation conditions may vary depending on the
                booking type, stay period, and confirmation details shared by our team.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-charcoal">5. Updates to Terms</h2>
              <p className="mt-3">
                Jebal Guest House may update these terms when needed. Continued use of the
                website means you accept the latest version of these terms.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}