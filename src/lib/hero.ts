import {
  BadgeCheck,
  CircleCheck,
  KeyRound,
  Navigation,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export type HeroCueKey = 'quote' | 'paid' | 'onTheWay' | 'finished' | 'released'

export type HeroCue = {
  key: HeroCueKey
  // Seconds into the hero footage at which the notification appears (FR-HOME-01).
  time: number
  icon: LucideIcon
}

// The app's real job lifecycle (docs/PLAN.md §5.2). Text lives in messages under
// `hero.cues.<key>`. Seeds the `home` global's cue list, and stands in while that list is empty.
export const heroCues: readonly HeroCue[] = [
  { key: 'quote', time: 2, icon: BadgeCheck },
  { key: 'paid', time: 6, icon: ShieldCheck },
  { key: 'onTheWay', time: 10, icon: Navigation },
  { key: 'finished', time: 14, icon: CircleCheck },
  { key: 'released', time: 18, icon: KeyRound },
]

export type HeroVideo = {
  mp4: string
  webm?: string
  poster?: string
}

// Hero footage is chosen in T-1.10 (owner question Q-4) and uploaded to the `home` global.
// Until then the hero uses its designed background and timer-driven notifications.
export const heroVideo: HeroVideo | null = null

// The brand sting that opens the "Watch the film" lightbox (docs/PLAN.md §5.2).
export const brandFilm = {
  src: '/video/brand-intro.mp4',
  poster: '/video/brand-intro-poster.jpg',
}
