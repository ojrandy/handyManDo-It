import React from 'react'

type Item = { title: string; body: string }

type Props = {
  id: string
  title: string
  intro?: string
  items: Item[]
  // Numbered steps (an ordered list) instead of cards.
  numbered?: boolean
  tone?: 'white' | 'mist'
  columns?: 2 | 3 | 4
  children?: React.ReactNode
}

const grid = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-2 lg:grid-cols-4' }

// Heading + cards, or numbered steps, on a light band. Inner pages' benefits, features and
// "how it works" blocks (businesses, become a pro, careers).
export function CardGrid({
  id,
  title,
  intro,
  items,
  numbered = false,
  tone = 'white',
  columns = 3,
  children,
}: Props) {
  const List = numbered ? 'ol' : 'ul'
  return (
    <section
      aria-labelledby={id}
      className={`py-16 md:py-24 ${tone === 'mist' ? 'bg-mist-50' : 'bg-white'}`}
    >
      <div className="container-site">
        <h2 id={id} className="max-w-3xl text-3xl font-bold text-teal-700 sm:text-4xl">
          {title}
        </h2>
        {intro ? <p className="mt-4 max-w-2xl text-lg text-slate-500">{intro}</p> : null}
        <List className={`mt-10 grid gap-5 ${grid[columns]}`}>
          {items.map(({ title: itemTitle, body }, index) => (
            <li
              key={itemTitle}
              className={`rounded-panel p-6 ring-1 ring-mist-200 ${
                tone === 'mist' ? 'bg-white' : 'bg-mist-50'
              }`}
            >
              {numbered ? (
                <span
                  aria-hidden
                  className="mb-5 grid size-10 place-items-center rounded-full bg-gold-500 font-display font-bold text-night-900"
                >
                  {index + 1}
                </span>
              ) : null}
              <h3 className="font-display text-lg font-semibold text-teal-700">{itemTitle}</h3>
              <p className="mt-2 leading-relaxed text-slate-500">{body}</p>
            </li>
          ))}
        </List>
        {children}
      </div>
    </section>
  )
}
