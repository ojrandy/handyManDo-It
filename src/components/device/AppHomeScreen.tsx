import { CalendarCheck, House, Search, User, Wallet } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { services } from '@/lib/services'

type Theme = 'light' | 'dark'

// Light and dark palettes of the app (the app ships both themes).
const palette: Record<Theme, Record<string, string>> = {
  light: {
    screen: 'bg-mist-50 text-ink',
    muted: 'text-slate-500',
    heading: 'text-teal-700',
    card: 'bg-white shadow-sm ring-1 ring-mist-200',
    iconTile: 'bg-mist-100 text-teal-600',
    bar: 'border-mist-200 bg-white',
    active: 'text-teal-600',
    battery: 'border-ink/70',
  },
  dark: {
    screen: 'bg-night-950 text-white',
    muted: 'text-white/55',
    heading: 'text-white',
    card: 'bg-night-800 ring-1 ring-white/10',
    iconTile: 'bg-teal-600/40 text-gold-300',
    bar: 'border-white/10 bg-night-900',
    active: 'text-gold-300',
    battery: 'border-white/70',
  },
}

// HTML recreation of the app's Home screen. Stands in until real screens are captured from the
// app (T-1.09). Decorative: the phone frames that show it are aria-hidden.
export async function AppHomeScreen({ theme = 'light' }: { theme?: Theme }) {
  const [t, s] = await Promise.all([getTranslations('phone'), getTranslations('services')])
  const c = palette[theme]
  const tiles = services.slice(0, 6)
  const tabs = [
    { key: 'home', icon: House, active: true },
    { key: 'bookings', icon: CalendarCheck, active: false },
    { key: 'wallet', icon: Wallet, active: false },
    { key: 'profile', icon: User, active: false },
  ] as const

  return (
    <div className={`flex h-full flex-col ${c.screen}`}>
      <div className="flex h-10 items-end justify-between px-6 pb-1 text-[11px] font-semibold">
        <span>{t('time')}</span>
        <span className={`h-2 w-3.5 rounded-[2px] border ${c.battery}`} />
      </div>

      <div className="flex-1 space-y-4 px-4 pt-3">
        <div>
          <p className={`text-[11px] ${c.muted}`}>{t('greeting')} 👋</p>
          <p className={`font-display text-[15px] leading-tight font-semibold ${c.heading}`}>
            {t('question')}
          </p>
        </div>

        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] ${c.card} ${c.muted}`}
        >
          <Search className="size-3.5" strokeWidth={2} />
          {t('search')}
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-night-800 p-3.5 text-white">
          <p className="text-[12px] font-semibold">{t('promoTitle')}</p>
          <p className="mt-1 text-[10px] leading-snug text-white/75">{t('promoBody')}</p>
        </div>

        <div>
          <p className={`mb-2 text-[11px] font-semibold ${c.heading}`}>{t('categories')}</p>
          <div className="grid grid-cols-3 gap-2">
            {tiles.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className={`flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 ${c.card}`}
              >
                <span className={`grid size-7 place-items-center rounded-lg ${c.iconTile}`}>
                  <Icon className="size-3.5" strokeWidth={2} />
                </span>
                <span className="text-center text-[9px] leading-tight font-medium">
                  {s(`${key}.short`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-4 border-t px-2 pt-2 pb-4 ${c.bar}`}>
        {tabs.map(({ key, icon: Icon, active }) => (
          <div
            key={key}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-medium ${
              active ? c.active : c.muted
            }`}
          >
            <Icon className="size-4" strokeWidth={active ? 2.25 : 1.75} />
            {t(`tabs.${key}`)}
          </div>
        ))}
      </div>
    </div>
  )
}
