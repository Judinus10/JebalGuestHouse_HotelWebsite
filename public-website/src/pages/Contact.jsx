import { useEffect, useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from 'lucide-react'
import PageTransition from '../components/layout/PageTransition'
import FadeUp from '../components/ui/FadeUp'
import SectionHeading from '../components/ui/SectionHeading'
import Button from '../components/ui/Button'
import contactBanner from '../assets/images/banners/contact-banner.webp'

import { API_BASE_URL } from '@/services/config'
const CONTACT_API_URL = `${API_BASE_URL}/contact/submit_contact.php`
const CONTACT_SETTINGS_API_URL = `${API_BASE_URL}/settings/get-contact.php`
const CONTACT_SUBMIT_TIMEOUT_MS = 8000

const fallbackContactDetails = {
  address: 'Old Church Road (near the RC School)\nUyarappulam\nAnnaicoddai\nJaffna\nSri Lanka',
  phone: '+31 6 28324956',
  reception_contact_number: '+94 77 951 8657',
  whatsapp_reservation_number: '+94 77 951 8657',
  email: 'info@jebalguesthouse.com',
  business_hours: 'Check-in 12:00 PM · Check-out 11:00 AM',
  business_name: 'Jebal Guest House',
  map_embed_url: '',
  google_maps_url: '',
}

function whatsappHref(number) {
  return `https://wa.me/${String(number || '').replace(/[^\d]/g, '')}?text=${encodeURIComponent(
    'Hello Jebal Guest House, I want to make an enquiry.'
  )}`
}

export default function Contact() {
  const [contactDetails, setContactDetails] = useState(fallbackContactDetails)
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

  useEffect(() => {
    let active = true

    async function loadContactDetails() {
      try {
        const response = await fetch(CONTACT_SETTINGS_API_URL, {
          headers: { Accept: 'application/json' },
        })

        const result = await response.json().catch(() => null)

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Could not load contact settings.')
        }

        if (active) {
          setContactDetails({
            ...fallbackContactDetails,
            ...(result.data || {}),
          })
        }
      } catch (error) {
        console.warn('Using fallback contact details:', error)
      }
    }

    loadContactDetails()
    return () => {
      active = false
    }
  }, [])

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
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), CONTACT_SUBMIT_TIMEOUT_MS)

      const response = await fetch(CONTACT_API_URL, {
        method: 'POST',
        signal: controller.signal,
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

      window.clearTimeout(timeoutId)

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Could not send your message. Please try again.')
      }

      setSubmitted(true)
    } catch (error) {
      const isTimeout = error?.name === 'AbortError'
      setErrorMessage(isTimeout ? 'The server is taking too long to respond. Please do not submit again immediately; your enquiry may already be saved.' : (error.message || 'Could not send your message. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="contact-page overflow-x-hidden">
        <section className="relative flex h-[40vh] min-h-[300px] items-end bg-charcoal">
          <img
            src={contactBanner}
            alt="Contact us"
            className="absolute inset-0 h-full w-full object-cover opacity-50"
            width="1942"
            height="809"
            fetchPriority="high"
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
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <SectionHeading
              subtitle="We'd Love to Hear From You"
              title="Contact Our Team"
              description="Whether you're planning a stay, checking room availability, or simply have a question — our team is here to help."
            />

            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
              <FadeUp>
                {submitted ? (
                  <div className="flex h-full flex-col items-center justify-center bg-ice p-8 text-center md:p-12">
                    <Send className="text-gold" size={40} />
                    <h3 className="mt-6 font-serif text-2xl text-charcoal">
                      Message Received
                    </h3>
                    <p className="mt-3 text-sm text-muted">
                      Your message has been received successfully. Our team will respond as soon as possible.
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
                          <option>WhatsApp Enquiry</option>
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

                    <div className="contact-actions flex w-full flex-col gap-4 sm:flex-row">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-[260px]"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </Button>

                      {contactDetails.whatsapp_reservation_number && (
                        <a
                          href={whatsappHref(contactDetails.whatsapp_reservation_number)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex w-full items-center justify-center gap-2 bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-700 sm:flex-1"
                        >
                          <MessageCircle size={18} />
                          WhatsApp Enquiry
                        </a>
                      )}
                    </div>
                  </form>
                )}
              </FadeUp>

              <FadeUp delay={0.2}>
                <div className="space-y-8">
                  <ul className="space-y-6">
                    {[
                      { icon: MapPin, title: 'Address', text: contactDetails.address },
                      { icon: Phone, title: 'Main Phone', text: contactDetails.phone },
                      {
                        icon: Phone,
                        title: 'Secondary Phone',
                        text: contactDetails.reception_contact_number,
                      },
                      { icon: Mail, title: 'Email', text: contactDetails.email },
                      { icon: Clock, title: 'Hours', text: contactDetails.business_hours },
                    ]
                      .filter((item) => item.text)
                      .map(({ icon: Icon, title, text }) => (
                        <li key={title} className="flex gap-4">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-ice text-gold">
                            <Icon size={20} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs tracking-wider uppercase text-muted">
                              {title}
                            </p>
                            <p className="mt-1 whitespace-pre-line break-words text-sm text-charcoal">
                              {text}
                            </p>
                          </div>
                        </li>
                      ))}
                  </ul>

                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-ice sm:aspect-[16/10]">
                    {contactDetails.map_embed_url ? (
                      <iframe
                        src={contactDetails.map_embed_url}
                        title={`${contactDetails.business_name} map`}
                        className="h-full w-full border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <>
                        <img
                          src={contactBanner}
                          alt="Location map"
                          className="h-full w-full object-cover opacity-50"
                          width="1942"
                          height="809"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white px-6 py-4 text-center shadow-md">
                            <MapPin className="mx-auto text-gold" size={24} />
                            <p className="mt-2 font-serif text-charcoal">
                              {contactDetails.business_name}
                            </p>
                            {contactDetails.google_maps_url && <a href={contactDetails.google_maps_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-gold underline">Open in Google Maps</a>}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {contactDetails.google_maps_url && contactDetails.map_embed_url && (
                    <a href={contactDetails.google_maps_url} target="_blank" rel="noreferrer" className="inline-flex text-sm font-medium text-gold underline">Open in Google Maps</a>
                  )}
                </div>
              </FadeUp>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
