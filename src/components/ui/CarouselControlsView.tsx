import { ArrowLeft, ArrowRight } from 'lucide-react'

export type CarouselControlsProps = {
  // id of the scroll-snap track these buttons drive.
  trackId: string
  labels: { previous: string; next: string }
  // Number of slides: shows that many position dots, spread out against the buttons.
  dots?: number
}

type ViewProps = CarouselControlsProps & {
  current: number
  atStart: boolean
  atEnd: boolean
  onPrevious?: () => void
  onNext?: () => void
}

// Markup of the carousel buttons, without state or effects. The server renders it as the first
// state (NearView), and CarouselControls renders it again with handlers once its code has loaded
// near the view, so the swap changes nothing on screen.
export function CarouselControlsView({
  trackId,
  labels,
  dots = 0,
  current,
  atStart,
  atEnd,
  onPrevious,
  onNext,
}: ViewProps) {
  const button =
    'grid size-11 place-items-center rounded-full border border-teal-600/30 text-teal-700 transition-colors hover:bg-teal-600 hover:text-white disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className="flex items-center justify-between gap-4">
      {dots ? (
        // Decorative: the slides are all in the page, and the buttons say where they lead.
        <div aria-hidden className="flex items-center gap-1.5">
          {Array.from({ length: dots }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === current ? 'w-6 bg-teal-600' : 'w-1.5 bg-teal-600/25'
              }`}
            />
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={atStart}
          aria-controls={trackId}
          aria-label={labels.previous}
          className={button}
        >
          <ArrowLeft aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={atEnd}
          aria-controls={trackId}
          aria-label={labels.next}
          className={button}
        >
          <ArrowRight aria-hidden className="size-5" />
        </button>
      </div>
    </div>
  )
}
