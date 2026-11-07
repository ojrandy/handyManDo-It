import {
  Bell,
  CalendarDays,
  Camera,
  CircleCheck,
  Gift,
  Globe,
  House,
  type LucideIcon,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Navigation,
  ShieldCheck,
  Smartphone,
  Sofa,
  Star,
  User,
  Wallet,
  Wrench,
} from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import type { Locale } from '@/i18n/routing'

// HTML rebuilds of the app screens the scroll story needs but the capture can't reach without a
// signed-in account with a booking (T-1.09): price, payment, tracking, completion code, rewards.
// Light theme, same data as the hero cues. Decorative: the phone that shows them is aria-hidden.

type Tab = 'home' | 'services' | 'activity' | 'messages' | 'account'

const tabs: { key: Tab; icon: LucideIcon }[] = [
  { key: 'home', icon: House },
  { key: 'services', icon: Wrench },
  { key: 'activity', icon: CalendarDays },
  { key: 'messages', icon: MessageCircle },
  { key: 'account', icon: User },
]

const signalBars = [4, 6, 8, 10]

// Like Flutter's Scaffold: the same status bar, app bar, floating bottom bar and home indicator
// around every screen, laid out on the captures' 390 × 844 px (ADR-029) and at the positions they
// show. A chapter change next to a captured screen therefore only changes the body: the bars don't
// move. `zoom` fits the 390 px design to the Phone's screen, 244 px below `sm` and 268 px from it.
async function Scaffold({ tab, children }: { tab: Tab; children: React.ReactNode }) {
  const [phone, t] = await Promise.all([
    getTranslations('phone'),
    getTranslations('story.screens'),
  ])
  const barButton =
    'grid size-10 place-items-center rounded-full border border-mist-200 bg-white text-ink shadow-sm'
  return (
    <div className="relative h-[844px] w-[390px] overflow-hidden bg-mist-50 text-ink [zoom:0.6256] sm:[zoom:0.6872]">
      <div className="absolute inset-x-0 top-0 h-[110px] border-b border-mist-200 bg-white">
        <span className="absolute top-[15px] left-8 font-sans text-base leading-5 font-semibold">
          {phone('time')}
        </span>
        <svg
          viewBox="0 0 60 12"
          fill="currentColor"
          className="absolute top-[19px] right-[26px] h-3 w-[60px]"
        >
          {signalBars.map((height, index) => (
            <rect
              key={height}
              x={index * 4.5}
              y={11 - height}
              width="3"
              height={height}
              rx="0.8"
            />
          ))}
          <path d="M27 3.6a7.6 7.6 0 0 1 10 0l-1.2 1.4a5.8 5.8 0 0 0-7.6 0zM29.3 6.3a4.2 4.2 0 0 1 5.4 0l-1.2 1.4a2.4 2.4 0 0 0-3 0zM32 8.3l1.3 1.5L32 11l-1.3-1.2z" />
          <rect x="41.5" y="1.5" width="15" height="9" rx="2.5" fill="none" stroke="currentColor" />
          <rect x="43" y="3" width="12" height="6" rx="1.2" />
        </svg>
        <div className="absolute inset-x-4 top-[59px] flex items-center gap-2.5">
          <span className={barButton}>
            <Menu className="size-5" strokeWidth={2} />
          </span>
          <Image
            src="/brand/logo.jpg"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-xl object-cover"
          />
          <span className="ml-auto flex gap-2">
            <span className={barButton}>
              <Bell className="size-5" strokeWidth={2} />
            </span>
            <span className={barButton}>
              <Globe className="size-5" strokeWidth={2} />
            </span>
            <span className={barButton}>
              <Moon className="size-5" strokeWidth={2} />
            </span>
          </span>
        </div>
      </div>

      {/* Ends above the assistant bubble, so no button ever sits under it. */}
      <div className="absolute inset-x-0 top-[110px] bottom-[187px] flex flex-col gap-3.5 px-4 pt-5">
        {children}
      </div>

      <Image
        src="/brand/logo.jpg"
        alt=""
        width={60}
        height={60}
        className="absolute top-[671px] right-4 size-[60px] rounded-full object-cover shadow-lg ring-2 ring-white"
      />

      <div className="absolute inset-x-3 top-[741px] grid h-[68px] grid-cols-5 items-center rounded-[30px] border border-mist-200 bg-white px-1.5 shadow-sm">
        {tabs.map(({ key, icon: Icon }) => (
          <span
            key={key}
            className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-[24px] text-[13px] font-medium ${
              key === tab ? 'bg-mist-100 text-teal-700' : 'text-ink/80'
            }`}
          >
            <Icon className="size-[22px]" strokeWidth={key === tab ? 2.25 : 1.75} />
            {t(`nav.${key}`)}
          </span>
        ))}
      </div>
      <span className="absolute bottom-2 left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-[3px] bg-ink" />
    </div>
  )
}

const heading = 'font-display text-[26px] leading-tight font-bold tracking-tight text-ink'
const card = 'rounded-3xl border border-mist-200 bg-white p-4 shadow-sm'
const cta =
  'mt-auto rounded-full bg-gold-500 py-3.5 text-center text-[17px] font-semibold text-night-950'

function PhotoTile({ src }: { src: string }) {
  return (
    <span className="relative block aspect-square overflow-hidden rounded-2xl">
      <Image src={src} alt="" fill sizes="120px" unoptimized className="object-cover" />
    </span>
  )
}

const worn = '/images/projects/upholstered-chairs-sofas/upholstered-chairs-sofas'

export async function PriceScreen() {
  const t = await getTranslations('story.screens')
  return (
    <Scaffold tab="services">
      <p className={heading}>{t('service')}</p>
      <div className={`${card} flex items-center gap-3 py-3`}>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-mist-100 text-teal-600">
          <Sofa className="size-6" strokeWidth={2} />
        </span>
        <p className="text-base leading-snug font-medium">{t('job')}</p>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <PhotoTile src={`${worn}-3.webp`} />
        <PhotoTile src={`${worn}-4.webp`} />
        <span className="grid aspect-square place-items-center rounded-2xl border border-dashed border-slate-400 text-slate-500">
          <Camera className="size-6" strokeWidth={1.75} />
        </span>
      </div>
      <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-night-800 p-5 text-white">
        <p className="text-sm tracking-wide text-white/75 uppercase">{t('clearPrice')}</p>
        <p className="mt-1 font-display text-[32px] leading-tight font-bold text-gold-300">
          {t('price')}
        </p>
      </div>
      <p className={cta}>{t('book')}</p>
    </Scaffold>
  )
}

export async function PayScreen() {
  const t = await getTranslations('story.screens')
  const methods = [
    { key: 'momo', label: 'MTN MoMo', icon: Smartphone, swatch: 'bg-[#ffcc00] text-ink' },
    { key: 'orange', label: 'Orange Money', icon: Smartphone, swatch: 'bg-[#ff7900] text-white' },
    { key: 'wallet', label: t('wallet'), icon: Wallet, swatch: 'bg-teal-600 text-white' },
  ]
  return (
    <Scaffold tab="services">
      <p className={heading}>{t('payment')}</p>
      {methods.map(({ key, label, icon: Icon, swatch }, index) => (
        <div
          key={key}
          className={`${card} flex items-center gap-3 py-3 ${
            index === 0 ? 'border-teal-600 ring-1 ring-teal-600' : ''
          }`}
        >
          <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${swatch}`}>
            <Icon className="size-5" strokeWidth={2} />
          </span>
          <span className="flex-1 text-base font-medium">{label}</span>
          <span
            className={`size-5 shrink-0 rounded-full border-2 ${
              index === 0 ? 'border-teal-600 bg-teal-600' : 'border-mist-200'
            }`}
          />
        </div>
      ))}
      <p className="flex items-center gap-2.5 rounded-2xl bg-teal-600/10 px-4 py-3 text-[15px] font-medium text-teal-700">
        <ShieldCheck className="size-5 shrink-0" strokeWidth={2} />
        {t('held')}
      </p>
      <p className={cta}>{t('pay')}</p>
    </Scaffold>
  )
}

export async function TrackScreen() {
  const t = await getTranslations('story.screens')
  return (
    <Scaffold tab="activity">
      <p className={heading}>{t('onTheWay')}</p>
      {/* Stylised map: streets as lines, the route dashed from the pro to the client. */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl bg-[#e4ecdf]">
        <svg
          viewBox="0 0 200 240"
          className="absolute inset-0 size-full"
          preserveAspectRatio="none"
        >
          <g stroke="#fff" strokeWidth="10" fill="none">
            <path d="M-10 60 H210 M-10 160 H210 M60 -10 V250 M150 -10 V250" />
          </g>
          <path
            d="M60 200 V160 H150 V60"
            stroke="#174f60"
            strokeWidth="4"
            strokeDasharray="8 6"
            fill="none"
          />
        </svg>
        <span className="absolute top-[25%] left-[75%] grid size-10 -translate-1/2 place-items-center rounded-full bg-gold-500 text-night-950 shadow">
          <MapPin className="size-5" strokeWidth={2.25} />
        </span>
        <span className="absolute top-[83%] left-[30%] grid size-11 -translate-1/2 place-items-center rounded-full bg-teal-600 text-white shadow-lg ring-4 ring-white/70">
          <Navigation className="size-5" strokeWidth={2.25} />
        </span>
      </div>
      <div className={`${card} flex items-center gap-3 py-3`}>
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-teal-600 text-base font-bold text-white">
          HM
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[15px] leading-tight font-semibold">
            <span className="truncate">{t('verified')}</span>
            <CircleCheck className="size-4 shrink-0 text-teal-500" strokeWidth={2.25} />
          </p>
          <p className="mt-0.5 truncate text-sm text-slate-500">{t('eta')}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-mist-100 px-3 py-2 text-sm font-semibold text-teal-700">
          <MessageCircle className="size-4" strokeWidth={2} />
          {t('message')}
        </span>
      </div>
    </Scaffold>
  )
}

export async function CodeScreen() {
  const t = await getTranslations('story.screens')
  return (
    <Scaffold tab="activity">
      <p className={heading}>{t('finished')}</p>
      <div className="grid grid-cols-2 gap-2.5">
        <PhotoTile src={`${worn}-1.webp`} />
        <PhotoTile src={`${worn}-2.webp`} />
      </div>
      <p className="flex items-center gap-2 text-[15px] font-medium text-teal-600">
        <CircleCheck className="size-5" strokeWidth={2.25} />
        {t('photos')}
      </p>
      <div className={`${card} mt-auto text-center`}>
        <p className="text-[15px] text-slate-500">{t('shareCode')}</p>
        <p className="mt-3 flex justify-center gap-2.5">
          {['4', '8', '2', '7'].map((digit, index) => (
            <span
              key={index}
              className="grid h-16 w-[52px] place-items-center rounded-2xl bg-night-900 font-display text-3xl font-bold text-gold-300"
            >
              {digit}
            </span>
          ))}
        </p>
      </div>
    </Scaffold>
  )
}

export async function RewardsScreen() {
  const t = await getTranslations('story.screens')
  return (
    <Scaffold tab="account">
      <p className={heading}>{t('rewards')}</p>
      <div className="grid flex-1 place-items-center content-center rounded-3xl bg-gradient-to-br from-teal-600 to-night-800 px-5 py-6 text-white">
        <span className="grid size-[72px] place-items-center rounded-full bg-gold-500 text-night-950">
          <Gift className="size-9" strokeWidth={2} />
        </span>
        <p className="mt-4 font-display text-[38px] leading-tight font-bold text-gold-300">
          {t('earned')}
        </p>
      </div>
      <div className={`${card} flex items-center justify-between`}>
        <span className="text-[15px] text-slate-500">{t('balance')}</span>
        <span className="flex items-center gap-1.5 text-[17px] font-semibold text-teal-700">
          <Star className="size-5 fill-gold-500 text-gold-500" />
          {t('points')}
        </span>
      </div>
      <p className="text-center text-[15px] text-slate-500">{t('useNext')}</p>
    </Scaffold>
  )
}

// The web app on a laptop, for the "any device" finale: a browser bar with the real address and
// a screenshot of the live dashboard at 1440 x 900 in that language (public/images/story).
export function WebAppScreen({ host, locale }: { host: string; locale: Locale }) {
  return (
    <div className="flex h-full flex-col bg-mist-50 text-ink">
      <div className="flex items-center gap-2 border-b border-mist-200 bg-white px-3 py-1.5">
        <span className="flex gap-1">
          <span className="size-1.5 rounded-full bg-mist-200" />
          <span className="size-1.5 rounded-full bg-mist-200" />
          <span className="size-1.5 rounded-full bg-mist-200" />
        </span>
        <span className="mx-auto rounded-full bg-mist-100 px-3 py-0.5 text-[8px] text-slate-500">
          {host}
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <Image
          src={`/images/story/webapp-${locale}.webp`}
          alt=""
          fill
          sizes="(min-width: 64rem) 660px, 45vw"
          // Exported at web size; nothing to resize per request.
          unoptimized
          className="object-cover object-top"
        />
      </div>
    </div>
  )
}
