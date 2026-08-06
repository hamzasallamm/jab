import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-xs font-semibold uppercase tracking-wider text-steel-light">{label}</span>
      {children}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="rounded border border-steel bg-black/30 px-3 py-2 text-bone placeholder:text-steel-light focus:border-jab-red focus:outline-none"
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="rounded border border-steel bg-black/30 px-3 py-2 text-bone focus:border-jab-red focus:outline-none"
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
      ? 'bg-jab-red text-bone hover:bg-jab-red-dark'
      : 'border border-steel text-bone hover:border-bone'
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-jab-red">{children}</p>
}
