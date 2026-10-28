import { ImagePreview, type PreviewImage } from '@fish-admin/react'

function gradientImage(from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="900" height="620" fill="url(#g)"/><rect x="90" y="90" width="720" height="80" rx="12" fill="rgba(255,255,255,0.18)"/><rect x="90" y="210" width="460" height="26" rx="8" fill="rgba(255,255,255,0.22)"/><rect x="90" y="262" width="620" height="26" rx="8" fill="rgba(255,255,255,0.16)"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const RECEIPT: PreviewImage = {
  src: gradientImage('#1e293b', '#0ea5e9'),
  alt: 'Scanned receipt for the October workspace invoice',
}

export default function ImagePreviewSingle() {
  return (
    <div className="fish-demo-stack" style={{ gap: '1.25rem' }}>
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <p className="fish-demo-label" style={{ margin: 0 }}>
          Receipt on file
        </p>
        <ImagePreview images={[RECEIPT]} ariaLabel="Payment receipt" />
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          With one image the dialog shows no arrows and no counter, and the caption falls back to
          the <code>alt</code> text.
        </p>
      </div>
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <p className="fish-demo-label" style={{ margin: 0 }}>
          Archived receipts
        </p>
        <ImagePreview images={[]} ariaLabel="Archived receipts" />
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          An empty array renders the localized "No data" line instead of a grid.
        </p>
      </div>
    </div>
  )
}
