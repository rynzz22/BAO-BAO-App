import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-primary-50 flex items-center justify-center mb-6">
        <MapPin size={28} className="text-primary-400" />
      </div>
      <h1 className="font-display font-bold text-3xl text-ink mb-2">Page not found</h1>
      <p className="text-ink-secondary mb-6 max-w-xs">
        Looks like this route doesn't exist. Head back to get a ride.
      </p>
      <Button variant="primary" size="lg" onClick={() => navigate('/app')}>
        Back to Home
      </Button>
    </div>
  )
}
