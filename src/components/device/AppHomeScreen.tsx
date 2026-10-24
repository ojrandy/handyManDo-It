import { CalendarCheck, House, Search, User, Wallet } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { services } from '@/lib/services'

// HTML recreation of the app's Home screen, in the app's light theme. Stands in until real
// screens are captured from the app (T-1.09). Decorative: the phone frame is aria-hidden.
export async function AppHomeScreen() {
  const [t, s] = await Promise.all([getTranslations('phone'), getTranslations('services')])
  const tiles = services.slice(0, 6)
  const tabs = [
    { key: 'home', icon: House, active: true },
    { key: 'bookings', icon: CalendarCheck, active: false },
    { key: 'wallet', icon: Wallet, active: false },
    { key: 'profile', icon: User, active: false },
  ] as const

  return (
    <div className="flex h-full flex-col text-ink">
      <div className="flex h-10 items-end justify-between px-6 pb-1 text-[11px] font-semibold">
        <span>{t('time')}</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-3.5 rounded-[2px] border border-ink/70" />
        </span>
      </div>

      <div className="flex-1 space-y-4 px-4 pt-3">
        <div>
          <p className="text-[11px] text-slate-500">{t('greeting')} 👋</p>
          <p className="font-display text-[15px] leading-tight font-semibold text-teal-700">
            {t('question')}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[11px] text-slate-500 shadow-sm ring-1 ring-mist-200">
          <Search className="size-3.5" strokeWidth={2} />
          {t('search')}
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-night-800 p-3.5 text-white">
          <p className="text-[12px] font-semibold">{t('promoTitle')}</p>
          <p className="mt-1 text-[10px] leading-snug text-white/75">{t('promoBody')}</p>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold text-teal-700">{t('categories')}</p>
          <div className="grid grid-cols-3 gap-2">
            {tiles.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-white px-1 py-2.5 shadow-sm ring-1 ring-mist-200"
              >
                <span className="grid size-7 place-items-center rounded-lg bg-mist-100 text-teal-600">
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

      <div className="grid grid-cols-4 border-t border-mist-200 bg-white px-2 pt-2 pb-4">
        {tabs.map(({ key, icon: Icon, active }) => (
          <div
            key={key}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-medium ${
              active ? 'text-teal-600' : 'text-slate-500'
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
