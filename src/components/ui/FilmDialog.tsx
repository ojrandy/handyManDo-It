'use client'

import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

export type FilmDialogProps = {
  src: string
  poster: string
  labels: { title: string; close: string }
  // Changes on every click of the trigger: opens the dialog.
  openSignal: number
  onClosed: () => void
}

// The brand film's native modal <dialog>: focus is contained, Esc closes. Its own chunk, fetched
// on the first click of "Watch the film" (home JS budget, NFR-PERF-02); the video and poster are
// only requested then too, so neither competes with the hero's LCP image.
export function FilmDialog({ src, poster, labels, openSignal, onClosed }: FilmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!openSignal || dialogRef.current?.open) return
    dialogRef.current?.showModal()
    videoRef.current?.play().catch(() => {})
  }, [openSignal])

  return (
    <dialog
      ref={dialogRef}
      aria-label={labels.title}
      onClose={() => {
        videoRef.current?.pause()
        onClosed()
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
          data-track-play="film"
          controls
          playsInline
          preload="none"
          poster={poster}
          className="aspect-video w-full rounded-panel bg-black shadow-float"
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>
    </dialog>
  )
}
