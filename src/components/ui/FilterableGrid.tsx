'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

type Item = { id: string; category: string | null; node: React.ReactNode }

type Props = {
  items: Item[]
  // Filter values with their labels, in display order; only those with items are shown.
  filters: { value: string; label: string }[]
  // Message namespace holding `label`, `all` and `count` (ICU plural).
  namespace: 'servicesPage.filter'
}

// Grid with toggle-button filters (FR-PG-01). Without JS every item stays visible. The result
// count is announced politely so screen-reader users hear the effect of a filter.
export function FilterableGrid({ items, filters, namespace }: Props) {
  const t = useTranslations(namespace)
  const [active, setActive] = useState<string | null>(null)
  const shown = active ? items.filter((item) => item.category === active) : items
  const options = [
    { value: null, label: t('all') },
    ...filters.filter(({ value }) => items.some((item) => item.category === value)),
  ]

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label={t('label')} className="flex flex-wrap gap-2">
          {options.map(({ value, label }) => (
            <button
              key={value ?? 'all'}
              type="button"
              aria-pressed={active === value}
              onClick={() => setActive(value)}
              className="min-h-11 rounded-full px-5 text-sm font-semibold text-teal-700 ring-1 ring-teal-600/25 transition-colors hover:bg-teal-600/5 aria-pressed:bg-teal-600 aria-pressed:text-white aria-pressed:ring-teal-600"
            >
              {label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="text-sm text-slate-500">
          {t('count', { count: shown.length })}
        </p>
      </div>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map(({ id, node }) => (
          <li key={id}>{node}</li>
        ))}
      </ul>
    </>
  )
}
