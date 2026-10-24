import React from 'react'

type Props = {
  children: React.ReactNode
  // Layer drawn above the screen content, e.g. notifications.
  overlay?: React.ReactNode
  className?: string
}

// CSS phone frame. Hook-free so server and client components can both render it.
export function Phone({ children, overlay, className = '' }: Props) {
  return (
    <div
      className={`relative aspect-[9/19.5] w-[16.5rem] rounded-[3rem] bg-night-950 p-2.5 shadow-float ring-1 ring-white/15 sm:w-[18rem] ${className}`}
    >
      <div className="relative h-full overflow-hidden rounded-[2.5rem] bg-mist-50">
        <div className="absolute top-2 left-1/2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-night-950" />
        {children}
        {overlay ? <div className="absolute inset-x-2.5 top-11 z-20">{overlay}</div> : null}
      </div>
    </div>
  )
}
