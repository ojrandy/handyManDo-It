'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useId, useState } from 'react'

type Item = {
  id: string
  // Title + excerpt + category names, for the search box.
  text: string
  categories: string[]
  node: React.ReactNode
}

type Props = {
  items: Item[]
  categories: { value: string; label: string }[]
}

// Case- and accent-insensitive: "renovation" finds "Rénovation".
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/**
 * Blog index list (FR-PG-11): search box + category toggles over the pre-rendered posts, no
 * server search (ADR-024). Without JS every post stays listed. The result count is announced
 * politely.
 */
export function BlogList({ items, categories }: Props) {
  const t = useTranslations('blogPage')
  const id = useId()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const words = fold(query).split(/\s+/).filter(Boolean)
  const shown = items.filter(
    (item) =>
      (!category || item.categories.includes(category)) &&
      words.every((word) => fold(item.text).includes(word)),
  )
  const options = categories.filter(({ value }) =>
    items.some((item) => item.categories.includes(value)),
  )

  return (
    <>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full max-w-md">
          <label
            htmlFor={`${id}-search`}
            className="mb-2 block text-sm font-semibold text-teal-700"
          >
            {t('search')}
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-500"
            />
            <input
              id={`${id}-search`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="block w-full rounded-full border border-mist-200 bg-white py-3 pr-4 pl-12 text-ink placeholder:text-slate-500/70"
            />
          </div>
        </div>
        {options.length > 1 ? (
          <div role="group" aria-label={t('filter.label')} className="flex flex-wrap gap-2">
            {[{ value: null, label: t('filter.all') }, ...options].map(({ value, label }) => (
              <button
                key={value ?? 'all'}
                type="button"
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
                className="min-h-11 rounded-full px-5 text-sm font-semibold text-teal-700 ring-1 ring-teal-600/25 transition-colors hover:bg-teal-600/5 aria-pressed:bg-teal-600 aria-pressed:text-white aria-pressed:ring-teal-600"
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <p aria-live="polite" className="mt-6 text-sm font-semibold text-slate-500">
        {t('filter.count', { count: shown.length })}
      </p>

      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item) => (
          <li key={item.id}>{item.node}</li>
        ))}
      </ul>
    </>
  )
}
