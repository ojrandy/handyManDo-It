type Props = {
  time: string
  className?: string
}

// iOS-style status bar for the HTML app screens (captured screenshots carry their own). Drawn in
// currentColor, so it follows the screen's light or dark text. Decorative.
export function StatusBar({ time, className = '' }: Props) {
  return (
    <div
      aria-hidden
      className={`flex h-10 shrink-0 items-end justify-between px-6 pb-1.5 text-[11px] font-semibold tracking-tight ${className}`}
    >
      <span className="w-10 text-center">{time}</span>
      <span className="flex items-center gap-[0.3em]">
        <svg viewBox="0 0 17 11" className="h-[0.7em] w-auto" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="0.7" />
          <rect x="4.6" y="4.8" width="3" height="6.2" rx="0.7" />
          <rect x="9.2" y="2.4" width="3" height="8.6" rx="0.7" />
          <rect x="13.8" y="0" width="3" height="11" rx="0.7" />
        </svg>
        <svg viewBox="0 0 16 12" className="h-[0.7em] w-auto" fill="currentColor">
          <path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.2-1.2A10.3 10.3 0 0 0 8 .6 10.3 10.3 0 0 0 .8 3.5L2 4.7a8.6 8.6 0 0 1 6-2.4Zm0 3.5c1.4 0 2.7.5 3.6 1.4l1.2-1.2A6.9 6.9 0 0 0 8 4.1 6.9 6.9 0 0 0 3.2 6L4.4 7.2A5.2 5.2 0 0 1 8 5.8Zm0 3.4c.5 0 1 .2 1.4.6L8 11.3 6.6 9.8c.4-.4.9-.6 1.4-.6Z" />
        </svg>
        <svg viewBox="0 0 26 12" className="h-[0.75em] w-auto" fill="currentColor">
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="11"
            rx="3"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.4"
          />
          <rect x="2" y="2" width="17" height="8" rx="1.6" />
          <rect x="24" y="4" width="1.6" height="4" rx="0.8" fillOpacity="0.4" />
        </svg>
      </span>
    </div>
  )
}
