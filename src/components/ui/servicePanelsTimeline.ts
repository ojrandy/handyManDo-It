import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Viewport share at which the section's top edge starts the first panel's entrance.
const ENTER_AT = 0.9
// When a panel change starts within its segment; the rest of the segment holds still. There is no
// snap (unlike the scroll story), so wherever a thumb stops, the panel is most likely at rest.
const CHANGE_START = 0.2

// Scroll-scrubbed service panels on phones (FR-HOME-04, ADR-031). One timeline covers the entrance
// and the changes, so scrolling back up plays all of it in reverse, back to before the section came
// in. Panel `i` rests at time `entrance + i`. CSS `sticky` holds the stage; GSAP only moves
// transform and opacity. Loaded on demand by ServicePanels. Returns the cleanup.
export function buildPanelsTimeline(root: HTMLElement, wrapper: HTMLElement, stage: HTMLElement) {
  const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')]
  const last = panels.length - 1
  const parts = panels.map((panel) => ({
    title: panel.querySelectorAll('[data-panel-title]'),
    tiles: panel.querySelectorAll('[data-panel-tile]'),
  }))

  const context = gsap.context(() => {
    const top = parseFloat(getComputedStyle(stage).top) || 0
    // Opacity, not visibility: every tile stays in the accessibility tree and can take focus.
    gsap.set(panels, { opacity: 1 })
    root.toggleAttribute('data-gsap', true)
    parts.forEach(({ title, tiles }, index) => {
      gsap.set(tiles, { willChange: 'transform' })
      if (index > 0) gsap.set([title, tiles], { opacity: 0 })
    })

    // One timeline unit is one panel's scroll distance, so the entrance is measured in the same
    // unit and the panels rest exactly where ServicePanels counts them.
    const segment = last > 0 ? (wrapper.offsetHeight - stage.offsetHeight) / last : 1
    const entrance = (window.innerHeight * ENTER_AT - top) / segment

    const timeline = gsap.timeline({
      defaults: { immediateRender: false },
      scrollTrigger: {
        trigger: wrapper,
        start: `top ${ENTER_AT * 100}%`,
        end: () => `bottom ${top + stage.offsetHeight}px`,
        scrub: 0.4,
      },
    })

    const first = parts[0]
    if (first) {
      timeline.fromTo(
        first.title,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: entrance * 0.4, ease: 'power2.out' },
        entrance * 0.25,
      )
      timeline.fromTo(
        first.tiles,
        { opacity: 0, y: 72, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: entrance * 0.5,
          stagger: entrance * 0.06,
          ease: 'power3.out',
        },
        entrance * 0.3,
      )
    }

    for (let index = 0; index < last; index++) {
      const from = parts[index]
      const to = parts[index + 1]
      const at = entrance + index + CHANGE_START

      // The current tiles sink back and leave upwards; the next ones are dealt in from below. The
      // sets overlap just enough that a thumb stopping mid-change never leaves an empty screen.
      timeline.to(from.title, { opacity: 0, y: -16, duration: 0.2, ease: 'power2.in' }, at)
      timeline.to(
        from.tiles,
        { opacity: 0, y: -36, scale: 0.94, duration: 0.22, stagger: 0.02, ease: 'power2.in' },
        at,
      )
      timeline.fromTo(
        to.title,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out' },
        at + 0.22,
      )
      timeline.fromTo(
        to.tiles,
        { opacity: 0, y: 72, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.03, ease: 'power3.out' },
        at + 0.22,
      )
    }
    // The last panel rests at the very end of the scroll, not one segment short of it.
    timeline.to({}, { duration: 0.001 }, entrance + last)
  }, root)

  return () => {
    context.revert()
    root.removeAttribute('data-gsap')
  }
}
