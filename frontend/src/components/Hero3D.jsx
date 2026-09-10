import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { Button } from './ui'
import useMediaQuery from '../hooks/useMediaQuery'
import { galleryPhotos } from './public/galleryData'

const HeroScene = lazy(() => import('./public/HeroScene'))

function StaticHero() {
  const photo = galleryPhotos[19]
  return <img className="public-hero-photo" src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} fetchPriority="high" />
}

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <StaticHero /> : this.props.children }
}

export default function Hero3D() {
  const desktop = useMediaQuery('(min-width: 1024px) and (pointer: fine)')
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [tabVisible, setTabVisible] = useState(() => !document.hidden)
  const container = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 })
    observer.observe(container.current)
    const onVisibility = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])

  const animate = desktop && !reduced && !paused && visible && tabVisible
  return <div ref={container} className="public-hero-visual">
    <div className="public-hero-media">
      {animate ? <SceneBoundary><Suspense fallback={<StaticHero />}><div className="public-hero-canvas" aria-hidden="true"><HeroScene /></div></Suspense></SceneBoundary> : <StaticHero />}
    </div>
    <div className="public-hero-caption"><span>Made for gathering.</span>{desktop && !reduced && <Button variant="secondary" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}{paused ? 'Play animation' : 'Pause animation'}</Button>}</div>
  </div>
}
