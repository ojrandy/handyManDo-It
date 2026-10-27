import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { partners } from '@/lib/showcase'

// Partner marquee + "Featured on Spectron Magazine" (docs/PLAN.md §5.3, FR-HOME-03). CSS only:
// the list is rendered twice so the loop is seamless (the copy is aria-hidden), it pauses on
// hover/focus, and under reduced motion it is a static, wrapped row.
export async function TrustedBy() {
  const t = await getTranslations('trustedBy')

  const logos = (copy: boolean) =>
    partners.map((partner) => (
      <li key={`${partner.key}${copy ? '-copy' : ''}`} className="shrink-0">
        <Image
          src={partner.logo}
          alt={copy ? '' : (partner.name ?? t('partnerAlt'))}
          width={80}
          height={80}
          className="size-16 rounded-card object-contain grayscale transition duration-300 hover:grayscale-0 sm:size-20"
        />
      </li>
    ))

  return (
    <section aria-labelledby="trusted-title" className="border-b border-mist-200 bg-white py-12">
      <div className="container-site flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <h2 id="trusted-title" className="font-sans text-sm font-semibold text-slate-500">
          {t('label')}
        </h2>
        <p className="text-sm font-semibold text-teal-600">{t('featured')}</p>
      </div>

      <div className="group mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max gap-10 px-5 motion-safe:animate-marquee group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center">
          <ul className="flex shrink-0 gap-10 motion-reduce:flex-wrap motion-reduce:justify-center">
            {logos(false)}
          </ul>
          <ul aria-hidden className="flex shrink-0 gap-10 motion-reduce:hidden">
            {logos(true)}
          </ul>
        </div>
      </div>
    </section>
  )
}
