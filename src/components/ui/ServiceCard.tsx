import { ArrowUpRight, Wrench } from 'lucide-react'
import { createElement } from 'react'

import { Link } from '@/i18n/navigation'
import { asMedia, imageSources } from '@/lib/media'
import type { Service } from '@/payload-types'

import { CmsImage } from './CmsImage'
import { iconFor } from './icons'

// Service tile for the services index and "other services": photo when there is one, otherwise
// the service icon. The whole card is the link.
export function ServiceCard({ service, price }: { service: Service; price: string }) {
  const photo = imageSources(service.heroImage)

  return (
    <Link
      href={{ pathname: '/services/[slug]', params: { slug: service.slug } }}
      className="group flex h-full flex-col overflow-hidden rounded-panel bg-white shadow-sm ring-1 ring-mist-200 transition-shadow hover:shadow-float"
    >
      <span className="relative block aspect-[16/10] overflow-hidden bg-night-900">
        {photo.length ? (
          <CmsImage
            sources={photo}
            alt={asMedia(service.heroImage)?.alt ?? ''}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center bg-[radial-gradient(80%_90%_at_100%_0%,rgb(28_93_112/0.7),transparent_70%)]"
          >
            {/* iconFor returns a module-level Lucide component, not one created here. */}
            {createElement(iconFor(service.icon, Wrench), {
              className: 'size-14 text-gold-300',
              strokeWidth: 1.25,
            })}
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col p-6">
        <span className="flex items-start justify-between gap-3">
          <span className="font-display text-xl font-semibold text-teal-700">{service.title}</span>
          <ArrowUpRight
            aria-hidden
            className="mt-1 size-5 shrink-0 text-teal-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
        <span className="mt-2 block flex-1 text-slate-500">{service.summary}</span>
        <span className="mt-4 block text-sm font-semibold text-teal-600">{price}</span>
      </span>
    </Link>
  )
}
