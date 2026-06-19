import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react'
import PageTransition from '../components/layout/PageTransition'
import FadeUp from '../components/ui/FadeUp'
import SectionHeading from '../components/ui/SectionHeading'
import Button from '../components/ui/Button'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const CONTACT_API_URL = `${API_BASE_URL}/contact/submit_contact.php`

/**
 * Contact page with form, info, and map placeholder.
 */
export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errorMessage) setErrorMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    const name = formData.name.trim()
    const email = formData.email.trim()
    const message = formData.message.trim()

    if (!name || !email || !message) {
      setErrorMessage('Please complete your name, email, and message.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone: formData.phone.trim(),
          subject: formData.subject,
          message,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Could not send your message. Please try again.')
      }

      setSubmitted(true)
    } catch (error) {
      setErrorMessage(error.message || 'Could not send your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageTransition>
      {/* Page header */}
      <section className="relative flex h-[35vh] min-h-[250px] items-end bg-charcoal">
        <img
          src="https://images.unsplash.com/photo-1423666639043-560641683e4c?w=1920&q=80"
          alt="Contact us"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-12">
          <FadeUp>
            <p className="text-xs tracking-[0.3em] uppercase text-gold-light">
              Contact
            </p>
            <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
              Get In Touch
            </h1>
          </FadeUp>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            subtitle="We'd Love to Hear From You"
            title="Contact Our Team"
            description="Whether you're planning a stay, checking room availability, or simply have a question — our team is here to help."
          />

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Contact form */}
            <FadeUp>
              {submitted ? (
                <div className="flex h-full flex-col items-center justify-center bg-ice p-12 text-center">
                  <Send className="text-gold" size={40} />
                  <h3 className="mt-6 font-serif text-2xl text-charcoal">
                    Message Sent
                  </h3>
                  <p className="mt-3 text-sm text-muted">
                    Thank you for reaching out. Our team will respond as soon as
                    possible.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-8"
                    onClick={() => {
                      setSubmitted(false)
                      setErrorMessage('')
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        subject: 'General Inquiry',
                        message: '',
                      })
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-2 w-full border-b border-ice-dark bg-transparent py-3 text-sm outline-none focus:border-gold"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-2 w-full border-b border-ice-dark bg-transparent py-3 text-sm outline-none focus:border-gold"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="mt-2 w-full border-b border-ice-dark bg-transparent py-3 text-sm outline-none focus:border-gold"
                        placeholder="+94 77 000 0000"
                      />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">
                        Subject
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="mt-2 w-full border-b border-ice-dark bg-transparent py-3 text-sm outline-none focus:border-gold"
                      >
                        <option>General Inquiry</option>
                        <option>Room Reservation</option>
                        <option>Room Availability</option>
                        <option>Special Request</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs tracking-wider uppercase text-muted">
                      Message
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="mt-2 w-full resize-none border-b border-ice-dark bg-transparent py-3 text-sm outline-none focus:border-gold"
                      placeholder="Tell us about your inquiry..."
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  )}

                  <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </FadeUp>

            {/* Contact info + map */}
            <FadeUp delay={0.2}>
              <div className="space-y-8">
                <ul className="space-y-6">
                  {[
                    {
                      icon: MapPin,
                      title: 'Address',
                      text: 'Jebal Homes, Sri Lanka',
                    },
                    {
                      icon: Phone,
                      title: 'Phone',
                      text: '+94 77 000 0000',
                    },
                    {
                      icon: Mail,
                      title: 'Email',
                      text: 'reservations@jebalhomes.com',
                    },
                    {
                      icon: Clock,
                      title: 'Hours',
                      text: 'Daily · 7:00 AM – 10:00 PM',
                    },
                  ].map(({ icon: Icon, title, text }) => (
                    <li key={title} className="flex gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-ice text-gold">
                        <Icon size={20} />
                      </span>
                      <div>
                        <p className="text-xs tracking-wider uppercase text-muted">
                          {title}
                        </p>
                        <p className="mt-1 text-sm text-charcoal">{text}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Map placeholder */}
                <div className="relative aspect-[16/10] overflow-hidden bg-ice">
                  <img
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80"
                    alt="Location map"
                    className="h-full w-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white px-6 py-4 text-center shadow-md">
                      <MapPin className="mx-auto text-gold" size={24} />
                      <p className="mt-2 font-serif text-charcoal">Jebal Homes</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}