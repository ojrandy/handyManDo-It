'use client'

import { useEffect } from 'react'

type Props = {
  // id of the services section.
  id: string
}

// Same query as the `panels` variant in globals.css.
const PANELS =
  '(width < 48rem) and (height >= 34rem) and (prefers-reduced-motion: no-preference) and (scripting: enabled)'

// Runs the service panels on phones (FR-HOME-04, ADR-031). Every element with
// `data-for="<panel indexes>"` gets `data-current` while one of its panels is showing, so a CSS
// crossfade still runs them if GSAP fails to load. Panels next to the current one get `data-near`:
// the others wait outside the clipped track, which holds back their lazy photos.
export function ServicePanels({ id }: Props) {
  useEffect(() => {
    const root = document.getElementById(id)
    const wrapper = root?.querySelector<HTMLElement>('[data-panels-scroll]')
    const stage = root?.querySelector<HTMLElement>('[data-panels-stage]')
    if (!root || !wrapper || !stage) return
    const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')]
    const marked = [...root.querySelectorAll<HTMLElement>('[data-for]')]
    const last = panels.length - 1
    const media = window.matchMedia(PANELS)

    const show = (index: number) => {
      for (const element of marked) {
        const current = element.dataset.for?.split(' ').includes(String(index)) ?? false
        element.toggleAttribute('data-current', current)
      }
      panels.forEach((panel, i) => panel.toggleAttribute('data-near', Math.abs(i - index) <= 1))
    }

    const run = () => {
      const measure = () => {
        const top = parseFloat(getComputedStyle(stage).top) || 0
        return {
          // Where the stage sticks, in page coordinates, and how far it stays stuck.
          start: wrapper.getBoundingClientRect().top + window.scrollY - top,
          range: wrapper.offsetHeight - stage.offsetHeight,
        }
      }

      let frame = 0
      const onScroll = () => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          const { start, range } = measure()
          const progress = range > 0 ? (window.scrollY - start) / range : 0
          show(Math.round(Math.min(1, Math.max(0, progress)) * last))
        })
      }
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })

      // Keyboard and screen reader focus can land in a panel that isn't showing: bring it up.
      const onFocus = (event: FocusEvent) => {
        const panel = (event.target as HTMLElement).closest<HTMLElement>('[data-panel]')
        if (!panel || last === 0) return
        const index = panels.indexOf(panel)
        show(index)
        const { start, range } = measure()
        window.scrollTo({ top: start + (range * index) / last })
      }
      root.addEventListener('focusin', onFocus)

      let disposed = false
      let dispose: (() => void) | undefined
      const near = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return
          near.disconnect()
          import('./servicePanelsTimeline')
            .then(({ buildPanelsTimeline }) => {
              if (!disposed) dispose = buildPanelsTimeline(root, wrapper, stage)
            })
            // Offline or blocked: the CSS crossfade on `data-current` keeps the panels working.
            .catch(() => {})
        },
        { rootMargin: '100% 0px' },
      )
      near.observe(wrapper)

      return () => {
        disposed = true
        near.disconnect()
        cancelAnimationFrame(frame)
        window.removeEventListener('scroll', onScroll)
        root.removeEventListener('focusin', onFocus)
        dispose?.()
      }
    }

    let cleanup = media.matches ? run() : undefined
    const onChange = () => {
      cleanup?.()
      cleanup = media.matches ? run() : undefined
    }
    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
      cleanup?.()
    }
  }, [id])

  return null
}
