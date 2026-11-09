import { X } from 'lucide-react'
import { randomUUID } from 'node:crypto'

import { buttonClasses, type ButtonSize, type ButtonVariant } from './button'

type Props = {
  label: string
  webAppUrl: string
  qrSvg: string
  labels: { qrTitle: string; qrBody: string; qrAlt: string; orUseWeb: string; close: string }
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

// Smart "Get the app" (FR-GLB-04) with no client JS (home JS budget, NFR-PERF-02). Touch screens
// get a link to /download, which sends Android to Google Play and iPhone to the App Store (or the
// web app) on the server, with the campaign tags. Computers (mouse + hover, `pointer-fine`) get a
// button that opens the QR popover through the native popover attribute. Both are in the HTML;
// CSS shows one. `display: contents` wrappers keep the button's own classes (e.g. flex-1) working
// in the parent layout.
export function GetTheAppButton({
  label,
  webAppUrl,
  qrSvg,
  labels,
  variant = 'primary',
  size = 'md',
  className = '',
}: Props) {
  // Several of these can share a page (header, bands); each popover needs its own id.
  const popoverId = `get-the-app-${randomUUID().slice(0, 8)}`
  const classes = buttonClasses({ variant, size, className })

  return (
    <>
      <span className="contents pointer-fine:hidden">
        {/* /download is a route handler that redirects to a store, not a page: a full request,
            never a client navigation or a prefetch. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/download" className={classes}>
          {label}
        </a>
      </span>
      <span className="hidden pointer-fine:contents">
        <button type="button" popoverTarget={popoverId} className={classes}>
          {label}
        </button>
        <div
          id={popoverId}
          popover="auto"
          data-track-view="qr_view"
          aria-label={labels.qrTitle}
          className="m-auto w-[min(22rem,calc(100vw-2rem))] rounded-panel bg-white p-6 text-ink shadow-float backdrop:bg-night-950/60 backdrop:backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="font-display text-xl font-semibold text-teal-700">{labels.qrTitle}</p>
            <button
              type="button"
              popoverTarget={popoverId}
              popoverTargetAction="hide"
              aria-label={labels.close}
              className="-m-2 grid size-11 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-mist-100 hover:text-ink"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">{labels.qrBody}</p>
          <div
            role="img"
            aria-label={labels.qrAlt}
            className="mx-auto mt-5 w-48 [&>svg]:h-auto [&>svg]:w-full"
            // Trusted markup: generated on the server by the qrcode library from a fixed URL.
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <a
            href={webAppUrl}
            className="mt-5 block text-center text-sm font-semibold text-teal-600 underline-offset-4 hover:underline"
          >
            {labels.orUseWeb}
          </a>
        </div>
      </span>
    </>
  )
}
