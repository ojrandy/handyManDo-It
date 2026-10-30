'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

type Option = { value: string; label: string }

// One row of toggle buttons. `key` names the item tag it filters on.
export type FilterGroup = { key: string; label: string; options: Option[] }

type Item = { id: string; tags: Record<string, string | null>; node: React.ReactNode }

type Props = {
  items: Item[]
  groups: FilterGroup[]
  // Message namespace holding `all` and `count` (ICU plural).
  namespace: 'servicesPage.filter' | 'workPage.filter'
  listClassName?: string
}

// Grid with toggle-button filters (FR-PG-01, FR-PG-07). Without JS every item stays visible. The
// result count is announced politely so screen-reader users hear the effect of a filter. Options
// without items are dropped, and a group left with one option is not shown.
export function FilterableGrid({
  items,
  groups,
  namespace,
  listClassName = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
}: Props) {
  const t = useTranslations(namespace)
  const [active, setActive] = useState<Record<string, string | null>>({})
  const shown = items.filter((item) =>
    Object.entries(active).every(([key, value]) => !value || item.tags[key] === value),
  )
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      options: group.options.filter(({ value }) =>
        items.some((item) => item.tags[group.key] === value),
      ),
    }))
    .filter(({ options }) => options.length > 1)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          {visibleGroups.map(({ key, label, options }) => (
            <div key={key} role="group" aria-label={label} className="flex flex-wrap gap-2">
              {[{ value: null, label: t('all') }, ...options].map(({ value, label: text }) => (
                <button
                  key={value ?? 'all'}
                  type="button"
                  aria-pressed={(active[key] ?? null) === value}
                  onClick={() => setActive((current) => ({ ...current, [key]: value }))}
                  className="min-h-11 rounded-full px-5 text-sm font-semibold text-teal-700 ring-1 ring-teal-600/25 transition-colors hover:bg-teal-600/5 aria-pressed:bg-teal-600 aria-pressed:text-white aria-pressed:ring-teal-600"
                >
                  {text}
                </button>
              ))}
            </div>
          ))}
        </div>
        <p aria-live="polite" className="text-sm text-slate-500">
          {t('count', { count: shown.length })}
        </p>
      </div>
      <ul className={`mt-10 ${listClassName}`}>
        {shown.map(({ id, node }) => (
          <li key={id} className="break-inside-avoid">
            {node}
          </li>
        ))}
      </ul>
    </>
  )
}
