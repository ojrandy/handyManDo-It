import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// When a chapter change starts within its segment, and how long the picture takes; the rest of the
// segment is the chapter holding still, which is what the scroll snaps to.
const CHANGE_START = 0.2
const CHANGE_LENGTH = 0.6

// Scroll-scrubbed chapter changes of the scroll story (FR-HOME-07, ADR-030). Chapter `i` rests at
// timeline time `i`. CSS `sticky` holds the stage, so GSAP only animates and never moves the layout.
// Only transform and opacity move, which the GPU handles without repainting: the wipe is the figure
// sliding up inside its clipping parent while its content slides down by the same amount.
// Loaded on demand by StoryObserver. Returns the cleanup, which restores every inline style.
export function buildStoryTimeline(root: HTMLElement, wrapper: HTMLElement, stage: HTMLElement) {
  const chapters = [...root.querySelectorAll<HTMLElement>('[data-story-chapter]')]
  const screens = [...root.querySelectorAll<HTMLElement>('[data-story-screen]')]
  const last = chapters.length - 1
  const screenOf = (index: number) =>
    screens.find((screen) => screen.dataset.for?.split(' ').includes(String(index)))
  const parts = chapters.map((chapter) => ({
    text: chapter.querySelectorAll('[data-story-reveal]'),
    figure: chapter.querySelector('figure'),
    content: chapter.querySelector('[data-story-picture]'),
    chip: chapter.querySelector('figcaption'),
  }))

  // Clipped pictures count as out of view for lazy loading: fetch them now, or a wipe could
  // uncover an empty frame.
  for (const image of root.querySelectorAll<HTMLImageElement>('figure img')) {
    image.loading = 'eager'
  }

  const context = gsap.context(() => {
    const top = parseFloat(getComputedStyle(stage).top) || 0
    // Opacity, not visibility: every chapter stays in the accessibility tree.
    gsap.set(chapters, { opacity: 1 })
    root.toggleAttribute('data-gsap', true)

    parts.forEach(({ text, figure, content, chip }, index) => {
      if (figure) gsap.set(figure, { willChange: 'transform' })
      if (content) gsap.set(content, { willChange: 'transform' })
      if (index === 0) return
      gsap.set(text, { opacity: 0 })
      if (figure) gsap.set(figure, { yPercent: 100 })
      if (chip) gsap.set(chip, { opacity: 0 })
    })
    gsap.set(screens, { autoAlpha: 0 })
    gsap.set(screenOf(0) ?? [], { autoAlpha: 1 })

    const timeline = gsap.timeline({
      defaults: { immediateRender: false },
      scrollTrigger: {
        trigger: wrapper,
        start: () => `top ${top}px`,
        end: () => `bottom ${top + stage.offsetHeight}px`,
        scrub: 0.6,
        snap: {
          snapTo: 1 / last,
          // Inertia reads a fast flick as a throw and skips chapters; go to the nearest instead.
          inertia: false,
          delay: 0.1,
          duration: { min: 0.25, max: 0.6 },
          ease: 'power2.inOut',
        },
      },
    })

    for (let index = 0; index < last; index++) {
      const from = parts[index]
      const to = parts[index + 1]
      const at = index + CHANGE_START

      // Text leaves upwards, then the next chapter's arrives from below, line by line.
      timeline.to(
        from.text,
        { opacity: 0, y: -24, duration: 0.26, stagger: 0.02, ease: 'power2.in' },
        at,
      )
      timeline.fromTo(
        to.text,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out' },
        at + 0.28,
      )

      // The next picture wipes up over the current one and settles as it goes.
      if (to.figure) {
        timeline.fromTo(
          to.figure,
          { yPercent: 100 },
          { yPercent: 0, duration: CHANGE_LENGTH, ease: 'power2.inOut' },
          at,
        )
      }
      if (to.content) {
        timeline.fromTo(
          to.content,
          { yPercent: -100 },
          { yPercent: 0, duration: CHANGE_LENGTH, ease: 'power2.inOut' },
          at,
        )
        // Ends as the segment does, so the timeline stays exactly `last` long.
        timeline.fromTo(to.content, { scale: 1.12 }, { scale: 1, duration: 0.8, ease: 'none' }, at)
      }
      if (to.chip) {
        timeline.fromTo(
          to.chip,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' },
          at + 0.42,
        )
      }

      const screenFrom = screenOf(index)
      const screenTo = screenOf(index + 1)
      if (screenFrom && screenTo && screenFrom !== screenTo) {
        timeline.fromTo(
          screenTo,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.4, ease: 'power2.out' },
          at + 0.1,
        )
        timeline.to(screenFrom, { autoAlpha: 0, duration: 0.3, ease: 'none' }, at + 0.2)
      }
    }
    // Chapter `last` rests at the very end of the scroll, not one segment short of it.
    timeline.to({}, { duration: 0.001 }, last)
  }, root)

  return () => {
    context.revert()
    root.removeAttribute('data-gsap')
  }
}
