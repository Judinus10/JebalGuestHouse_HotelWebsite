import propertyImage from '../assets/images/home/home-hero-01.webp'

export const SITE_URL = 'https://jebalguesthouse.com'

export const business = {
  name: 'Jebal Guest House',
  url: SITE_URL,
  telephone: '+31628324956',
  displayTelephone: '+31 6 28324956',
  email: 'info@jebalguesthouse.com',
  address: {
    streetAddress: 'Jebal Guest House, Uyarappulam, Anaiccoddai',
    addressLocality: 'Jaffna',
    addressRegion: 'Northern Province',
    addressCountry: 'LK',
  },
  mapUrl: 'https://maps.app.goo.gl/GnrBaQgFcBbVvpbb6',
  latitude: 9.700297,
  longitude: 80.003293,
  checkinTime: '14:00',
  checkoutTime: '12:00',
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

export function lodgingSchema() {
  return {
    '@context': 'https://schema.org', '@type': ['LodgingBusiness', 'LocalBusiness'],
    '@id': `${SITE_URL}/#lodging`, name: business.name, url: business.url,
    image: [new URL(propertyImage, window.location.origin).href],
    telephone: business.telephone, email: business.email, priceRange: business.priceRange,
    currenciesAccepted: 'USD', checkinTime: business.checkinTime, checkoutTime: business.checkoutTime,
    hasMap: business.mapUrl, address: { '@type': 'PostalAddress', ...business.address },
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
