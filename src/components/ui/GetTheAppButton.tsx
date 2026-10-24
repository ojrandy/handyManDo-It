'use client'

import { X } from 'lucide-react'
import { useId, useSyncExternalStore } from 'react'

import { buttonClasses, type ButtonSize, type ButtonVariant } from './button'

type Platform = 'unknown' | 'android' | 'ios' | 'desktop'

type Props = {
  label: string
  playStoreUrl: string
  appStoreUrl: string
  webAppUrl: string
  qrSvg: string
  labels: { qrTitle: string; qrBody: string; qrAlt: string; orUseWeb: string; close: string }
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  // iPadOS reports itself as a Mac; touch support tells them apart.
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
    return 'ios'
  }
  return 'desktop'
}

// The platform never changes during a visit, so there is nothing to subscribe to.
const subscribeNever = () => () => {}

// Smart "Get the app" (FR-GLB-04): Android → Play, iOS → App Store if set else the web app,
// desktop → QR popover. Renders a plain Play link until hydrated, so it works without JS.
export function GetTheAppButton({
  label,
  playStoreUrl,
  appStoreUrl,
  webAppUrl,
  qrSvg,
  labels,
  variant = 'primary',
  size = 'md',
  className = '',
}: Props) {
  const platform = useSyncExternalStore<Platform>(subscribeNever, detectPlatform, () => 'unknown')
  const popoverId = useId()
  const classes = buttonClasses({ variant, size, className })

  if (platform !== 'desktop') {
    const href = platform === 'ios' ? appStoreUrl || webAppUrl : playStoreUrl
    return (
      <a href={href} className={classes}>
        {label}
      </a>
    )
  }

  return (
    <>
      <button type="button" popoverTarget={popoverId} className={classes}>
        {label}
      </button>
      <div
        id={popoverId}
        popover="auto"
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
    </>
  )
}
