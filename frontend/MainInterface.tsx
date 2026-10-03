import ThemeToggle from './components/ThemeToggle'
import type { Role } from './types'

const ROLES: { id: Role; icon: string; title: string; desc: string; badge: string }[] = [
  { id: 'dispatcher', icon: '◈', title: 'Dispatcher', badge: 'Desktop · 1440px', desc: 'Fleet allocation, order queue, live tracking & delivery confirmation' },
  { id: 'loader', icon: '⬡', title: 'Dock Loader', badge: 'Tablet · 1024px', desc: 'Sequential loading checklist, shortage flagging & dispatch sign-off' },
  { id: 'driver', icon: '◉', title: 'Delivery Driver', badge: 'Mobile · 390px', desc: 'Route map, stop sequence, QR sign-off & offline sync' },
  { id: 'store', icon: '◧', title: 'Store Manager', badge: 'Desktop / Tablet', desc: 'Order placement, incoming ETA, delivery receipt & QR reference generation' },
  { id: 'offline-demo', icon: '⚡', title: 'Offline / Degradation', badge: 'Demo', desc: 'Network loss scenario — local caching & background sync visualization' },
]

export default function MainInterface({ onSelect, isDark, onToggleDark }: {
  onSelect: (role: Role) => void; isDark: boolean; onToggleDark: () => void
}) {
  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-center gap-8 px-4 py-10 sm:p-8 ${isDark ? 'dark' : ''} bg-slate-950`}>
      <div className="text-center mb-2">
        <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-teal-900/50">
          <span className="text-white font-black text-3xl">W</span>
        </div>
        <h1 className="text-white font-bold text-2xl sm:text-3xl tracking-tight">Waypoint Logistics</h1>
        <p className="text-slate-400 font-mono text-sm mt-1.5">Enterprise Distribution Platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md md:max-w-3xl">
        {ROLES.map(r => (
          <button key={r.id} onClick={() => onSelect(r.id)}
            className={`bg-slate-800/80 border hover:border-teal-500/60 rounded-2xl p-4 text-left transition-all active:scale-[0.98] group ${
              r.id === 'offline-demo' ? 'border-amber-700/40 hover:border-amber-400/60 md:col-span-2' : 'border-slate-700/50'
            }`}>
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl shrink-0 transition-colors ${
                r.id === 'offline-demo' ? 'bg-amber-900/40 border-amber-700/60 text-amber-400' : 'bg-slate-700 border-slate-600/60 text-slate-300 group-hover:border-teal-600/40'
              }`}>{r.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-0.5">
                  <span className="font-bold text-white text-sm">{r.title}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-400">{r.badge}</span>
                </div>
                <p className="text-slate-400 text-xs leading-snug">{r.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-2 text-center">
        <ThemeToggle isDark={isDark} onToggle={onToggleDark} variant="onDark" />
        <p className="font-mono text-[10px] text-slate-500">Waypoint v2.1.0 · Authentication: Role-based login (Username / Password)</p>
      </div>
    </div>
  )
}
