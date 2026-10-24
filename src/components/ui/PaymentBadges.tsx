import { getTranslations } from 'next-intl/server'

// Text badges with brand-colour dots; official logos can replace them once licensed.
const methods = [
  { key: 'mtn', dot: 'bg-[#ffcc00]' },
  { key: 'orange', dot: 'bg-[#ff7900]' },
  { key: 'wallet', dot: 'bg-gold-500' },
] as const

export async function PaymentBadges({ className = '' }: { className?: string }) {
  const t = await getTranslations('payments')

  return (
    <ul aria-label={t('label')} className={`flex flex-wrap gap-2 ${className}`}>
      {methods.map(({ key, dot }) => (
        <li
          key={key}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/85"
        >
          <span aria-hidden className={`size-2 rounded-full ${dot}`} />
          {t(key)}
        </li>
      ))}
    </ul>
  )
}
