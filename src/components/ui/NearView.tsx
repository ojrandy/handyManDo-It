'use client'

import {
  lazy,
  useCallback,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent,
  type ReactNode,
} from 'react'

import type { CarouselControlsProps } from './CarouselControlsView'
import type { CoverflowProps } from './CoverflowView'

// Islands far down the home page: their code loads only when they near the viewport, so it stays
// out of the first load (NFR-PERF-02, ADR-034). Each has a server-rendered view of its first state
// (`children`) shown until then, so the HTML, the layout and no-JS visitors see the same thing.
const islands = {
  coverflow: lazy(() => import('./Coverflow').then((m) => ({ default: m.Coverflow }))),
  carouselControls: lazy(() =>
    import('./CarouselControls').then((m) => ({ default: m.CarouselControls })),
  ),
}

type IslandProps = {
  coverflow: CoverflowProps
  carouselControls: CarouselControlsProps
}

type Props<K extends keyof IslandProps> = {
  island: K
  props: IslandProps[K]
  // The island's first state, rendered on the server.
  children: ReactNode
  // Layout of the wrapper. A wrapper hidden by CSS never loads its island.
  className?: string
}

// Mounts in the same commit as the island (same Suspense boundary), so its effect means the
// island's buttons are live.
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady])
  return null
}

export function NearView<K extends keyof IslandProps>({
  island,
  props,
  children,
  className,
}: Props<K>) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const ready = useRef(false)
  // Index of a button pressed before the island arrived, to press again once it has.
  const pending = useRef<number | null>(null)

  const buttons = () => [...(ref.current?.querySelectorAll('button') ?? [])]

  // A fast scroll and tap can beat the code: hold the click, load now, replay it on the real
  // button (same markup, same order), so an early press is never lost.
  const onClickCapture = (event: MouseEvent) => {
    if (ready.current) return
    const button = (event.target as Element).closest('button')
    if (!button) return
    event.preventDefault()
    event.stopPropagation()
    pending.current = buttons().indexOf(button)
    setNear(true)
  }

  const onReady = useCallback(() => {
    ready.current = true
    const index = pending.current
    pending.current = null
    if (index !== null && index >= 0) buttons()[index]?.click()
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setNear(true)
        observer.disconnect()
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const Island = islands[island] as unknown as ComponentType<IslandProps[K]>
  return (
    <div ref={ref} className={className} onClickCapture={onClickCapture}>
      {near ? (
        <Suspense fallback={children}>
          <Island {...props} />
          <Ready onReady={onReady} />
        </Suspense>
      ) : (
        children
      )}
    </div>
  )
}
