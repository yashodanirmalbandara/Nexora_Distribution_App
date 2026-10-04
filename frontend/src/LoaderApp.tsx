import { useState, useEffect } from 'react'
import { api } from './api'

type ItemStatus = 'pending' | 'loaded' | 'flagged'
type BrandLabel = 'Waypoint Fresh' | 'Waypoint Style' | 'Waypoint Tech'
type FlagTag = 'Missing Item' | 'Damaged Packaging' | 'Wrong SKU' | 'Quantity Short'

interface LoadItem {
  id: string; description: string; cases: number; weightKg: number
  status: ItemStatus; flagNote?: string; flagTags?: FlagTag[]
}

interface LoadStop {
  loadingOrder: number; deliveryStop: number; outletId: string; outletName: string
  district: string; brand: BrandLabel; volumeM3: number; weightKg: number
  expanded: boolean; items: LoadItem[]
}

interface FlaggerState { stopId: number; itemId: string; itemDesc: string }

const VEHICLE = { id: '—', plate: '—', driver: '—', depot: '—', bay: '—', type: '—', maxWeight: 0, maxVolume: 0, trip: '—' }
const FLAG_TAGS: FlagTag[] = ['Missing Item', 'Damaged Packaging', 'Wrong SKU', 'Quantity Short']

function brandColors(brand: BrandLabel, dark: boolean) {
  if (brand === 'Waypoint Fresh') return { badge: dark ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60' : 'bg-emerald-100 text-emerald-700 border-emerald-300' }
  if (brand === 'Waypoint Style') return { badge: dark ? 'bg-violet-900/40 text-violet-300 border-violet-700/60' : 'bg-violet-100 text-violet-700 border-violet-300' }
  return { badge: dark ? 'bg-blue-900/40 text-blue-300 border-blue-700/60' : 'bg-blue-100 text-blue-700 border-blue-300' }
}

function allItemsLoaded(stop: LoadStop) { return stop.items.every(i => i.status === 'loaded' || i.status === 'flagged') }
function loadedCount(stop: LoadStop) { return stop.items.filter(i => i.status === 'loaded' || i.status === 'flagged').length }

function FlaggerModal({ state, onClose, onSubmit }: { state: FlaggerState; onClose: () => void; onSubmit: (stopId: number, itemId: string, tags: FlagTag[], note: string) => void }) {
  const [tags, setTags] = useState<FlagTag[]>([])
  const [note, setNote] = useState('')
  function toggleTag(t: FlagTag) { setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]) }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-red-900/40 border-b border-red-800/50 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1"><span className="text-red-400 text-xl">⚑</span><span className="font-bold text-white text-lg">Report Shortage / Damage</span></div>
            <p className="text-red-300/80 text-sm leading-snug">{state.itemDesc}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-2xl leading-none mt-0.5 shrink-0">×</button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="font-mono text-[11px] text-slate-400 uppercase tracking-widest mb-3">Issue Type <span className="text-red-400">*</span></p>
            <div className="grid grid-cols-2 gap-2.5">
              {FLAG_TAGS.map(t => (
                <button key={t} onClick={() => toggleTag(t)}
                  className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl border text-left transition-all active:scale-95 ${tags.includes(t) ? 'bg-red-500/20 border-red-400 text-red-200' : 'bg-slate-800/60 border-slate-600/60 text-slate-300 hover:border-slate-500'}`}>
                  <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${tags.includes(t) ? 'border-red-400 bg-red-400' : 'border-slate-500'}`}>
                    {tags.includes(t) && <span className="text-white text-xs font-bold">✓</span>}
                  </span>
                  <span className="text-sm font-medium leading-tight">{t}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[11px] text-slate-400 uppercase tracking-widest mb-2">Note / Details</p>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder="Describe the issue — batch code, quantity affected, visible damage…"
              className="w-full bg-slate-800/60 border border-slate-600/60 text-slate-100 text-base rounded-xl px-4 py-3 placeholder-slate-500 resize-none focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20" />
          </div>
          <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3">
            <span className="text-slate-500 text-xl">📷</span>
            <div><p className="text-sm text-slate-300 font-medium">Photo evidence</p><p className="font-mono text-[10px] text-slate-500">Capture on warehouse camera and attach via dock terminal</p></div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl border border-slate-600/60 text-slate-400 font-semibold text-base hover:border-slate-500 hover:text-slate-200 transition-colors active:scale-95">Cancel</button>
          <button onClick={() => { onSubmit(state.stopId, state.itemId, tags, note); onClose() }} disabled={tags.length === 0}
            className="flex-[2] py-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base transition-colors active:scale-95">
            Log Issue & Continue
          </button>
        </div>
      </div>
    </div>
  )
}

function DispatchModal({ stops, totalWeight, totalVolume, onClose, onConfirm }: { stops: LoadStop[]; totalWeight: number; totalVolume: number; onClose: () => void; onConfirm: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  const flaggedItems = stops.flatMap(s => s.items.filter(i => i.status === 'flagged').map(i => ({ stop: s.outletId, item: i.description, tags: i.flagTags })))

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-teal-900/50 border-b border-teal-800/50 px-5 py-4">
          <div className="flex items-center gap-2 mb-1"><span className="text-teal-400 text-xl">✦</span><span className="font-bold text-white text-lg">Confirm Load & Authorize Departure</span></div>
          <p className="text-teal-300/80 text-sm">{VEHICLE.plate} · Trip {VEHICLE.trip} · {VEHICLE.bay}</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[{ label: 'Total Stops', value: stops.length }, { label: 'Total Weight', value: `${totalWeight.toLocaleString()} kg` }, { label: 'Total Volume', value: `${totalVolume.toFixed(1)} m³` }].map(s => (
              <div key={s.label} className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/40">
                <div className="font-mono text-lg font-bold text-white">{s.value}</div>
                <div className="font-mono text-[10px] text-slate-400 uppercase mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          {flaggedItems.length > 0 && (
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4 space-y-2">
              <p className="font-mono text-[11px] text-amber-400 uppercase tracking-widest mb-2">⚑ {flaggedItems.length} Flagged Item{flaggedItems.length > 1 ? 's' : ''}</p>
              {flaggedItems.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 text-xs mt-0.5 shrink-0">•</span>
                  <div><div className="text-sm text-amber-200 font-medium">{f.item}</div><div className="font-mono text-[10px] text-amber-500">{f.stop} · {f.tags?.join(', ')}</div></div>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-1.5">
            {stops.map(s => {
              const done = allItemsLoaded(s)
              return (
                <div key={s.loadingOrder} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${done ? 'border-teal-800/50 bg-teal-900/20' : 'border-red-800/50 bg-red-900/20'}`}>
                  <span className={`text-lg ${done ? 'text-teal-400' : 'text-red-400'}`}>{done ? '✓' : '✗'}</span>
                  <div className="flex-1"><span className="text-sm font-medium text-slate-200">{s.outletId}</span><span className="font-mono text-[10px] text-slate-500 ml-2">{s.outletName}</span></div>
                  <span className={`font-mono text-[10px] ${done ? 'text-teal-400' : 'text-red-400'}`}>{loadedCount(s)}/{s.items.length}</span>
                </div>
              )
            })}
          </div>
          <button onClick={() => setConfirmed(c => !c)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all active:scale-[0.99] ${confirmed ? 'border-teal-500 bg-teal-900/30' : 'border-slate-600 bg-slate-800/40'}`}>
            <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${confirmed ? 'border-teal-400 bg-teal-500' : 'border-slate-500'}`}>
              {confirmed && <span className="text-white font-bold text-lg">✓</span>}
            </div>
            <span className={`text-sm font-medium text-left leading-snug ${confirmed ? 'text-teal-200' : 'text-slate-300'}`}>I confirm all items have been physically loaded and the vehicle is ready for departure</span>
          </button>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl border border-slate-600/60 text-slate-400 font-semibold text-base hover:border-slate-500 transition-colors active:scale-95">Back</button>
          <button onClick={() => { if (confirmed) onConfirm() }} disabled={!confirmed}
            className="flex-[2] py-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-base transition-colors active:scale-95">
            Authorize Departure →
          </button>
        </div>
      </div>
    </div>
  )
}

function DispatchedScreen({ onReset, isDark }: { onReset: () => void; isDark: boolean }) {
  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center gap-6 p-8 z-50 ${isDark ? 'bg-[#051a12]' : 'bg-teal-50'}`}>
      <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 ${isDark ? 'bg-teal-500/20 border-teal-500' : 'bg-teal-100 border-teal-400'}`}>
        <span className="text-teal-400 text-5xl">✓</span>
      </div>
      <div className="text-center">
        <h1 className={`font-bold text-3xl mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Vehicle Cleared</h1>
        <p className={`text-lg ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>{VEHICLE.plate} authorized to depart</p>
        <p className={`font-mono text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{VEHICLE.bay} · Peliyagoda Loading Dock</p>
      </div>
      <div className={`border rounded-2xl px-8 py-5 text-center ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200'}`}>
        <p className="font-mono text-[11px] text-slate-400 uppercase tracking-widest mb-1">Departure logged at</p>
        <p className={`font-mono text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      <button onClick={onReset} className={`mt-4 px-8 py-3 rounded-xl border font-medium transition-colors ${isDark ? 'border-slate-600/60 text-slate-400 hover:text-white hover:border-slate-500' : 'border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400'}`}>
        Start New Loading Session
      </button>
    </div>
  )
}

function StopCard({ stop, isDark, onToggleExpand, onToggleItem, onFlagItem }: {
  stop: LoadStop; isDark: boolean
  onToggleExpand: (order: number) => void
  onToggleItem: (stopOrder: number, itemId: string) => void
  onFlagItem: (stopOrder: number, itemId: string, desc: string) => void
}) {
  const loaded = loadedCount(stop)
  const total = stop.items.length
  const allDone = allItemsLoaded(stop)
  const progress = total > 0 ? Math.round((loaded / total) * 100) : 0
  const bColors = brandColors(stop.brand, isDark)

  const cardBg = isDark
    ? allDone ? 'border-teal-800/60 bg-[#0e1f1a]' : stop.loadingOrder === 1 ? 'border-slate-500/60 bg-[#141e30]' : 'border-slate-700/40 bg-[#111927]'
    : allDone ? 'border-teal-300 bg-teal-50' : stop.loadingOrder === 1 ? 'border-slate-400 bg-white shadow-md' : 'border-slate-200 bg-white'

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${cardBg}`}>
      <button onClick={() => onToggleExpand(stop.loadingOrder)} className="w-full text-left px-5 py-4 flex items-start gap-4 active:bg-white/5 transition-colors">
        <div className={`w-12 h-12 rounded-xl shrink-0 flex flex-col items-center justify-center border ${
          allDone ? (isDark ? 'bg-teal-500/20 border-teal-500/50' : 'bg-teal-100 border-teal-400')
          : stop.loadingOrder === 1 ? (isDark ? 'bg-slate-700/60 border-slate-500/60' : 'bg-slate-100 border-slate-400')
          : (isDark ? 'bg-slate-800/60 border-slate-700/40' : 'bg-slate-50 border-slate-200')
        }`}>
          {allDone ? <span className="text-teal-400 text-xl">✓</span> : (
            <><span className={`font-mono text-[9px] uppercase leading-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Load</span><span className={`font-mono text-lg font-bold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{stop.loadingOrder}</span></>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`font-mono text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stop.outletId}</span>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${bColors.badge}`}>{stop.brand.replace('Waypoint ', 'WP ')}</span>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${isDark ? 'bg-slate-700/60 text-slate-400 border-slate-600/40' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>Stop {stop.deliveryStop}</span>
          </div>
          <div className={`text-base font-medium truncate mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{stop.outletName}</div>
          <div className={`flex items-center gap-3 font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>{stop.district}</span><span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
            <span>{stop.weightKg.toLocaleString()} kg</span><span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
            <span>{stop.volumeM3.toFixed(1)} m³</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className={`font-mono text-sm font-bold ${allDone ? 'text-teal-400' : isDark ? 'text-slate-300' : 'text-slate-600'}`}>{loaded}/{total}</span>
          <span className={`text-base transition-transform ${isDark ? 'text-slate-400' : 'text-slate-500'} ${stop.expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      <div className={`h-1 mx-5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
        <div className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-teal-500' : isDark ? 'bg-slate-500' : 'bg-teal-400'}`} style={{ width: `${progress}%` }} />
      </div>

      {stop.expanded && (
        <div className="px-4 py-3 space-y-2">
          {stop.items.map(item => (
            <div key={item.id} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
              item.status === 'loaded' ? (isDark ? 'bg-teal-900/20 border-teal-800/40' : 'bg-teal-50 border-teal-200')
              : item.status === 'flagged' ? (isDark ? 'bg-red-900/20 border-red-800/40' : 'bg-red-50 border-red-200')
              : (isDark ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-50 border-slate-200')
            }`}>
              <button onClick={() => onToggleItem(stop.loadingOrder, item.id)}
                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                  item.status === 'loaded' ? 'border-teal-500 bg-teal-500'
                  : item.status === 'flagged' ? 'border-red-500 bg-red-900/40'
                  : isDark ? 'border-slate-500 hover:border-slate-400' : 'border-slate-300 hover:border-slate-400'
                }`}
                aria-label={`Mark ${item.description} as loaded`}>
                {item.status === 'loaded' && <span className="text-white text-sm font-bold">✓</span>}
                {item.status === 'flagged' && <span className="text-red-400 text-sm">⚑</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium leading-snug ${
                  item.status === 'loaded' ? (isDark ? 'text-teal-200 line-through opacity-70' : 'text-teal-700 line-through opacity-70')
                  : item.status === 'flagged' ? (isDark ? 'text-red-200' : 'text-red-700')
                  : (isDark ? 'text-slate-100' : 'text-slate-700')
                }`}>{item.description}</div>
                <div className={`font-mono text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {item.cases} cases · {item.weightKg} kg
                  {item.flagTags && item.flagTags.length > 0 && <span className="text-red-400 ml-2">{item.flagTags.join(', ')}</span>}
                </div>
              </div>
              {item.status !== 'loaded' && (
                <button onClick={() => onFlagItem(stop.loadingOrder, item.id, item.description)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95 ${
                    item.status === 'flagged' ? 'bg-red-800/40 border-red-700/60 text-red-300'
                    : isDark ? 'bg-slate-700/40 border-slate-600/40 text-slate-400 hover:border-amber-600/60 hover:text-amber-400'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-amber-400 hover:text-amber-600'
                  }`}>
                  <span>⚑</span>
                  <span className="hidden sm:inline">{item.status === 'flagged' ? 'Flagged' : 'Flag'}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LoaderApp({ onSwitchView, isDark = false, onToggleDark }: {
  onSwitchView: () => void; isDark?: boolean; onToggleDark?: () => void
}) {
  const [stops, setStops] = useState<LoadStop[]>([])
  const [flagger, setFlagger] = useState<FlaggerState | null>(null)
  const [showDispatch, setShowDispatch] = useState(false)
  const [dispatched, setDispatched] = useState(false)
  const [syncPulse, setSyncPulse] = useState(false)
  const [tripId, setTripId] = useState<string | null>(null)
  const [vehicleId, setVehicleId] = useState('—')
  const [vehiclePlate, setVehiclePlate] = useState('—')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    api.getLoadingManifests().then(manifests => {
      const manifest = manifests[0]
      if (!manifest) { setStops([]); return }
      setTripId(manifest.tripId)
      setVehicleId(manifest.vehicleId || '—')
      setVehiclePlate(manifest.vehiclePlate || manifest.vehicleId || '—')
      setStops((manifest.items || []).map((item: any, i: number) => ({
        loadingOrder: i + 1, deliveryStop: i + 1, outletId: item.id, outletName: item.description,
        district: '', brand: 'Waypoint Fresh', volumeM3: 0, weightKg: Number(item.weightKg || 0), expanded: i === 0,
        items: [{ id: item.id, description: item.description, cases: Number(item.qty || 0), weightKg: Number(item.weightKg || 0),
          status: item.loaded ? 'loaded' : 'pending' }],
      })))
    }).catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load manifest'))
  }, [])

  const totalWeight = stops.reduce((s, st) => s + st.weightKg, 0)
  const totalVolume = stops.reduce((s, st) => s + st.volumeM3, 0)
  const totalItems = stops.flatMap(s => s.items).length
  const loadedItems = stops.flatMap(s => s.items).filter(i => i.status === 'loaded' || i.status === 'flagged').length
  const allStopsDone = stops.every(allItemsLoaded)
  const overallProgress = totalItems > 0 ? Math.round((loadedItems / totalItems) * 100) : 0

  function toggleExpand(order: number) { setStops(prev => prev.map(s => s.loadingOrder === order ? { ...s, expanded: !s.expanded } : s)) }
  function toggleItem(stopOrder: number, itemId: string) {
    setStops(prev => prev.map(s => {
      if (s.loadingOrder !== stopOrder) return s
      return { ...s, items: s.items.map(i => { if (i.id !== itemId) return i; const next: ItemStatus = i.status === 'pending' ? 'loaded' : i.status === 'loaded' ? 'pending' : 'flagged'; return { ...i, status: next } }) }
    }))
  }
  function submitFlag(stopId: number, itemId: string, tags: FlagTag[], note: string) {
    setStops(prev => prev.map(s => { if (s.loadingOrder !== stopId) return s; return { ...s, items: s.items.map(i => { if (i.id !== itemId) return i; return { ...i, status: 'flagged' as ItemStatus, flagTags: tags, flagNote: note } }) } }))
  }
  function handleSync() { setSyncPulse(true); api.getLoadingManifests().finally(() => setSyncPulse(false)) }
  function confirmDispatch() {
    if (!tripId) return
    void api.dispatchTrip(tripId).then(() => setDispatched(true)).catch(err => setLoadError(err instanceof Error ? err.message : 'Dispatch failed'))
  }

  const rootBg = isDark ? 'bg-[#0a1220]' : 'bg-slate-100'
  const headerBg = isDark ? 'bg-[#0d1827] border-slate-700/50' : 'bg-white border-slate-200'
  const summaryBg = isDark ? 'bg-[#0d1827]/80 border-slate-800/60' : 'bg-white border-slate-200'
  const textPrimary = isDark ? 'text-white' : 'text-slate-900'
  const textSecondary = isDark ? 'text-slate-200' : 'text-slate-700'
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500'
  const barBg = isDark ? 'bg-slate-800' : 'bg-slate-200'
  const fixedBarBg = isDark ? 'bg-[#0a1220]/95' : 'bg-white/95'
  const fixedBarBorder = isDark ? 'border-slate-700/60' : 'border-slate-200'
  const driverCardBg = isDark ? 'bg-[#111927] border-slate-700/40' : 'bg-white border-slate-200'
  const vehicleBadgeBg = isDark ? 'bg-teal-900/50 border-teal-700/60' : 'bg-teal-50 border-teal-200'
  const syncBtnBg = isDark ? 'bg-slate-800/60 border-slate-700/40' : 'bg-slate-50 border-slate-200'

  if (dispatched) return <DispatchedScreen onReset={() => setDispatched(false)} isDark={isDark} />

  return (
    <div className={`min-h-[100dvh] ${rootBg} text-slate-100 flex flex-col`} style={{ fontFamily: "'Inter', sans-serif" }}>
      {loadError && <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{loadError}</div>}
      <header className={`sticky top-0 z-40 ${headerBg} border-b shadow-lg`}>
        <div className="px-5 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>📍</span>
              <span className={`font-mono text-xs uppercase tracking-widest truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading Dock</span>
            </div>
            <div className={`font-bold text-base truncate mt-0.5 ${textPrimary}`}>Trip {tripId || '—'} · {vehiclePlate}</div>
          </div>

          <div className={`shrink-0 flex items-center gap-2 ${vehicleBadgeBg} border rounded-xl px-3 py-2`}>
            <span className={`font-mono text-[10px] uppercase tracking-widest ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>Vehicle</span>
            <span className={`font-mono font-bold text-sm ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>{vehicleId}</span>
          </div>

          <button onClick={handleSync} className={`shrink-0 flex items-center gap-2 ${syncBtnBg} border rounded-xl px-3 py-2 active:scale-95 transition-all`}>
            <span className={`w-2 h-2 rounded-full bg-emerald-500 ${syncPulse ? 'animate-ping' : 'animate-pulse'}`} />
            <span className={`font-mono text-[10px] hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{syncPulse ? 'Syncing…' : 'Synced'}</span>
          </button>

          {onToggleDark && (
            <button onClick={onToggleDark}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border font-mono text-[10px] transition-colors ${isDark ? 'bg-slate-700/60 border-slate-600 text-slate-300 hover:text-teal-300 hover:border-teal-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-300'}`}>
              <span>{isDark ? '☀' : '☾'}</span>
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>
          )}

          <button onClick={onSwitchView} className={`shrink-0 font-mono text-[10px] px-2 py-2 transition-colors ${isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`} title="Switch role" aria-label="Switch role">⇄</button>
        </div>

        <div className={`h-1.5 ${barBg}`}>
          <div className={`h-full transition-all duration-500 ${allStopsDone ? 'bg-teal-500' : isDark ? 'bg-slate-600' : 'bg-teal-400'}`} style={{ width: `${overallProgress}%` }} />
        </div>
      </header>

      <div className={`${summaryBg} border-b px-5 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {[{ label: 'Items', value: `${loadedItems}/${totalItems}` }, { label: 'Weight', value: `${totalWeight.toLocaleString()} kg` }, { label: 'Volume', value: `${totalVolume.toFixed(1)} m³` }].map(s => (
              <div key={s.label}>
                <div className={`font-mono text-xs uppercase ${textMuted}`}>{s.label}</div>
                <div className={`font-mono text-sm font-semibold ${textPrimary}`}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-sm font-bold ${allStopsDone ? 'text-teal-400' : textMuted}`}>{overallProgress}%</span>
            <span className={`font-mono text-xs ${textMuted}`}>loaded</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        <div className={`mx-4 mt-4 border rounded-xl px-4 py-3 flex items-center gap-3 ${isDark ? 'bg-amber-900/30 border-amber-700/40' : 'bg-amber-50 border-amber-300'}`}>
          <span className="text-amber-400 text-xl shrink-0">⬆</span>
          <div>
            <p className={`text-sm font-semibold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>Load in sequence — top card first</p>
            <p className={`font-mono text-[11px] ${isDark ? 'text-amber-500/80' : 'text-amber-600'}`}>Items loaded first are delivered last (reverse sequence)</p>
          </div>
        </div>

        <main className="flex-1 px-4 py-4 pb-36 space-y-4">
          {stops.map(stop => (
            <StopCard key={stop.loadingOrder} stop={stop} isDark={isDark}
              onToggleExpand={toggleExpand} onToggleItem={toggleItem} onFlagItem={(o, id, desc) => setFlagger({ stopId: o, itemId: id, itemDesc: desc })} />
          ))}
          <div className={`border rounded-2xl p-4 flex items-center gap-4 mt-4 ${driverCardBg}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>NP</div>
            <div className="flex-1"><div className={`text-sm font-semibold ${textSecondary}`}>{VEHICLE.driver}</div><div className={`font-mono text-[10px] ${textMuted}`}>{VEHICLE.type} · {VEHICLE.depot} Depot</div></div>
            <span className={`font-mono text-[10px] ${textMuted}`}>Driver</span>
          </div>
        </main>
      </div>

      <div className={`fixed bottom-0 inset-x-0 z-40 ${fixedBarBg} backdrop-blur-sm border-t ${fixedBarBorder} px-4 pt-3 pb-5`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex-1 h-1.5 ${barBg} rounded-full overflow-hidden`}>
              <div className={`h-full rounded-full transition-all duration-700 ${allStopsDone ? 'bg-teal-500' : isDark ? 'bg-slate-600' : 'bg-teal-400'}`} style={{ width: `${overallProgress}%` }} />
            </div>
            <span className={`font-mono text-xs font-bold shrink-0 ${allStopsDone ? 'text-teal-400' : textMuted}`}>{loadedItems}/{totalItems} items</span>
          </div>
          <button onClick={() => setShowDispatch(true)} disabled={!allStopsDone}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] ${
              allStopsDone ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/50'
              : isDark ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/40' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}>
            {allStopsDone ? '✦ Confirm Load & Authorize Departure' : `${totalItems - loadedItems} items remaining…`}
          </button>
        </div>
      </div>

      {flagger && <FlaggerModal state={flagger} onClose={() => setFlagger(null)} onSubmit={submitFlag} />}
      {showDispatch && <DispatchModal stops={stops} totalWeight={totalWeight} totalVolume={totalVolume} onClose={() => setShowDispatch(false)} onConfirm={() => { setShowDispatch(false); setDispatched(true) }} />}
    </div>
  )
}