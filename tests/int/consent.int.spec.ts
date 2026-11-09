// @vitest-environment jsdom
import { act, createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { consentKey, openEvent, track } from '@/lib/analytics'

import en from '../../src/messages/en.json'

// The banner's privacy link needs next-intl's router context; a plain anchor stands in.
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: unknown }) =>
    createElement('a', { href, ...rest }, children as never),
}))

// Node 24's own (unconfigured) localStorage shadows jsdom's; an in-memory one stands in.
const store = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, String(value)),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
})

const { ConsentBanner } = await import('@/components/consent/ConsentBanner')
const { startAnalytics } = await import('@/components/consent/runtime')

// React's own act + createRoot and plain DOM lookups (@testing-library/dom is not installed).
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | null = null
const render = (element: ReactElement) => {
  const container = document.body.appendChild(document.createElement('div'))
  root = createRoot(container)
  act(() => root!.render(element))
}
const cleanup = () => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
}
const banner = () => document.querySelector(`section[aria-label="${en.consent.label}"]`)
const button = (name: string) =>
  [...document.querySelectorAll('button')].find((b) => b.textContent === name)!
const click = (element: HTMLElement) => act(() => element.click())

const gtagScripts = () =>
  [...document.querySelectorAll('script')].filter((s) => s.src.includes('googletagmanager'))

// FR-ANA-01/02, ADR-036.
describe('consent and GA4', () => {
  let stop: () => void
  const showBanner = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    document.head.innerHTML = ''
    delete window.gtag
    delete window.dataLayer
    delete window.hmEvents
    showBanner.mockClear()
    stop = startAnalytics({
      gaId: 'G-TEST123',
      webAppUrl: 'https://app.handymandoit.com',
      showBanner,
    })
  })

  afterEach(() => {
    stop()
    cleanup()
  })

  it('queues events until a choice, then sends them to GA4 on accept', () => {
    render(createElement(ConsentBanner, { gaId: 'G-TEST123', labels: en.consent }))
    expect(banner()).toBeTruthy()

    track('faq_open', { question: 'How do I pay?' })
    expect(window.hmEvents).toHaveLength(1)
    expect(gtagScripts()).toHaveLength(0)
    expect(window.dataLayer).toBeUndefined()

    click(button(en.consent.accept))
    expect(localStorage.getItem(consentKey)).toBe('granted')
    expect(gtagScripts()).toHaveLength(1)
    const calls = (window.dataLayer ?? []).map((args) => [...(args as IArguments)])
    expect(calls[0]).toEqual([
      'consent',
      'default',
      {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      },
    ])
    expect(calls).toContainEqual(['consent', 'update', { analytics_storage: 'granted' }])
    expect(calls).toContainEqual(['event', 'faq_open', { question: 'How do I pay?' }])
    expect(window.hmEvents).toEqual([])
    expect(banner()).toBeNull()
  })

  it('drops queued events and never loads GA4 on reject', () => {
    render(createElement(ConsentBanner, { gaId: 'G-TEST123', labels: en.consent }))
    track('call_click', { placement: 'footer' })
    click(button(en.consent.reject))
    expect(localStorage.getItem(consentKey)).toBe('denied')
    expect(window.hmEvents).toEqual([])
    track('call_click', { placement: 'footer' })
    expect(window.hmEvents).toEqual([])
    expect(gtagScripts()).toHaveLength(0)
  })

  it('stays hidden once chosen and reopens from the footer button with focus', () => {
    localStorage.setItem(consentKey, 'denied')
    render(createElement(ConsentBanner, { gaId: 'G-TEST123', labels: en.consent }))
    expect(banner()).toBeNull()

    const footerButton = document.createElement('button')
    footerButton.setAttribute('data-consent-open', '')
    document.body.append(footerButton)
    act(() => footerButton.click())

    expect(document.activeElement?.textContent).toBe(en.consent.title)
    const analytics = [...document.querySelectorAll<HTMLInputElement>('input[type=checkbox]')].find(
      (input) => !input.disabled,
    )!
    expect(analytics.checked).toBe(false)
    click(analytics)
    click(button(en.consent.save))
    expect(localStorage.getItem(consentKey)).toBe('granted')
    footerButton.remove()
  })

  it('opens with the details when loaded by "Cookie settings" after a choice', () => {
    localStorage.setItem(consentKey, 'granted')
    render(createElement(ConsentBanner, { gaId: 'G-TEST123', labels: en.consent, reopen: true }))
    expect(banner()).toBeTruthy()
    expect(document.activeElement?.textContent).toBe(en.consent.title)
    expect(button(en.consent.save)).toBeTruthy()
    click(button(en.consent.reject))
    expect(localStorage.getItem(consentKey)).toBe('denied')
    // Reopening again goes through the banner's own listener.
    act(() => window.dispatchEvent(new Event(openEvent)))
    expect(banner()).toBeTruthy()
  })

  it('asks for the banner only without a saved choice, and again from the footer', () => {
    expect(showBanner).toHaveBeenCalledWith(false)
    stop()
    showBanner.mockClear()
    localStorage.setItem(consentKey, 'denied')
    stop = startAnalytics({
      gaId: 'G-TEST123',
      webAppUrl: 'https://app.handymandoit.com',
      showBanner,
    })
    expect(showBanner).not.toHaveBeenCalled()
    const footerButton = document.createElement('button')
    footerButton.setAttribute('data-consent-open', '')
    document.body.append(footerButton)
    footerButton.click()
    expect(showBanner).toHaveBeenCalledWith(true)
  })

  it('never asks for a banner when no GA ID is configured', () => {
    stop()
    showBanner.mockClear()
    stop = startAnalytics({ gaId: null, webAppUrl: 'https://app.handymandoit.com', showBanner })
    expect(showBanner).not.toHaveBeenCalled()
  })
})
