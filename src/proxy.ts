import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Everything except the CMS, API routes, the store redirect, Next internals and files with an extension.
  matcher: ['/((?!admin|api|download|_next|_vercel|.*\\..*).*)'],
}
