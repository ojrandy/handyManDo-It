import type React from 'react'

// Stylised Cameroon outline (Natural Earth, public domain, simplified and projected to a
// 300-unit-wide viewBox) with the towns we serve. The three home cities light first, then the
// rest fan out (CSS scroll-driven animation; static where unsupported or under reduced motion).
const OUTLINE =
  'M182.9 422.3L177.9 420.2L154.3 425.3L130.1 420L111.1 422.6L46.3 421.7L52.1 390.2L36.5 363.8L18.3 357.1L10.2 339.2L0 333.5L0.5 322.5L10.7 294.2L29.7 255.8L41.2 255.4L65 232.1L80.1 231.4L102.5 247.8L129.9 234.4L133.6 217.8L142.5 201.7L148.7 181.6L170 165.1L178.1 137.2L186.6 128.3L192.2 107.6L202.7 82.2L236.3 51.3L238.4 38.1L242.8 30.9L227 15L228.3 2.3L239.5 0L255.4 25.5L258 52L256.6 78.5L278.3 114.7L256 114.3L244.8 117.2L226.6 113.2L217.9 132L241.5 155.2L258.8 162L264.4 178.5L277 206L270.8 216.8L250.7 257.2L241.1 264.4L238.1 295.4L242 312.2L238.8 324L257.7 344.9L261.1 359.2L275.8 379.7L294 392.6L295.8 410.8L300 422.3L297.1 443.8L265.5 434.4L233.2 423.9L182.9 422.3Z'

// [x, y, name, isHomeCity]; names are proper nouns, identical in both locales.
const TOWNS: [number, number, string, boolean][] = [
  [48.3, 351.3, 'Douala', true],
  [30, 347.3, 'Buea', true],
  [120.9, 358.4, 'Yaoundé', true],
  [28.8, 352.4, 'Limbe', false],
  [38.3, 327.7, 'Kumba', false],
  [66.2, 275.1, 'Bamenda', false],
  [77, 294.2, 'Bafoussam', false],
  [62.2, 295.4, 'Dschang', false],
  [57.9, 315.4, 'Nkongsamba', false],
  [65.4, 361.2, 'Edéa', false],
  [56.7, 395.5, 'Kribi', false],
  [106.1, 397.1, 'Ebolowa', false],
  [207, 330.1, 'Bertoua', false],
  [203, 220.9, 'Ngaoundéré', false],
  [195.8, 141.9, 'Garoua', false],
  [232.5, 90.5, 'Maroua', false],
]

export function CameroonMap({ label, className = '' }: { label: string; className?: string }) {
  return (
    <svg
      viewBox="-12 -12 324 468"
      role="img"
      aria-label={label}
      className={`town-map ${className}`}
    >
      <path
        d={OUTLINE}
        className="fill-teal-600/25 stroke-teal-400/60"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {TOWNS.map(([x, y, name, home], index) => (
        <g
          key={name}
          className="town-light"
          // Order in the list = order of lighting; the home cities come first.
          style={{ '--i': index } as React.CSSProperties}
        >
          {home ? <circle cx={x} cy={y} r="14" className="fill-gold-500/20" /> : null}
          <circle cx={x} cy={y} r={home ? 5.5 : 3.5} className="fill-gold-300" />
          {home ? (
            <text
              x={x + (name === 'Buea' ? -9 : 9)}
              y={y + (name === 'Buea' ? -10 : 4)}
              textAnchor={name === 'Buea' ? 'end' : 'start'}
              className="fill-white font-sans text-[13px] font-semibold"
            >
              {name}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  )
}
