import propertyImage from '../assets/images/home/home-hero-01.webp'

export const SITE_URL = 'https://jebalguesthouse.com'

export const business = {
  name: 'Jebal Guest House',
  url: SITE_URL,
  telephone: '+31628324956',
  displayTelephone: '+31 6 28324956',
  secondaryTelephone: '+94779518657',
  displaySecondaryTelephone: '+94 77 951 8657',
  email: 'info@jebalguesthouse.com',
  address: {
    streetAddress: 'Old Church Road (near the RC School), Uyarappulam, Annaicoddai',
    addressLocality: 'Jaffna',
    addressRegion: 'Northern Province',
    addressCountry: 'LK',
  },
  mapUrl: 'https://maps.app.goo.gl/GnrBaQgFcBbVvpbb6',
  latitude: 9.700297,
  longitude: 80.003293,
  checkinTime: '12:00',
  checkoutTime: '11:00',
  priceRange: 'USD 20-30',
  amenities: ['Air conditioning', 'Kitchen', 'Refrigerator', 'Free Wi-Fi', 'Attached bathroom', 'Free parking'],
}

export const nearbyPlaces = [
  ['Jaffna Public Library', '5.7 km'], ['Jaffna Fort', '5.8 km'],
  ['Nallur Temple', '6 km'], ['Dambakola Patuna', '15 km'],
  ['KKS Beach', '16 km'], ['Keerimalai Springs', '16 km'],
  ['Casuarina Beach', '19 km'], ['Kayts Island Fort', '27 km'],
  ['Point Pedro Lighthouse', '36 km'], ['Nagadeepa Temple', '38 km'],
  ['Delft Island', '52 km'],
]

export function lodgingSchema(settings = {}) {
  const primaryPhone = settings.phone || business.telephone
  const secondaryPhone = settings.reception_contact_number || business.secondaryTelephone
  const address = settings.address || `${business.address.streetAddress}, ${business.address.addressLocality}, Sri Lanka`
  const mapUrl = settings.google_maps_url || business.mapUrl

  return {
    '@context': 'https://schema.org', '@type': ['LodgingBusiness', 'LocalBusiness'],
    '@id': `${SITE_URL}/#lodging`, name: business.name, url: business.url,
    image: [new URL(propertyImage, window.location.origin).href],
    telephone: primaryPhone, email: settings.email || business.email, priceRange: business.priceRange,
    currenciesAccepted: 'USD', checkinTime: business.checkinTime, checkoutTime: business.checkoutTime,
    hasMap: mapUrl, address: { '@type': 'PostalAddress', ...business.address, streetAddress: address },
    contactPoint: [primaryPhone, secondaryPhone].filter(Boolean).map((telephone) => ({ '@type': 'ContactPoint', telephone, contactType: 'reservations' })),
    geo: { '@type': 'GeoCoordinates', latitude: business.latitude, longitude: business.longitude },
    amenityFeature: business.amenities.map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
  }
}

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: `${SITE_URL}${item.path}`,
    })),
  }
}
