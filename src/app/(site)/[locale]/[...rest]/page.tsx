import { notFound } from 'next/navigation'

// Unknown paths under a locale land here so they get the localized not-found
// page (with the site layout) instead of Next's unstyled global 404.
export default function CatchAllPage() {
  notFound()
}
