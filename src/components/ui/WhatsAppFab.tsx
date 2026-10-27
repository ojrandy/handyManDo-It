'use client'

import { MessageCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  href: string
  label: string
}

// Floating WhatsApp button on every public page (FR-GLB-03). It appears once the visitor has
// scrolled past the first screen, so it never covers the hero CTAs or the hero's pause button.
// WhatsApp's darker brand teal keeps the white icon above 3:1 contrast (WCAG 1.4.11).
export function WhatsAppFab({ href, label }: Props) {
  const [visible, setVisible] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting))
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* One viewport tall from the top of the page: the button shows once this leaves view. */}
      <div
        ref={sentinelRef}
        aria-hidden
        className="pointer-events-none absolute top-0 h-dvh w-px"
      />
      <a
        href={href}
        aria-label={label}
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid size-14 place-items-center rounded-full bg-[#128c7e] text-white shadow-float transition-[opacity,transform] duration-300 hover:scale-105 md:right-8 md:bottom-8 ${
          visible ? 'opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <MessageCircle aria-hidden className="size-7" strokeWidth={2} />
      </a>
    </>
  )
}
