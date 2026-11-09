import { Poppins, Sora } from 'next/font/google'
import type React from 'react'

// Same families as the site (design-system §3), self-hosted by next/font. Payload's layout is
// generated, so the fonts come in through a provider and are handed to Payload's own variable.
// A Server Component on purpose: as a client component, Turbopack (Next 16.4) fails to compile
// the font CSS ("next/font/google queries have exactly one entry") and the dev server then
// answers 500 on every route. Payload renders providers on the server, so no hooks needed here.
const poppins = Poppins({
  // Same subsets as the site layout: a font file declared twice with different preload flags
  // breaks Turbopack's font loader ("queries have exactly one entry").
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const sora = Sora({
  // Same subsets as the site layout: a font file declared twice with different preload flags
  // breaks Turbopack's font loader ("queries have exactly one entry").
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
})

const fontVars = `:root{--font-body:${poppins.style.fontFamily};--hm-font-display:${sora.style.fontFamily}}`

export function AdminFonts({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{fontVars}</style>
      {children}
    </>
  )
}
