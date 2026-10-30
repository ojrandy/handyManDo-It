import React from 'react'

import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs'
import { CmsImage } from '@/components/ui/CmsImage'
import type { ImageSource } from '@/lib/media'

type Props = {
  breadcrumbs: Crumb[]
  eyebrow?: string
  title: string
  // Set when the title is in another language than the page (English-only posts, ADR-019).
  titleLang?: string
  lead?: string
  image?: { sources: ImageSource[]; alt: string }
  // Calls to action under the lead.
  children?: React.ReactNode
}

// Dark top of every inner page: breadcrumbs, H1, lead, actions, optional photo. Dark so the
// transparent header reads the same as on the home hero. Labels the page's <main> via the H1.
export function PageHero({ breadcrumbs, eyebrow, title, titleLang, lead, image, children }: Props) {
  const photo = image?.sources.length ? image : null

  return (
    <section
      aria-labelledby="page-title"
      className="grain relative overflow-hidden bg-night-900 pt-28 pb-16 text-white md:pt-36 md:pb-24"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_70%_at_85%_0%,rgb(28_93_112/0.55),transparent_70%)]"
      />
      <div
        className={`container-site relative grid items-center gap-12 ${photo ? 'lg:grid-cols-[1.1fr_0.9fr]' : ''}`}
      >
        <div className="max-w-3xl">
          <Breadcrumbs items={breadcrumbs} />
          {eyebrow ? (
            <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-gold-300 uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1
            id="page-title"
            lang={titleLang}
            className="text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl"
          >
            {title}
          </h1>
          {lead ? <p className="mt-6 text-lg leading-relaxed text-white/80">{lead}</p> : null}
          {children ? (
            <div className="mt-9 flex flex-wrap items-center gap-4">{children}</div>
          ) : null}
        </div>
        {photo ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-panel shadow-float">
            <CmsImage
              sources={photo.sources}
              alt={photo.alt}
              fill
              preload
              fetchPriority="high"
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
