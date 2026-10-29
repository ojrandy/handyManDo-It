import React from 'react'

import { Link } from '@/i18n/navigation'
import type { LinkTarget } from '@/lib/navigation'

type Props = Omit<React.ComponentProps<'a'>, 'href'> & { to: LinkTarget }

// Menu links from the CMS: site routes go through the localized Link, external URLs stay plain.
export function NavAnchor({ to, ...props }: Props) {
  return to.external ? <a href={to.href} {...props} /> : <Link href={to.href} {...props} />
}
