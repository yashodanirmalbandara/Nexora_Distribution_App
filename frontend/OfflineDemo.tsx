import { useState } from 'react'
import ThemeToggle from './components/ThemeToggle'

export default function OfflineDemo({ isDark, onToggleDark, onBack }: { isDark: boolean; onToggleDark: () => void; onBack: () => void }) {
  const [syncPhase, setSyncPhase] = useState<'offline' | 'restoring' | 'synced'>('offline')
  const [pendingCount, setPendingCount] = useState(7)

  function simulate() {
    setSyncPhase('restoring')
    let count = 7
    const t = setInterval(() => {
      count -= 1
      setPendingCount(count)
      if (count === 0) { clearInterval(t); setSyncPhase('synced') }
    }, 600)
  }

  return (
    <div className={`min-h-[100dvh] flex flex-col ${isDark ? 'dark' : ''} bg-slate-100 dark:bg-slate-900`}>
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white font-mono text-sm transition-colors">← Back</button>
          <h1 className="font-bold text-slate-800 dark:text-white text-base sm:text-lg">Offline / Degradation Scenario Demo</h1>
        </div>
        <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
        {/* Signal loss banner */}
        <div className={`rounded-2xl border-2 p-5 mb-6 flex items-start gap-4 transition-all duration-500 ${
          syncPhase === 'offline' ? 'border-red-400 bg-red-50 dark:bg-red-900/20' :
          syncPhase === 'restoring' ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' :
          'border-green-400 bg-green-50 dark:bg-green-900/20'
        }`}>
          <span className={`text-3xl shrink-0 ${syncPhase === 'restoring' ? 'animate-pulse' : ''}`}>
            {syncPhase === 'offline' ? '📵' : syncPhase === 'restoring' ? '🔄' : '✅'}
          </span>
          <div className="flex-1">
            <p className={`font-bold text-lg mb-1 ${
              syncPhase === 'offline' ? 'text-red-700 dark:text-red-300' :
              syncPhase === 'restoring' ? 'text-amber-700 dark:text-amber-300' :
              'text-green-700 dark:text-green-300'
            }`}>
              {syncPhase === 'offline' ? 'No Network — Hill Country Zone (Kandy–Nuwara Eliya)' :
               syncPhase === 'restoring' ? `Reconnected — Syncing ${pendingCount} pending actions…` :
               'Fully Synced — All actions committed to server'}
            </p>
            <p className={`text-sm ${
              syncPhase === 'offline' ? 'text-red-600 dark:text-red-400' :
              syncPhase === 'restoring' ? 'text-amber-600 dark:text-amber-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {syncPhase === 'offline'
                ? 'All actions are being saved locally. Status updates, delivery confirmations, and QR sign-offs will sync automatically when connectivity is restored.'
                : syncPhase === 'restoring'
                  ? 'Background sync in progress. The app continues to operate normally during sync. Data will not be duplicated.'
                  : 'Server confirmed receipt of all 7 locally cached actions. No data loss occurred during the offline period.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Offline action queue */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-white text-sm">Local Action Queue</span>
              <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                syncPhase === 'synced' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
              }`}>
                {syncPhase === 'synced' ? '0 pending' : `${pendingCount} pending`}
              </span>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {[
                { icon: '✓', label: 'Stop 1 Arrived — PLY-004', time: '07:12', synced: syncPhase === 'synced' || pendingCount < 7 },
                { icon: '✓', label: 'Stop 1 Unloading Started', time: '07:14', synced: syncPhase === 'synced' || pendingCount < 6 },
                { icon: '📋', label: 'Stop 1 Reference: REF-20260926-00441', time: '07:38', synced: syncPhase === 'synced' || pendingCount < 5 },
                { icon: '✓', label: 'Stop 2 Arrived — KDY-007', time: '09:22', synced: syncPhase === 'synced' || pendingCount < 4 },
                { icon: '⚑', label: 'Damage Report — Dairy Cases x3', time: '09:28', synced: syncPhase === 'synced' || pendingCount < 3 },
                { icon: '✓', label: 'Stop 2 Unloading Started', time: '09:31', synced: syncPhase === 'synced' || pendingCount < 2 },
                { icon: '📋', label: 'Stop 2 Reference: REF-20260926-00448', time: '09:55', synced: syncPhase === 'synced' || pendingCount < 1 },
              ].map((action, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-base w-6 text-center shrink-0">{action.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{action.label}</p>
                    <p className="font-mono text-[10px] text-slate-400">{action.time}</p>
                  </div>
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                    action.synced
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}>
                    {action.synced ? '✓ synced' : '⋯ pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Device status */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-4">Device & Connectivity Status</h3>
              <div className="space-y-3">
                {[
                  { label: 'Network', value: syncPhase === 'offline' ? 'No Signal' : 'LTE · 3 bars', color: syncPhase === 'offline' ? 'text-red-500' : 'text-green-500' },
                  { label: 'Local Storage', value: '12.4 MB used / 50 MB available', color: 'text-teal-500' },
                  { label: 'Last Server Sync', value: syncPhase === 'synced' ? 'Just now' : '47 minutes ago', color: 'text-slate-500 dark:text-slate-400' },
                  { label: 'GPS', value: 'Active — 4m accuracy', color: 'text-emerald-500' },
                  { label: 'Battery', value: '68%', color: 'text-amber-500' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
                    <span className={`font-mono text-xs font-medium ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* System guarantees */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-3">Offline Guarantees</h3>
              <div className="space-y-2">
                {[
                  'All stop status updates (Arrived / Unloading / Complete) saved locally',
                  'QR reference numbers accepted and stored offline',
                  'Damage / shortage reports queued for sync',
                  'Route and stop data pre-loaded before departure',
                  'Duplicate-safe: server deduplicates on reconnect',
                ].map((g, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-teal-500 text-sm shrink-0 mt-0.5">✓</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{g}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulate button */}
            {syncPhase === 'offline' && (
              <button
                onClick={simulate}
                className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-base transition-colors active:scale-[0.98]"
              >
                Simulate Network Restore →
              </button>
            )}
            {syncPhase === 'synced' && (
              <div className="text-center py-4 text-green-600 dark:text-green-400 font-semibold">
                ✅ Sync complete — no data lost
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
