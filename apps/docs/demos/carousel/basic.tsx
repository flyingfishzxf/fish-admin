import { Carousel, type CarouselSlide } from '@fish-admin/react'

function gradientImage(from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 350"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="800" height="350" fill="url(#g)"/><circle cx="150" cy="90" r="80" fill="rgba(255,255,255,0.16)"/><circle cx="660" cy="280" r="120" fill="rgba(255,255,255,0.12)"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const SLIDES: CarouselSlide[] = [
  {
    id: 'onboarding',
    title: 'Guided onboarding is live',
    description: 'New workspaces get a checklist instead of an empty dashboard.',
    image: gradientImage('#0f766e', '#22d3ee'),
    alt: 'Teal gradient cover for the onboarding announcement',
  },
  {
    id: 'roles',
    title: 'Custom roles',
    description: 'Grant billing and audit scopes without making everyone an admin.',
    image: gradientImage('#4338ca', '#a855f7'),
    alt: 'Indigo gradient cover for the custom roles announcement',
  },
  {
    id: 'audit',
    title: 'Audit export',
    description: 'Download 90 days of activity as CSV from the security page.',
    image: gradientImage('#b45309', '#fbbf24'),
    alt: 'Amber gradient cover for the audit export announcement',
  },
]

export default function CarouselBasic() {
  return (
    <div style={{ width: '100%', maxWidth: '32rem' }}>
      <Carousel
        slides={SLIDES}
        ariaLabel="Product announcements"
        previousLabel="Previous announcement"
        nextLabel="Next announcement"
        goToLabel={(index) => `Go to announcement ${index}`}
      />
    </div>
  )
}
