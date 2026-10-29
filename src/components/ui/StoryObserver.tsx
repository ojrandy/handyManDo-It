'use client'

import { useEffect } from 'react'

type Props = {
  // id of the scroll story section.
  id: string
}

// Same query as the `pinned` variant in globals.css.
const PINNED = '(min-width: 48rem) and (prefers-reduced-motion: no-preference)'

// Marks the chapter in view as current in the scroll story (FR-HOME-07). Every element with
// `data-for="<chapter indexes>"` (chapters, screens, rail dots) gets `data-current` while one of
// its chapters is in view; the section gets `data-finale` on the last one. The markup is
// server-rendered, so this island only flips attributes and never re-renders it.
export function StoryObserver({ id }: Props) {
  useEffect(() => {
    const root = document.getElementById(id)
    const track = root?.querySelector<HTMLElement>('[data-story-track]')
    if (!root || !track) return
    const chapters = [...track.querySelectorAll<HTMLElement>('[data-story-chapter]')]
    const marked = [...root.querySelectorAll<HTMLElement>('[data-for]')]
    const media = window.matchMedia(PINNED)

    const show = (index: number) => {
      for (const element of marked) {
        const current = element.dataset.for?.split(' ').includes(String(index)) ?? false
        element.toggleAttribute('data-current', current)
      }
      root.toggleAttribute('data-finale', index === chapters.length - 1)
    }

    let observer: IntersectionObserver | undefined
    const observe = () => {
      observer?.disconnect()
      // Pinned: the chapter crossing a band just above the middle of the viewport. Swipe: the
      // card in the middle of the horizontal track.
      const options: IntersectionObserverInit = media.matches
        ? { rootMargin: '-40% 0px -55% 0px' }
        : { root: track, rootMargin: '0px -45% 0px -45%' }
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) show(chapters.indexOf(entry.target as HTMLElement))
        }
      }, options)
      for (const chapter of chapters) observer.observe(chapter)
    }

    observe()
    media.addEventListener('change', observe)
    return () => {
      observer?.disconnect()
      media.removeEventListener('change', observe)
    }
  }, [id])

  return null
}
