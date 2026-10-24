'use client'

import { ChevronDown, Menu, X } from 'lucide-react'
import React, { useCallback, useEffect, useId, useRef, useState } from 'react'

import { Link, usePathname } from '@/i18n/navigation'

type Href = React.ComponentProps<typeof Link>['href']

export type HeaderService = {
  key: string
  name: string
  blurb: string
  href: Href
  icon: React.ReactNode
}

export type HeaderNavItem = {
  key: string
  label: string
  href: Href & string
}

type Props = {
  logo: React.ReactNode
  actions: React.ReactNode
  mobileFooter: React.ReactNode
  services: HeaderService[]
  navItems: HeaderNavItem[]
  labels: {
    main: string
    services: string
    servicesIntro: string
    allServices: string
    openMenu: string
    closeMenu: string
  }
}

// Client shell for the header (FR-GLB-01): frosted state on scroll, the Services mega-menu
// (disclosure pattern) and the full-screen mobile menu (native modal <dialog>).
export function HeaderShell({ logo, actions, mobileFooter, services, navItems, labels }: Props) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const megaRef = useRef<HTMLLIElement>(null)
  const megaButtonRef = useRef<HTMLButtonElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const megaId = useId()

  // A sentinel at the top of the document flips the header to frosted once it scrolls away,
  // without a scroll listener.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting))
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const closeMega = useCallback((returnFocus = false) => {
    setMegaOpen(false)
    if (returnFocus) megaButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!megaOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMega(true)
    }
    const onPointer = (event: PointerEvent) => {
      if (!megaRef.current?.contains(event.target as Node)) closeMega()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [megaOpen, closeMega])

  // Close the mobile menu after navigation (incl. browser back/forward). The mega-menu closes
  // from its links' click handlers instead.
  useEffect(() => {
    dialogRef.current?.close()
  }, [pathname])

  const onMegaPointer = (open: boolean) => (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setMegaOpen(open), open ? 80 : 180)
  }

  const openMobile = () => {
    dialogRef.current?.showModal()
    document.documentElement.style.overflow = 'hidden'
  }
  const closeMobile = () => dialogRef.current?.close()

  const frosted = scrolled || megaOpen

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute top-0 h-6 w-px" />
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 ${
          frosted
            ? 'border-b border-white/10 bg-night-900/85 shadow-[0_10px_30px_-15px_rgb(0_0_0/0.5)] backdrop-blur-md'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="container-site flex h-18 items-center justify-between gap-4">
          {logo}

          <nav aria-label={labels.main} className="hidden lg:block">
            <ul className="flex items-center gap-1 text-sm font-medium text-white/85">
              <li
                ref={megaRef}
                onPointerEnter={onMegaPointer(true)}
                onPointerLeave={onMegaPointer(false)}
                onBlur={(event) => {
                  if (!megaRef.current?.contains(event.relatedTarget as Node)) closeMega()
                }}
              >
                <button
                  ref={megaButtonRef}
                  type="button"
                  aria-expanded={megaOpen}
                  aria-controls={megaId}
                  onClick={() => setMegaOpen((open) => !open)}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-full px-3 transition-colors hover:text-white ${
                    megaOpen || pathname.startsWith('/services') ? 'text-white' : ''
                  }`}
                >
                  {labels.services}
                  <ChevronDown
                    aria-hidden
                    className={`size-4 transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div id={megaId} hidden={!megaOpen} className="absolute inset-x-0 top-full pt-2">
                  <div className="container-site">
                    <div className="grid gap-8 rounded-panel border border-white/10 bg-night-900 p-8 shadow-float lg:grid-cols-[16rem_1fr]">
                      <div className="flex flex-col justify-between gap-6">
                        <p className="font-display text-2xl leading-tight font-semibold text-white">
                          {labels.servicesIntro}
                        </p>
                        <Link
                          href="/services"
                          onClick={() => closeMega()}
                          className="text-sm font-semibold text-gold-300 underline-offset-4 hover:underline"
                        >
                          {labels.allServices} →
                        </Link>
                      </div>
                      <ul className="grid grid-cols-2 gap-1 xl:grid-cols-3">
                        {services.map((service) => (
                          <li key={service.key}>
                            <Link
                              href={service.href}
                              onClick={() => closeMega()}
                              className="group flex gap-3 rounded-card p-3 transition-colors hover:bg-white/5"
                            >
                              <span
                                aria-hidden
                                className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-600/40 text-gold-300 transition-colors group-hover:bg-gold-500 group-hover:text-night-900"
                              >
                                {service.icon}
                              </span>
                              <span>
                                <span className="block font-semibold text-white">
                                  {service.name}
                                </span>
                                <span className="mt-0.5 block text-xs leading-snug text-white/60">
                                  {service.blurb}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
              {navItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? 'page' : undefined}
                    className="inline-flex min-h-11 items-center rounded-full px-3 transition-colors hover:text-white aria-[current=page]:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {actions}
            <button
              type="button"
              onClick={openMobile}
              aria-label={labels.openMenu}
              aria-haspopup="dialog"
              className="grid size-11 place-items-center rounded-full text-white hover:bg-white/10 lg:hidden"
            >
              <Menu aria-hidden className="size-6" />
            </button>
          </div>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        aria-label={labels.main}
        onClose={() => {
          document.documentElement.style.overflow = ''
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-night-950 text-white backdrop:bg-transparent lg:hidden"
      >
        <div className="grain flex min-h-full flex-col">
          <div className="container-site flex h-18 items-center justify-between">
            {logo}
            <button
              type="button"
              onClick={closeMobile}
              aria-label={labels.closeMenu}
              className="grid size-11 place-items-center rounded-full hover:bg-white/10"
            >
              <X aria-hidden className="size-6" />
            </button>
          </div>
          <nav aria-label={labels.main} className="container-site flex-1 py-6">
            <ul className="space-y-1 font-display text-3xl font-semibold">
              <li>
                <Link href="/services" className="block py-2" onClick={closeMobile}>
                  {labels.services}
                </Link>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pb-4 font-sans text-sm font-medium text-white/70">
                  {services.map((service) => (
                    <li key={service.key}>
                      <Link
                        href={service.href}
                        className="flex min-h-11 items-center"
                        onClick={closeMobile}
                      >
                        {service.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              {navItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? 'page' : undefined}
                    className="block py-2 aria-[current=page]:text-gold-300"
                    onClick={closeMobile}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="container-site border-t border-white/10 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {mobileFooter}
          </div>
        </div>
      </dialog>
    </>
  )
}
