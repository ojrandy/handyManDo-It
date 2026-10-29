import { notFound } from 'next/navigation'

// Unknown paths under a locale land here so they get the localized not-found
// page (with the site layout) instead of Next's unstyled global 404.
// The layout sets dynamicParams = false for the locale; any path is allowed here.
export const dynamicParams = true

export default function CatchAllPage() {
  notFound()
}
