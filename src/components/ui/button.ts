export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'solid' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-150 disabled:opacity-60'

const variants: Record<ButtonVariant, string> = {
  // Gold is reserved for primary CTAs on dark backgrounds (docs/design-system.md §2).
  primary: 'bg-gold-500 text-night-900 shadow-glow hover:bg-gold-300',
  secondary: 'border border-white/20 text-white hover:bg-white/10',
  ghost: 'text-white/85 hover:text-white',
  // Light (mist) sections.
  solid: 'bg-teal-600 text-white hover:bg-teal-500',
  outline: 'border border-teal-600/30 text-teal-700 hover:bg-teal-600/5',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'py-2 text-sm',
  md: 'py-3 text-sm sm:text-base',
  lg: 'py-3.5 text-base',
}

// Ghost buttons are text links in button form: no horizontal padding, so they align with copy.
const paddingX: Record<ButtonSize, string> = { sm: 'px-4', md: 'px-6', lg: 'px-7' }

// Shared button styling. A helper rather than a component so the same look applies to the
// i18n Link, external <a>, <button> and popover triggers without wrapper props.
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className = '',
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  const padding = variant === 'ghost' ? '' : paddingX[size]
  return `${base} ${variants[variant]} ${sizes[size]} ${padding} ${className}`.trim()
}
