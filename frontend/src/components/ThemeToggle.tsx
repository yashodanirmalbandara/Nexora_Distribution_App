export default function ThemeToggle({ isDark, onToggle, variant = 'default' }: {
  isDark: boolean
  onToggle: () => void
  variant?: 'default' | 'onDark'
}) {
  const styles =
    variant === 'onDark'
      ? 'border-slate-600 hover:border-teal-500 text-slate-300 hover:text-teal-300'
      : 'border-slate-200 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-500 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300'

  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors font-mono text-xs ${styles}`}
    >
      <span>{isDark ? '☀' : '☾'}</span>
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}
