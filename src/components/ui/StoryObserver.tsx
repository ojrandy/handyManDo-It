'use client'

import { useEffect } from 'react'

type Props = {
  // id of the scroll story section.
  id: string
}

// Same query as the `pinned` variant in globals.css.
const PINNED =
  '(min-width: 48rem) and (prefers-reduced-motion: no-preference) and (scripting: enabled)'

// How long each swipe card stays before the next one slides in (owner, 2026-11-10).
const ADVANCE_MS = 10_000

// Runs the scroll story (FR-HOME-07, ADR-030). Every element with `data-for="<chapter indexes>"`
// gets `data-current` while one of its chapters is showing; CSS alone can run the story from that,
// so it still works if GSAP fails to load. When pinned, it also sizes the phone to the stage, so the
// phone and the picture line up exactly, and loads the GSAP timeline as the section nears the view.
export function StoryObserver({ id }: Props) {
  useEffect(() => {
    const root = document.getElementById(id)
    const track = root?.querySelector<HTMLElement>('[data-story-track]')
    const wrapper = root?.querySelector<HTMLElement>('[data-story-scroll]')
    const stage = root?.querySelector<HTMLElement>('[data-story-stage]')
    const fit = root?.querySelector<HTMLElement>('[data-story-fit]')
    const phone = root?.querySelector<HTMLElement>('[data-story-phone]')
    if (!root || !track || !wrapper || !stage || !fit || !phone) return
    const chapters = [...track.querySelectorAll<HTMLElement>('[data-story-chapter]')]
    const marked = [...root.querySelectorAll<HTMLElement>('[data-for]')]
    const media = window.matchMedia(PINNED)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)')

    const show = (index: number) => {
      for (const element of marked) {
        const current = element.dataset.for?.split(' ').includes(String(index)) ?? false
        element.toggleAttribute('data-current', current)
      }
    }

    const pinned = () => {
      // The phone's screens are drawn in px, so `zoom` is what scales it. Measured, not assumed, so
      // its height matches the picture column to the pixel whatever the frame's proportions.
      const resize = new ResizeObserver(() => {
        const current = parseFloat(getComputedStyle(phone).zoom) || 1
        const natural = phone.getBoundingClientRect().height / current
        if (natural > 0) root.style.setProperty('--story-zoom', String(fit.clientHeight / natural))
      })
      resize.observe(fit)

      let frame = 0
      const onScroll = () => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          const top = parseFloat(getComputedStyle(stage).top) || 0
          const range = wrapper.offsetHeight - stage.offsetHeight
          const progress = (top - wrapper.getBoundingClientRect().top) / range
          const clamped = Math.min(1, Math.max(0, progress))
          show(Math.round(clamped * (chapters.length - 1)))
        })
      }
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })

      // Keyboard and screen reader focus can land in a chapter that isn't showing: bring it up.
      const onFocus = (event: FocusEvent) => {
        const chapter = (event.target as HTMLElement).closest<HTMLElement>('[data-story-chapter]')
        if (!chapter) return
        const top = parseFloat(getComputedStyle(stage).top) || 0
        const range = wrapper.offsetHeight - stage.offsetHeight
        const start = wrapper.getBoundingClientRect().top + window.scrollY - top
        const share = chapters.indexOf(chapter) / (chapters.length - 1)
        window.scrollTo({ top: start + range * share })
      }
      track.addEventListener('focusin', onFocus)

      let disposed = false
      let dispose: (() => void) | undefined
      const near = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return
          near.disconnect()
          import('./storyTimeline')
            .then(({ buildStoryTimeline }) => {
              if (!disposed) dispose = buildStoryTimeline(root, wrapper, stage)
            })
            // Offline or blocked: the CSS crossfade on `data-current` keeps the story working.
            .catch(() => {})
        },
        { rootMargin: '100% 0px' },
      )
      near.observe(wrapper)

      return () => {
        disposed = true
        near.disconnect()
        resize.disconnect()
        cancelAnimationFrame(frame)
        window.removeEventListener('scroll', onScroll)
        track.removeEventListener('focusin', onFocus)
        root.style.removeProperty('--story-zoom')
        dispose?.()
      }
    }

    // Swipe: the card in the middle of the horizontal track. While the track is on screen it moves
    // on by itself every ADVANCE_MS, long enough to read a card. Touching, hovering or focusing the
    // track holds it (WCAG 2.2.2), a manual swipe restarts the count, and reduced motion turns it off.
    const swipe = () => {
      let current = 0
      let timer = 0
      let inView = false
      let held = false

      const advance = () => {
        const next = chapters[(current + 1) % chapters.length]
        if (!next) return
        const box = track.getBoundingClientRect()
        const card = next.getBoundingClientRect()
        const left = track.scrollLeft + card.left - box.left - (box.width - card.width) / 2
        track.scrollTo({ left, behavior: 'smooth' })
      }
      const schedule = () => {
        window.clearTimeout(timer)
        if (!inView || held || still.matches) return
        timer = window.setTimeout(() => {
          advance()
          schedule()
        }, ADVANCE_MS)
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            current = chapters.indexOf(entry.target as HTMLElement)
            show(current)
            schedule()
          }
        },
        { root: track, rootMargin: '0px -45% 0px -45%' },
      )
      for (const chapter of chapters) observer.observe(chapter)

      const visible = new IntersectionObserver(
        ([entry]) => {
          inView = entry?.isIntersecting ?? false
          schedule()
        },
        { threshold: 0.5 },
      )
      visible.observe(track)

      const hold = () => {
        held = true
        schedule()
      }
      const release = () => {
        held = track.contains(document.activeElement)
        schedule()
      }
      const onFocusOut = (event: FocusEvent) => {
        if (!track.contains(event.relatedTarget as Node | null)) release()
      }
      const holdEvents = ['touchstart', 'mouseenter', 'focusin'] as const
      const releaseEvents = ['touchend', 'touchcancel', 'mouseleave'] as const
      for (const name of holdEvents) track.addEventListener(name, hold, { passive: true })
      for (const name of releaseEvents) track.addEventListener(name, release, { passive: true })
      track.addEventListener('focusout', onFocusOut)
      still.addEventListener('change', schedule)

      return () => {
        window.clearTimeout(timer)
        observer.disconnect()
        visible.disconnect()
        for (const name of holdEvents) track.removeEventListener(name, hold)
        for (const name of releaseEvents) track.removeEventListener(name, release)
        track.removeEventListener('focusout', onFocusOut)
        still.removeEventListener('change', schedule)
      }
    }

    let cleanup = media.matches ? pinned() : swipe()
    const onChange = () => {
      cleanup()
      cleanup = media.matches ? pinned() : swipe()
    }
    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
      cleanup()
    }
  }, [id])

  return null
}
