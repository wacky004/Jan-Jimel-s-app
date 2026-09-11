export function BigButton({ children, onClick, variant = 'primary', disabled, className = '', type = 'button' }) {
  const styles = {
    primary: 'bg-gold-500 text-navy-950 active:bg-gold-400 shadow-lg shadow-gold-500/30',
    navy: 'bg-navy-800 text-white active:bg-navy-700 shadow-lg shadow-navy-900/20',
    outline: 'border-2 border-navy-200 bg-white text-navy-800 active:bg-navy-50',
    danger: 'border-2 border-red-200 bg-white text-red-600 active:bg-red-50',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`tap-target flex w-full items-center justify-center gap-3 rounded-2xl px-5 text-lg font-bold transition disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Stepper({ value, onChange, min = 0, step = 1 }) {
  const dec = () => onChange(Math.max(min, Number(value) - step))
  const inc = () => onChange(Number(value) + step)
  const onInput = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '')
    onChange(raw === '' ? min : Math.max(min, parseInt(raw, 10)))
  }
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={dec}
        className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-navy-200 bg-white text-2xl font-bold text-navy-800 active:bg-navy-50"
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min={min}
        value={value}
        onChange={onInput}
        onFocus={(e) => e.target.select()}
        className="h-14 w-16 rounded-2xl border-2 border-navy-100 bg-white text-center text-xl font-bold text-navy-900 outline-none focus:border-gold-500"
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={inc}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-2xl font-bold text-white active:bg-navy-700"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  )
}

export function TopBar({ title, onBack, right }) {
  return (
    <header className="safe-top sticky top-0 z-40 flex items-center gap-3 border-b border-navy-100 bg-white/95 px-4 py-3 backdrop-blur">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-navy-100 text-xl font-bold text-navy-800 active:bg-navy-50"
          aria-label="Back"
        >
          ←
        </button>
      )}
      <h1 className="flex-1 truncate text-xl font-bold text-navy-900">{title}</h1>
      {right}
    </header>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold tracking-wide text-navy-700 uppercase">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-2xl border-2 border-navy-100 bg-white px-4 py-4 text-lg text-navy-900 placeholder-navy-300 outline-none focus:border-gold-500'

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/60 backdrop-blur-sm sm:items-center">
      <div className="safe-bottom flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
          <h2 className="text-lg font-bold text-navy-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl text-navy-400 active:bg-navy-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-navy-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-navy-200 bg-white/60 px-6 py-12 text-center">
      <div className="text-5xl">{icon}</div>
      <p className="mt-3 text-lg font-bold text-navy-800">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}
    </div>
  )
}

export function MoneyInput({ value, onChange, placeholder = '0.00' }) {
  return (
    <div className="flex items-center rounded-2xl border-2 border-navy-100 bg-white px-4 focus-within:border-gold-500">
      <span className="mr-2 text-lg font-bold text-navy-400">P</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent py-4 text-lg font-semibold text-navy-900 outline-none"
      />
    </div>
  )
}
