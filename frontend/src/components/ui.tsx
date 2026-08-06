import type { FocusEvent, InputHTMLAttributes, MouseEvent, ReactNode, SelectHTMLAttributes } from 'react'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-xs font-semibold uppercase tracking-wider text-steel-light">{label}</span>
      {children}
    </label>
  )
}

export function TextInput({ onFocus, onMouseUp, className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  // Number inputs default to controlled values like "0" — without selecting the
  // existing digits, typing appends to them (e.g. "0" + "12" -> "120") instead of
  // replacing them. `focus` only fires when focus moves onto the field, so a
  // second click on an already-focused field needs the same select() on mouseup
  // (which runs after the browser's own click-to-place-cursor behavior).
  function handleFocus(e: FocusEvent<HTMLInputElement>) {
    if (props.type === 'number') e.target.select()
    onFocus?.(e)
  }

  function handleMouseUp(e: MouseEvent<HTMLInputElement>) {
    if (props.type === 'number') e.currentTarget.select()
    onMouseUp?.(e)
  }

  return (
    <input
      {...props}
      onFocus={handleFocus}
      onMouseUp={handleMouseUp}
      className={`w-full min-w-0 rounded border border-steel bg-surface px-3 py-2 text-bone placeholder:text-steel-light focus:border-jab focus:outline-none ${className}`}
    />
  )
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded border border-steel bg-surface px-3 py-2 text-bone focus:border-jab focus:outline-none ${className}`}
    />
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: { children: ReactNode; variant?: 'primary' | 'ghost'; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'font-display text-lg tracking-wide px-6 py-2.5 rounded transition-colors disabled:opacity-50'
  const styles =
    variant === 'primary'
      ? 'bg-jab text-bone hover:bg-jab-dark'
      : 'border border-steel text-bone hover:border-bone'
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-jab">{children}</p>
}
