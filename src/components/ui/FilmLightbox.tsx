'use client'

import { Play } from 'lucide-react'
import { useRef, useState, type ComponentType } from 'react'

import { buttonClasses } from './button'
import type { FilmDialogProps } from './FilmDialog'

type Props = {
  src: string
  poster: string
  labels: { open: string; title: string; close: string }
}

// "Watch the film" (FR-HOME-01). Only the button ships with the page; the dialog
// (./FilmDialog.tsx) is fetched on the first click and opened as soon as it arrives.
export function FilmLightbox({ src, poster, labels }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [Dialog, setDialog] = useState<ComponentType<FilmDialogProps> | null>(null)
  const [openSignal, setOpenSignal] = useState(0)

  const open = () =>
    import('./FilmDialog').then(({ FilmDialog }) => {
      setDialog(() => FilmDialog)
      setOpenSignal((count) => count + 1)
    })

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className={buttonClasses({ variant: 'ghost', size: 'lg' })}
      >
        <span className="grid size-10 place-items-center rounded-full border border-white/25">
          <Play aria-hidden className="size-4 translate-x-px fill-current" />
        </span>
        {labels.open}
      </button>
      {Dialog ? (
        <Dialog
          src={src}
          poster={poster}
          labels={labels}
          openSignal={openSignal}
          onClosed={() => triggerRef.current?.focus()}
        />
      ) : null}
    </>
  )
}
