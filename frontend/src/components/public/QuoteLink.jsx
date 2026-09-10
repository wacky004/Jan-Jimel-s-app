import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function QuoteLink({ children = 'Request a Quote', ...props }) {
  return <Link {...props} to="/quote" className="public-action public-action-gold">{children}<ArrowUpRight size={18} aria-hidden="true" /></Link>
}
