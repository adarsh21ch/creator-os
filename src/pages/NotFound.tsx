import { Link } from 'react-router-dom'
import { Button } from '../components/ui/primitives'

export function NotFoundPage() {
  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-white">Page not found</h1>
      <p className="mt-2 text-sm text-white/50">
        There's nothing at this address. Use the sidebar, or head back to the Library.
      </p>
      <Link to="/library" className="mt-4 inline-block">
        <Button>Go to Library</Button>
      </Link>
    </div>
  )
}
