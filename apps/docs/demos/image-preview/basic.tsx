import { ImagePreview, type PreviewImage } from '@fish-admin/react'

function gradientImage(from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="180" cy="180" r="120" fill="rgba(255,255,255,0.16)"/><circle cx="620" cy="440" r="170" fill="rgba(255,255,255,0.12)"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const IMAGES: PreviewImage[] = [
  {
    src: gradientImage('#0f766e', '#22d3ee'),
    alt: 'Teal dashboard with the new billing summary',
    caption: 'Billing overview',
  },
  {
    src: gradientImage('#4338ca', '#a855f7'),
    alt: 'Indigo screenshot of the usage chart',
    caption: 'Usage by plan',
  },
  {
    src: gradientImage('#b45309', '#fbbf24'),
    alt: 'Amber screenshot of the invoice list',
    caption: 'Invoice history',
  },
]

export default function ImagePreviewBasic() {
  return (
    <div className="fish-demo-stack" style={{ maxWidth: '34rem' }}>
      <ImagePreview images={IMAGES} ariaLabel="Release screenshots" />
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Each thumbnail is a button named by <code>ariaLabel</code>, the <code>alt</code> and the
        caption. The dialog steps through the set with the arrow buttons or the Arrow Left / Arrow
        Right keys, and wraps around at both ends.
      </p>
    </div>
  )
}
