'use client'

import { lazy, Suspense, useEffect, useRef, useState } from 'react'

import { Phone } from '@/components/device/Phone'

import type { DemoProps } from './DemoPhone'

const DemoPhone = lazy(() =>
  import('./DemoPhone').then(({ DemoPhone }) => ({ default: DemoPhone })),
)

// Loads the mini-demo's code only when the section nears the viewport (PLAN.md §9), so it costs
// nothing on first load. Until then an empty phone keeps the layout from shifting.
export function DemoLoader({ loading, ...props }: DemoProps & { loading: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

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

  const placeholder = (
    <Phone>
      <p className="grid h-full place-items-center px-6 text-center text-sm text-slate-500">
        {loading}
      </p>
    </Phone>
  )

  return (
    <div ref={ref}>
      {near ? (
        <Suspense fallback={placeholder}>
          <DemoPhone {...props} />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  )
}
