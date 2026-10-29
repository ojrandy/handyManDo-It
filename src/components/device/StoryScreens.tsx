import {
  Camera,
  CircleCheck,
  Gift,
  MapPin,
  MessageCircle,
  Navigation,
  ShieldCheck,
  Smartphone,
  Sofa,
  Star,
  Wallet,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import { services } from '@/lib/services'

// HTML rebuilds of the app screens the scroll story needs but the capture can't reach without a
// signed-in account with a booking (T-1.09): price, payment, tracking, completion code, rewards.
// Light theme, same data as the hero cues. Decorative: the phone that shows them is aria-hidden.

async function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  const t = await getTranslations('phone')
  return (
    <div className="flex h-full flex-col bg-mist-50 text-ink">
      <div className="flex h-10 items-end justify-between px-6 pb-1 text-[11px] font-semibold">
        <span>{t('time')}</span>
        <span className="h-2 w-3.5 rounded-[2px] border border-ink/70" />
      </div>
      <p className="px-4 pt-3 font-display text-[15px] font-semibold text-teal-700">{title}</p>
      <div className="flex flex-1 flex-col gap-3 px-4 pt-3 pb-5">{children}</div>
    </div>
  )
}

const card = 'rounded-xl bg-white p-3 shadow-sm ring-1 ring-mist-200'
const cta =
  'mt-auto rounded-full bg-gold-500 py-2.5 text-center text-[12px] font-semibold text-night-950'

export async function PriceScreen() {
  const t = await getTranslations('story.screens')
  return (
    <Screen title={t('service')}>
      <div className={`${card} flex items-center gap-3`}>
        <span className="grid size-10 place-items-center rounded-lg bg-mist-100 text-teal-600">
          <Sofa className="size-5" strokeWidth={2} />
        </span>
        <p className="text-[11px] leading-snug font-medium">{t('job')}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid aspect-square place-items-center rounded-lg bg-mist-200">
            <Camera className="size-4 text-slate-500" strokeWidth={1.75} />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-night-800 p-4 text-white">
        <p className="text-[10px] tracking-wide text-white/70 uppercase">{t('clearPrice')}</p>
        <p className="mt-1 font-display text-[22px] font-bold text-gold-300">{t('price')}</p>
      </div>
      <p className={cta}>{t('book')}</p>
    </Screen>
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
    <Screen title={t('payment')}>
      {methods.map(({ key, label, icon: Icon, swatch }, index) => (
        <div
          key={key}
          className={`${card} flex items-center gap-3 ${index === 0 ? 'ring-2 ring-teal-500' : ''}`}
        >
          <span className={`grid size-8 place-items-center rounded-lg ${swatch}`}>
            <Icon className="size-4" strokeWidth={2} />
          </span>
          <span className="flex-1 text-[12px] font-medium">{label}</span>
          <span
            className={`size-3.5 rounded-full border-2 ${
              index === 0 ? 'border-teal-600 bg-teal-600' : 'border-mist-200'
            }`}
          />
        </div>
      ))}
      <p className="flex items-center gap-2 rounded-xl bg-teal-600/10 px-3 py-2.5 text-[11px] font-medium text-teal-700">
        <ShieldCheck className="size-4 shrink-0" strokeWidth={2} />
        {t('held')}
      </p>
      <p className={cta}>{t('pay')}</p>
    </Screen>
  )
}

export async function TrackScreen() {
  const t = await getTranslations('story.screens')
  return (
    <Screen title={t('onTheWay')}>
      {/* Stylised map: streets as lines, the route dashed from the pro to the client. */}
      <div className="relative flex-1 overflow-hidden rounded-2xl bg-[#e4ecdf]">
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
        <span className="absolute top-[22%] left-[72%] grid size-7 -translate-1/2 place-items-center rounded-full bg-gold-500 text-night-950 shadow">
          <MapPin className="size-4" strokeWidth={2.25} />
        </span>
        <span className="absolute top-[82%] left-[30%] grid size-8 -translate-1/2 place-items-center rounded-full bg-teal-600 text-white shadow-lg ring-4 ring-white/70">
          <Navigation className="size-4" strokeWidth={2.25} />
        </span>
      </div>
      <div className={`${card} flex items-center gap-3`}>
        <span className="grid size-9 place-items-center rounded-full bg-teal-600 text-[12px] font-bold text-white">
          HM
        </span>
        <div className="flex-1">
          <p className="flex items-center gap-1 text-[11px] font-semibold">
            {t('verified')}
            <CircleCheck className="size-3.5 text-teal-500" strokeWidth={2.25} />
          </p>
          <p className="text-[10px] text-slate-500">{t('eta')}</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-mist-100 px-2.5 py-1.5 text-[10px] font-semibold text-teal-700">
          <MessageCircle className="size-3.5" strokeWidth={2} />
          {t('message')}
        </span>
      </div>
    </Screen>
  )
}

export async function CodeScreen() {
  const t = await getTranslations('story.screens')
  return (
    <Screen title={t('finished')}>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="grid aspect-[4/3] place-items-center rounded-lg bg-mist-200">
            <Camera className="size-4 text-slate-500" strokeWidth={1.75} />
          </div>
        ))}
      </div>
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-teal-600">
        <CircleCheck className="size-4" strokeWidth={2.25} />
        {t('photos')}
      </p>
      <div className={`${card} text-center`}>
        <p className="text-[11px] text-slate-500">{t('shareCode')}</p>
        <p className="mt-2 flex justify-center gap-2">
          {['4', '8', '2', '7'].map((digit, i) => (
            <span
              key={i}
              className="grid h-11 w-9 place-items-center rounded-lg bg-night-900 font-display text-[20px] font-bold text-gold-300"
            >
              {digit}
            </span>
          ))}
        </p>
      </div>
    </Screen>
  )
}

export async function RewardsScreen() {
  const t = await getTranslations('story.screens')
  return (
    <Screen title={t('rewards')}>
      <div className="grid place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-night-800 px-4 py-6 text-white">
        <span className="grid size-12 place-items-center rounded-full bg-gold-500 text-night-950">
          <Gift className="size-6" strokeWidth={2} />
        </span>
        <p className="mt-3 font-display text-[24px] font-bold text-gold-300">{t('earned')}</p>
      </div>
      <div className={`${card} flex items-center justify-between`}>
        <span className="text-[11px] text-slate-500">{t('balance')}</span>
        <span className="flex items-center gap-1 text-[13px] font-semibold text-teal-700">
          <Star className="size-3.5 fill-gold-500 text-gold-500" />
          {t('points')}
        </span>
      </div>
      <p className="text-center text-[11px] text-slate-500">{t('useNext')}</p>
    </Screen>
  )
}

// The web app on a laptop, for the "any device" finale: a browser bar with the real address and
// the app's category grid.
export async function WebAppScreen({ host }: { host: string }) {
  const [t, s] = await Promise.all([getTranslations('phone'), getTranslations('services')])
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
      <div className="flex-1 px-5 py-4">
        <p className="text-[9px] text-slate-500">{t('greeting')} 👋</p>
        <p className="font-display text-[13px] font-semibold text-teal-700">{t('question')}</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {services.slice(0, 8).map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="flex flex-col items-center gap-1 rounded-lg bg-white px-1 py-2 shadow-sm ring-1 ring-mist-200"
            >
              <Icon className="size-3.5 text-teal-600" strokeWidth={2} />
              <span className="text-[7px] font-medium">{s(`${key}.short`)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
