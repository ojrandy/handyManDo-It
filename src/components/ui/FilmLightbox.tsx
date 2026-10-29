'use client'

import { Play, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { buttonClasses } from './button'

type Props = {
  src: string
  poster: string
  labels: { open: string; title: string; close: string }
}

// Brand film in a native modal <dialog>: focus is contained, Esc closes, and the video is
// only requested when the visitor asks for it (preload="none"). So is the poster: a 100 KB image
// next to the hero would compete with its LCP image for bandwidth.
export function FilmLightbox({ src, poster, labels }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [opened, setOpened] = useState(false)

  const open = () => {
    setOpened(true)
    dialogRef.current?.showModal()
    videoRef.current?.play().catch(() => {})
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        className={buttonClasses({ variant: 'ghost', size: 'lg', className: 'sm:ml-2' })}
      >
        <span className="grid size-10 place-items-center rounded-full border border-white/25">
          <Play aria-hidden className="size-4 translate-x-px fill-current" />
        </span>
        {labels.open}
      </button>
      <dialog
        ref={dialogRef}
        aria-label={labels.title}
        onClose={() => {
          videoRef.current?.pause()
          triggerRef.current?.focus()
        }}
        onClick={(event) => {
          // A click on the backdrop lands on the dialog element itself.
          if (event.target === event.currentTarget) dialogRef.current?.close()
        }}
        className="m-auto w-[min(64rem,calc(100vw-2rem))] max-w-none overflow-visible bg-transparent p-0 backdrop:bg-night-950/85 backdrop:backdrop-blur-sm"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={labels.close}
            className="absolute -top-14 right-0 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X aria-hidden className="size-5" />
          </button>
          <video
            ref={videoRef}
            controls
            playsInline
            preload="none"
            poster={opened ? poster : undefined}
            className="aspect-video w-full rounded-panel bg-black shadow-float"
          >
            <source src={src} type="video/mp4" />
          </video>
        </div>
      </dialog>
    </>
  )
}
