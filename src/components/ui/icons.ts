import {
  BadgeCheck,
  Car,
  CircleCheck,
  Clock,
  Droplets,
  Hammer,
  Handshake,
  HardHat,
  KeyRound,
  Lightbulb,
  Navigation,
  Package,
  PaintRoller,
  Palette,
  PartyPopper,
  Plug,
  ShieldCheck,
  Signpost,
  Smartphone,
  Sofa,
  Sparkles,
  Truck,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import type { ServiceIcon } from '@/lib/service-keys'
import type { Home } from '@/payload-types'

type HomeIcon = NonNullable<NonNullable<NonNullable<Home['hero']>['cues']>[number]['icon']>

// Lucide components for the icon names editors pick in Payload (services and the home global).
const icons: Record<ServiceIcon | HomeIcon, LucideIcon> = {
  palette: Palette,
  sofa: Sofa,
  wrench: Wrench,
  hammer: Hammer,
  signpost: Signpost,
  'party-popper': PartyPopper,
  lightbulb: Lightbulb,
  'hard-hat': HardHat,
  truck: Truck,
  package: Package,
  car: Car,
  'paint-roller': PaintRoller,
  plug: Plug,
  droplets: Droplets,
  'shield-check': ShieldCheck,
  'badge-check': BadgeCheck,
  navigation: Navigation,
  'circle-check': CircleCheck,
  'key-round': KeyRound,
  clock: Clock,
  handshake: Handshake,
  sparkles: Sparkles,
  wallet: Wallet,
  smartphone: Smartphone,
}

export const iconFor = (name: string | null | undefined, fallback: LucideIcon): LucideIcon =>
  name && name in icons ? icons[name as keyof typeof icons] : fallback
