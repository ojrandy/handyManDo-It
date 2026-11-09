import Image from 'next/image'
import type { ServerProps } from 'payload'

import { site } from '@/lib/site'

import { adminCopy, adminLang } from './copy'

type Props = Partial<Pick<ServerProps, 'i18n'>>

// Login and create-first-user screens (admin.components.graphics.Logo).
export function Logo({ i18n }: Props) {
  const copy = adminCopy(i18n?.language)
  return (
    <div className="hm-logo">
      <Image
        src="/brand/logo.jpg"
        alt=""
        width={88}
        height={79}
        priority
        className="hm-logo__mark"
      />
      <div>
        <p className="hm-logo__name">{site.name}</p>
        <p className="hm-logo__tag">{copy.studio}</p>
      </div>
    </div>
  )
}

// Breadcrumb home link and other small spots (admin.components.graphics.Icon).
export function Icon() {
  return <Image src="/brand/logo.jpg" alt={site.name} width={26} height={23} className="hm-icon" />
}

// Top of the sidebar (admin.components.beforeNavLinks): who this admin belongs to, and a way
// back to the public site in the editor's language.
export function NavBrand({ i18n }: Props) {
  const lang = adminLang(i18n?.language)
  const copy = adminCopy(lang)
  return (
    <div className="hm-nav-brand">
      <Image src="/brand/logo.jpg" alt="" width={40} height={36} className="hm-nav-brand__mark" />
      <div className="hm-nav-brand__text">
        <span className="hm-nav-brand__name">{site.name}</span>
        <a className="hm-nav-brand__link" href={`/${lang}`} target="_blank" rel="noopener">
          {copy.viewSite} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  )
}
