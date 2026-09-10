import { useState } from 'react'
import { ArrowLeft, ArrowRight, Expand } from 'lucide-react'
import { Button, Dialog } from '../ui'
import { galleryPhotos } from './galleryData'

export default function Gallery() {
  const [index, setIndex] = useState(null)
  const photo = index === null ? null : galleryPhotos[index]
  const move = (step) => setIndex((value) => (value + step + galleryPhotos.length) % galleryPhotos.length)
  return <section id="gallery" tabIndex={-1} className="public-section" aria-labelledby="gallery-heading">
    <div className="public-shell">
      <div className="public-section-heading"><p className="public-eyebrow">From our photo album</p><h2 id="gallery-heading">Real spaces. Real celebrations.</h2><p>Explore the tables, details and event setups in the Jan &amp; Jimels collection.</p></div>
      <div className="public-gallery-grid">{galleryPhotos.map((item, i) => <button type="button" key={item.src} onClick={() => setIndex(i)} className="public-gallery-tile" aria-label={`View photo ${i + 1}: ${item.alt}`}>
        <img src={item.src} alt={item.alt} width={item.width} height={item.height} loading="lazy" />
        <span className="public-gallery-caption"><span>{String(i + 1).padStart(2, '0')}</span><Expand size={18} aria-hidden="true" /></span>
      </button>)}</div>
    </div>
    <Dialog open={photo !== null} onClose={() => setIndex(null)} title="Event gallery" description="Use the Previous and Next buttons or Left and Right arrow keys to browse." closeLabel="Close gallery" className="public-lightbox"
      onKeyDown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1) } }}
      footer={<><Button variant="secondary" onClick={() => move(-1)}><ArrowLeft size={18} aria-hidden="true" />Previous</Button><Button variant="secondary" onClick={() => move(1)}>Next<ArrowRight size={18} aria-hidden="true" /></Button></>}>
      {photo && <figure><img key={photo.src} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} /><figcaption aria-live="polite" aria-atomic="true">Photo {index + 1} of {galleryPhotos.length}. {photo.alt}.</figcaption></figure>}
    </Dialog>
  </section>
}
