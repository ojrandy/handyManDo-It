'use client'

import React, { useId, useRef, useState } from 'react'

export type EarnTab = {
  key: string
  label: string
  title: string
  points: string[]
  icon: React.ReactNode
}

type Props = {
  label: string
  tabs: EarnTab[]
  // Shown at the foot of every panel (payment methods), rendered on the server.
  footer?: React.ReactNode
}

// ARIA tabs pattern (FR-HOME-13): roving tabindex, arrow keys / Home / End move between tabs,
// and panels are labelled by their tab.
export function EarnTabs({ label, tabs, footer }: Props) {
  const [selected, setSelected] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const baseId = useId()

  const focusTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length
    setSelected(next)
    tabRefs.current[next]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: selected + 1,
      ArrowLeft: selected - 1,
      Home: 0,
      End: tabs.length - 1,
    }
    if (!(event.key in keys)) return
    event.preventDefault()
    focusTab(keys[event.key])
  }

  // The column stretches to the height of the copy beside it, so the panel ends level with the
  // "Start earning" button on desktop.
  return (
    <div className="flex flex-col">
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="inline-flex self-start rounded-full bg-white/5 p-1 ring-1 ring-white/10"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            ref={(element) => {
              tabRefs.current[index] = element
            }}
            id={`${baseId}-tab-${tab.key}`}
            role="tab"
            type="button"
            aria-selected={selected === index}
            aria-controls={`${baseId}-panel-${tab.key}`}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
            className="min-h-11 rounded-full px-5 text-sm font-semibold text-white/75 transition-colors hover:text-white aria-selected:bg-gold-500 aria-selected:text-night-900"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.key}
          id={`${baseId}-panel-${tab.key}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab.key}`}
          hidden={selected !== index}
          tabIndex={0}
          // `flex` only while shown, or it would override the `hidden` attribute.
          className="mt-8 flex-1 flex-col rounded-panel bg-white/5 p-8 ring-1 ring-white/10 not-[[hidden]]:flex"
        >
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-card bg-gold-500 text-night-900">
              {tab.icon}
            </span>
            <h3 className="text-2xl font-bold text-white">{tab.title}</h3>
          </div>
          <ul className="mt-6 space-y-3">
            {tab.points.map((point) => (
              <li key={point} className="flex gap-3 text-white/80">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-300" />
                {point}
              </li>
            ))}
          </ul>
          {footer ? (
            // pt-8 keeps the gap on phones, where the panel does not stretch.
            <div className="mt-auto pt-8">
              <div className="border-t border-white/10 pt-6">{footer}</div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
