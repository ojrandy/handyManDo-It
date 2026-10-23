import React from 'react'

import { Link } from '@/i18n/navigation'
import { site } from '@/lib/site'

type Props = {
  eyebrow: string
  title: string
  body: string
  homeLabel: string
  whatsappLabel: string
  // Extra action, e.g. the "try again" button of the error boundary.
  action?: React.ReactNode
}

// Shared body of the 404 and error pages. Hook-free so both the server
// not-found page and the client error boundary can render it.
export function StatusMessage({ eyebrow, title, body, homeLabel, whatsappLabel, action }: Props) {
  return (
    <main id="main" className="grain flex min-h-dvh items-center bg-night-900 py-16 text-white">
      <div className="container-site">
        <p className="mb-6 text-sm font-medium tracking-[0.2em] text-gold-300 uppercase">
          {eyebrow}
        </p>
        <h1 className="max-w-3xl text-4xl leading-[1.1] font-bold sm:text-5xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{body}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          {action}
          <Link
            href="/"
            className="rounded-full bg-gold-500 px-7 py-3.5 font-semibold text-night-900 shadow-glow transition-colors hover:bg-gold-300"
          >
            {homeLabel}
          </Link>
          <a
            href={site.whatsappUrl}
            className="rounded-full border border-white/20 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
          >
            {whatsappLabel}
          </a>
        </div>
      </div>
    </main>
  )
}
