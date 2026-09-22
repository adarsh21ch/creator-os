import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-neutral-500">
        There's nothing at this address. Use the sidebar, or head back to the Library.
      </p>
      <Link
        to="/library"
        className="mt-4 inline-block rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
      >
        Go to Library
      </Link>
    </div>
  )
}
