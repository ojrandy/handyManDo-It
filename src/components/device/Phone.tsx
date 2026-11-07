import React from 'react'

type Props = {
  children: React.ReactNode
  // Layer drawn above the screen content, e.g. notifications.
  overlay?: React.ReactNode
  // `hero` sizes itself from the viewport (the `phone-hero` utility in globals.css).
  size?: 'default' | 'hero'
  className?: string
}

const widths = {
  default: 'w-[16.5rem] sm:w-[18rem]',
  hero: 'phone-hero w-[18em]',
}

// CSS phone frame. Hook-free so server and client components can both render it. The frame is
// drawn in em, 1 rem unless `--phone-em` says otherwise, so a larger phone keeps its proportions.
// 18 × 37.5 em around the 0.625 em bezel leaves a screen of exactly 390:844, the captures' shape:
// a screenshot fills it uncropped, and the notch sits in the status bar captured with it (47 px).
export function Phone({ children, overlay, size = 'default', className = '' }: Props) {
  return (
    <div
      className={`relative aspect-[18/37.5] rounded-[3em] bg-night-950 p-[0.625em] [font-size:var(--phone-em,1rem)] shadow-float ring-1 ring-white/15 ${widths[size]} ${className}`}
    >
      <div className="relative h-full overflow-hidden rounded-[2.5em] bg-mist-50">
        <div className="absolute top-[0.5em] left-1/2 z-30 h-[1.5em] w-[6em] -translate-x-1/2 rounded-full bg-night-950" />
        {children}
        {/* Under the app's header, which stays readable above the notifications. */}
        {overlay ? (
          <div className="absolute inset-x-[0.625em] top-[4.875em] z-20">{overlay}</div>
        ) : null}
      </div>
    </div>
  )
}
