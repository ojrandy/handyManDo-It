import React from 'react'

type Props = {
  id: string
  eyebrow: string
  title: string
  intro?: React.ReactNode
  tone?: 'light' | 'dark'
  align?: 'start' | 'center'
  className?: string
}

// Eyebrow + H2 (+ intro) used by every home section. `id` labels the section via
// aria-labelledby.
export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  tone = 'light',
  align = 'start',
  className = '',
}: Props) {
  const dark = tone === 'dark'
  return (
    <div className={`${align === 'center' ? 'mx-auto text-center' : ''} max-w-3xl ${className}`}>
      <p
        className={`mb-4 text-sm font-semibold tracking-[0.2em] uppercase ${
          dark ? 'text-gold-300' : 'text-teal-600'
        }`}
      >
        {eyebrow}
      </p>
      <h2
        id={id}
        className={`text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl ${
          dark ? 'text-white' : 'text-teal-700'
        }`}
      >
        {title}
      </h2>
      {intro ? (
        <p className={`mt-5 text-lg leading-relaxed ${dark ? 'text-white/75' : 'text-slate-500'}`}>
          {intro}
        </p>
      ) : null}
    </div>
  )
}
