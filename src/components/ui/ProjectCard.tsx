import { MapPin } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { asMedia, imageSources } from '@/lib/media'
import type { Project } from '@/payload-types'

import { CmsImage } from './CmsImage'

// Portfolio tile: the cover at its own aspect ratio (masonry), title, service and city. The
// whole card is the link to the case study.
export function ProjectCard({ project }: { project: Project }) {
  const cover = asMedia(project.cover)
  const service = typeof project.service === 'object' ? project.service.title : null

  return (
    <Link
      href={{ pathname: '/our-work/[slug]', params: { slug: project.slug } }}
      className="group block overflow-hidden rounded-panel bg-white shadow-sm ring-1 ring-mist-200 transition-shadow hover:shadow-float"
    >
      {cover ? (
        <span className="block overflow-hidden bg-night-900">
          <CmsImage
            sources={imageSources(cover)}
            alt={cover.alt}
            width={cover.width ?? 750}
            height={cover.height ?? 500}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-auto w-full transition-transform duration-700 ease-out-expo group-hover:scale-105"
          />
        </span>
      ) : null}
      <span className="block p-5">
        <span className="block font-display text-lg font-semibold text-teal-700">
          {project.title}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
          {service ? <span>{service}</span> : null}
          {project.city ? (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-4" />
              {project.city}
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  )
}
