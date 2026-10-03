import { useState, useEffect } from 'react'

type NetworkState = 'online' | 'offline' | 'flaky'
type ActionType = 'pod_submission' | 'item_flag' | 'order_status' | 'receipt_confirm'

interface QueuedAction {
  id: string
  type: ActionType
  source: 'Driver App' | 'Loader App' | 'Store App'
  payload: string
  timestamp: string
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  retryCount: number
}

const INITIAL_QUEUE: QueuedAction[] = [
  {
    id: 'act-801',
    type: 'pod_submission',
    source: 'Driver App',
    payload: 'PLY-004 · Signee: D. Perera · REF-20261003-88192 · Photo attached',
    timestamp: '17:42:10',
    status: 'pending',
    retryCount: 0,
  },
  {
    id: 'act-802',
    type: 'item_flag',
    source: 'Loader App',
    payload: 'VH-01 · Damaged Packaging · Fresh Dairy Milk 1L (2 cases)',
    timestamp: '17:45:32',
    status: 'pending',
    retryCount: 0,
  },
  {
    id: 'act-803',
    type: 'order_status',
    source: 'Driver App',
    payload: 'VH-01 · Stop #2 arrived at Cargills Maharagama (MGM-011)',
    timestamp: '18:01:15',
    status: 'pending',
    retryCount: 0,
  },
]

export default function OfflineDemo({
  onSwitchView,
  isDark = false,
  onToggleDark,
}: {
  onSwitchView?: () => void
  isDark?: boolean
  onToggleDark?: () => void
}) {
  const [network, setNetwork] = useState<NetworkState>('offline')
  const [queue, setQueue] = useState<QueuedAction[]>(INITIAL_QUEUE)
  const [isSyncing, setIsSyncing] = useState(false)
  const [storageUsed] = useState(14.8) // MB
  const [cachedTiles] = useState(1420)
  const [logs, setLogs] = useState<string[]>([
    '[17:30:00] ServiceWorker registered successfully (v2.4.1).',
    '[17:32:15] Precached core assets: route maps, product catalog, offline forms.',
    '[17:42:10] Connection lost. Redirecting mutation [POD Submission] to IndexedDB.',
    '[17:45:32] Local Queue: Action #802 recorded offline.',
    '[18:01:15] Local Queue: Action #803 recorded offline.',
  ])

  // Auto-sync when network turns online
  useEffect(() => {
    if (network === 'online' && queue.some(a => a.status === 'pending')) {
      triggerSync()
    }
  }, [network])

  function addLog(msg: string) {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 40)])
  }

  function triggerSync() {
    if (isSyncing || network === 'offline') return
    setIsSyncing(true)
    addLog(`Network state [${network.toUpperCase()}]: Initializing sync sequence…`)

    setQueue(prev => prev.map(a => a.status === 'pending' ? { ...a, status: 'syncing' } : a))

    setTimeout(() => {
      if (network === 'flaky') {
        // Partial fail scenario
        setQueue(prev =>
          prev.map((a, i) =>
            i % 2 === 0
              ? { ...a, status: 'synced' }
              : { ...a, status: 'failed', retryCount: a.retryCount + 1 }
          )
        )
        addLog('Sync completed with warnings: 1 action failed due to packet loss (retry queued).')
      } else {
        // Full success
        setQueue(prev => prev.map(a => ({ ...a, status: 'synced' })))
        addLog('Sync successful: All local IndexedDB mutations pushed to Waypoint Hub.')
      }
      setIsSyncing(false)
    }, 2000)
  }

  function simulateNewOfflineAction(type: ActionType) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const id = `act-${Math.floor(Math.random() * 900) + 100}`

    let newAction: QueuedAction
    if (type === 'pod_submission') {
      newAction = {
        id,
        type: 'pod_submission',
        source: 'Driver App',
        payload: `KDY-007 · Signee: K. Bandara · REF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`,
        timestamp: timeStr,
        status: 'pending',
        retryCount: 0,
      }
    } else if (type === 'item_flag') {
      newAction = {
        id,
        type: 'item_flag',
        source: 'Loader App',
        payload: 'VH-01 · Quantity Short · Chilled Beverages (1 case missing)',
        timestamp: timeStr,
        status: 'pending',
        retryCount: 0,
      }
    } else if (type === 'receipt_confirm') {
      newAction = {
        id,
        type: 'receipt_confirm',
        source: 'Store App',
        payload: 'OUT-001 · Store receipt confirmed with zero discrepancies',
        timestamp: timeStr,
        status: 'pending',
        retryCount: 0,
      }
    } else {
      newAction = {
        id,
        type: 'order_status',
        source: 'Driver App',
        payload: 'VH-01 · Completed unloading at Keells Kandy City Centre',
        timestamp: timeStr,
        status: 'pending',
        retryCount: 0,
      }
    }

    setQueue(prev => [newAction, ...prev])
    addLog(`Local Mutation: Action #${id} [${newAction.source}] saved to offline queue.`)
  }

  function clearSynced() {
    setQueue(prev => prev.filter(a => a.status !== 'synced'))
    addLog('IndexedDB cleanup: Purged synced records.')
  }

  const pendingCount = queue.filter(a => a.status === 'pending' || a.status === 'failed').length

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-[100dvh] bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-3 sm:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Top Header */}
          <header className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-violet-500/20">
                  ⚡
                </div>
                <div>
                  <h1 className="font-bold text-slate-900 dark:text-white text-xl">Offline First Engine</h1>
                  <p className="font-mono text-xs text-slate-400 mt-0.5">IndexedDB local queue & PWA Sync inspection terminal</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {onToggleDark && (
                <button
                  onClick={onToggleDark}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-mono text-xs hover:border-slate-300 transition-colors"
                >
                  {isDark ? '☀ Light' : '☾ Dark'}
                </button>
              )}
              {onSwitchView && (
                <button
                  onClick={onSwitchView}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-mono text-xs hover:border-slate-300 transition-colors"
                >
                  ⇄ Switch App
                </button>
              )}
            </div>
          </header>

          {/* Interactive Network Simulator Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-slate-400">Simulate Connection</span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                  network === 'online' ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : network === 'flaky' ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300'
                }`}>
                  {network.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['online', 'flaky', 'offline'] as NetworkState[]).map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      setNetwork(st)
                      addLog(`Simulated network state switched to [${st.toUpperCase()}].`)
                    }}
                    className={`py-2.5 rounded-xl border font-mono text-xs font-semibold capitalize transition-all ${
                      network === st
                        ? st === 'online' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                          : st === 'flaky' ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                          : 'bg-red-600 border-red-600 text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <p className="font-mono text-[11px] text-slate-400">
                {network === 'offline' && 'Requests are stored locally in IndexedDB without network attempts.'}
                {network === 'flaky' && '30% packet loss simulated; triggers background retry logic.'}
                {network === 'online' && 'Real-time WebSocket & HTTP API active; auto-flushes queued mutations.'}
              </p>
            </div>

            {/* Storage Quota */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
              <span className="font-mono text-xs uppercase text-slate-400 block">PWA Cache & Local Storage</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-slate-200 dark:border-slate-600">
                  <div className="font-mono text-xl font-bold text-slate-800 dark:text-white">{storageUsed} MB</div>
                  <div className="font-mono text-[10px] text-slate-400 uppercase mt-0.5">IndexedDB Used</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-slate-200 dark:border-slate-600">
                  <div className="font-mono text-xl font-bold text-slate-800 dark:text-white">{cachedTiles}</div>
                  <div className="font-mono text-[10px] text-slate-400 uppercase mt-0.5">Offline Map Tiles</div>
                </div>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                <span>ServiceWorker Status:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active (sw-v2.4)</span>
              </div>
            </div>

            {/* Action Triggers */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
              <span className="font-mono text-xs uppercase text-slate-400 block">Simulate Offline Field Action</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => simulateNewOfflineAction('pod_submission')}
                  className="p-2.5 rounded-xl border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-medium text-xs text-left hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
                >
                  + Sign POD
                </button>
                <button
                  onClick={() => simulateNewOfflineAction('item_flag')}
                  className="p-2.5 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium text-xs text-left hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  + Flag Item
                </button>
                <button
                  onClick={() => simulateNewOfflineAction('order_status')}
                  className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium text-xs text-left hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  + Update Status
                </button>
                <button
                  onClick={() => simulateNewOfflineAction('receipt_confirm')}
                  className="p-2.5 rounded-xl border border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-medium text-xs text-left hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                >
                  + Store Receipt
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area: Queue & Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Offline Queue Inspection */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-white text-base">IndexedDB Sync Queue</h2>
                  <p className="font-mono text-xs text-slate-400 mt-0.5">{pendingCount} pending mutation{pendingCount === 1 ? '' : 's'} waiting for connection</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={clearSynced}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 font-mono text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Purge Synced
                  </button>
                  <button
                    onClick={triggerSync}
                    disabled={isSyncing || network === 'offline'}
                    className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    {isSyncing ? '↻ Syncing…' : '⚡ Sync Now'}
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700/60 flex-1 overflow-y-auto max-h-[420px]">
                {queue.map(act => (
                  <div key={act.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                        act.status === 'synced' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : act.status === 'syncing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 animate-pulse'
                        : act.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {act.status === 'synced' ? '✓' : act.status === 'syncing' ? '⟳' : act.status === 'failed' ? '⚠' : '◷'}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">{act.id}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">{act.source}</span>
                          <span className="font-mono text-[10px] text-slate-400">{act.timestamp}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">{act.payload}</p>
                        {act.retryCount > 0 && (
                          <p className="font-mono text-[10px] text-red-500">Retry attempts: {act.retryCount}</p>
                        )}
                      </div>
                    </div>

                    <span className={`font-mono text-[10px] px-2.5 py-1 rounded-full border shrink-0 ${
                      act.status === 'synced' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300'
                      : act.status === 'syncing' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                      : act.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                    }`}>
                      {act.status}
                    </span>
                  </div>
                ))}

                {queue.length === 0 && (
                  <div className="py-16 text-center font-mono text-sm text-slate-400">
                    No queued actions in IndexedDB
                  </div>
                )}
              </div>
            </div>

            {/* Service Worker Event Log Stream */}
            <div className="lg:col-span-2 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-slate-300">SW & Sync Telemetry</span>
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              </div>

              <div className="p-4 font-mono text-[11px] leading-relaxed space-y-2 flex-1 overflow-y-auto max-h-[420px]">
                {logs.map((log, i) => (
                  <div key={i} className={`p-2 rounded border ${
                    log.includes('Connection lost') || log.includes('failed')
                      ? 'bg-red-950/40 border-red-900/50 text-red-300'
                      : log.includes('successful') || log.includes('registered')
                      ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300'
                      : log.includes('Switched') || log.includes('Initializing')
                      ? 'bg-amber-950/40 border-amber-900/50 text-amber-300'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300'
                  }`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}