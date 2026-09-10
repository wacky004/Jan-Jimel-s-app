import { Hero, ServiceProof, BookingSteps, Services, BusinessHistory, Contact, FinalQuoteCTA } from '../components/public/LandingSections'
import Rentals from '../components/public/Rentals'
import Gallery from '../components/public/Gallery'
import '../components/public/public.css'

export default function Landing() {
  return <div className="public-landing">
    <Hero />
    <ServiceProof />
    <Rentals />
    <BookingSteps />
    <Services />
    <Gallery />
    <BusinessHistory />
    <Contact />
    <FinalQuoteCTA />
  </div>
}
