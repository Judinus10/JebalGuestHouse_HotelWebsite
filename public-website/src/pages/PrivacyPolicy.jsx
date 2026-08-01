import PageTransition from '../components/layout/PageTransition'
import FadeUp from '../components/ui/FadeUp'
import SectionHeading from '../components/ui/SectionHeading'
import privacyBanner from '../assets/images/banners/privacy-banner.webp'

export default function PrivacyPolicy() {
  return (
    <PageTransition>
      <section className="relative flex h-[40vh] min-h-[300px] items-end bg-charcoal">
        <img
          src={privacyBanner}
          alt="Privacy policy"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          width="1942"
          height="809"
          fetchPriority="high"
        />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-12">
          <FadeUp>
            <p className="text-xs tracking-[0.3em] uppercase text-gold-light">
              Legal
            </p>
            <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
              Privacy Policy
            </h1>
          </FadeUp>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeading
            subtitle="Your Information"
            title="How We Handle Guest Data"
            description="This policy explains how Jebal Guest House collects and uses information when guests contact us, make enquiries, or use our website."
          />

          <div className="space-y-10 text-sm leading-7 text-muted">
            <div>
              <h2 className="font-serif text-2xl text-charcoal">1. Information We Collect</h2>
              <p className="mt-3">
                We may collect your name, phone number, email address, enquiry details,
                booking-related information, and messages submitted through our website.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-charcoal">2. How We Use Information</h2>
              <p className="mt-3">
                We use guest information to respond to enquiries, manage reservations,
                confirm availability, provide customer support, and improve our services.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-charcoal">3. Sharing Information</h2>
              <p className="mt-3">
                We do not sell guest information. Information may only be shared when
                required for reservation handling, legal compliance, payment processing,
                or guest service support.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-charcoal">4. Data Security</h2>
              <p className="mt-3">
                We take reasonable steps to protect guest information from unauthorized
                access, misuse, or disclosure. However, no online system is completely risk-free.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-charcoal">5. Contact</h2>
              <p className="mt-3">
                For privacy-related questions, please contact Jebal Guest House through the
                details provided on our contact page.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
