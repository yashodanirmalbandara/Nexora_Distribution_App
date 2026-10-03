import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Fix default Leaflet marker icon links in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type StopStatus = 'upcoming' | 'active' | 'arrived' | 'unloading' | 'pod' | 'completed'
type ConnectionState = 'online' | 'offline' | 'syncing'

interface StopTag { type: 'van_only' | 'rear_dock' | 'mall_bay' | 'fresh_cutoff' | 'no_park'; label: string }
interface DeliveryItem { id: string; description: string; cases: number; weightKg: number }

interface DeliveryStop {
  id: string; stopNo: number; outletId: string; outletName: string
  district: string; address: string; windowStart: string; windowEnd: string
  brand: 'Waypoint Fresh' | 'Waypoint Style' | 'Waypoint Tech'
  tags: StopTag[]; items: DeliveryItem[]; status: StopStatus
  arrivedAt?: string; completedAt?: string; podName?: string; podRef?: string; podPhoto?: boolean
}

interface OfflineAction { id: string; type: string; timestamp: string; stopId: string }

const VEHICLE_ID = 'VH-01'
const PLATE = 'WP-CAB-7732'
const DRIVER = 'Nuwan Perera'

const INITIAL_STOPS: DeliveryStop[] = [
  {
    id: 's1', stopNo: 1, outletId: 'PLY-004', outletName: 'Keells Nugegoda', district: 'Colombo',
    address: '45 High Level Rd, Nugegoda. Enter from Thimbirigasyaya side gate.',
    windowStart: '06:30', windowEnd: '08:00', brand: 'Waypoint Fresh',
    tags: [{ type: 'fresh_cutoff', label: 'Fresh 08:00 cutoff' }, { type: 'rear_dock', label: 'Use Rear Dock B' }],
    items: [
      { id: 'a1', description: 'Fresh Dairy — Full Cream Milk 1L', cases: 14, weightKg: 168 },
      { id: 'a2', description: 'Fresh Dairy — Cheese Sliced 200g', cases: 6, weightKg: 42 },
      { id: 'a3', description: 'Chilled Beverages — Mixed Juice 1L', cases: 6, weightKg: 72 },
      { id: 'a4', description: 'Fresh Poultry — Whole Chicken 1.2kg', cases: 5, weightKg: 78 },
      { id: 'a5', description: 'Fresh Eggs — Free Range Dozen', cases: 2, weightKg: 30 },
    ],
    status: 'active',
  },
  {
    id: 's2', stopNo: 2, outletId: 'MGM-011', outletName: 'Cargills Maharagama', district: 'Colombo',
    address: '112 Highlevel Rd, Maharagama. Loading bay at basement — ramp on left.',
    windowStart: '08:30', windowEnd: '10:00', brand: 'Waypoint Fresh',
    tags: [{ type: 'mall_bay', label: 'Mall Bay 02 — Basement' }, { type: 'van_only', label: 'Van-only parking' }],
    items: [
      { id: 'b1', description: 'Fresh Dairy — Full Cream Milk 1L', cases: 10, weightKg: 120 },
      { id: 'b2', description: 'Fresh Dairy — Butter Salted 250g', cases: 6, weightKg: 54 },
      { id: 'b3', description: 'Chilled Beverages — Fresh Orange 500ml', cases: 5, weightKg: 60 },
      { id: 'b4', description: 'Fresh Poultry — Boneless Chicken 500g', cases: 4, weightKg: 48 },
    ],
    status: 'upcoming',
  },
  {
    id: 's3', stopNo: 3, outletId: 'KDY-007', outletName: 'Keells Kandy City', district: 'Central',
    address: 'Dalada Veediya, Kandy. Access via Temple St. Contact store manager on arrival.',
    windowStart: '10:30', windowEnd: '12:00', brand: 'Waypoint Fresh',
    tags: [{ type: 'van_only', label: 'Van-only — no truck access' }, { type: 'no_park', label: 'No roadside parking — call ahead' }],
    items: [
      { id: 'c1', description: 'Fresh Dairy — Full Cream Milk 1L', cases: 6, weightKg: 72 },
      { id: 'c2', description: 'Fresh Dairy — Low-Fat Yoghurt 500g', cases: 4, weightKg: 42 },
      { id: 'c3', description: 'Chilled Juices — Mixed Tropical 330ml', cases: 3, weightKg: 36 },
      { id: 'c4', description: 'Chilled Desserts — Mixed Pudding Cups', cases: 4, weightKg: 42 },
    ],
    status: 'upcoming',
  },
]

function nowTime() { return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }

function tagStyle(type: StopTag['type']) {
  switch (type) {
    case 'fresh_cutoff': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700'
    case 'rear_dock': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700'
    case 'mall_bay': return 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-700'
    case 'van_only': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700'
    case 'no_park': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700'
  }
}

function tagIcon(type: StopTag['type']) {
  switch (type) {
    case 'fresh_cutoff': return '⏱'
    case 'rear_dock': return '↩'
    case 'mall_bay': return '🅿'
    case 'van_only': return '🚐'
    case 'no_park': return '⛔'
  }
}

function QRReferenceInput({ onRefReceived, receivedRef }: { onRefReceived: (ref: string) => void; receivedRef: string | null }) {
  const [manualRef, setManualRef] = useState('')
  const [scanning, setScanning] = useState(false)

  function simulateScan() {
    setScanning(true)
    setTimeout(() => {
      const today = new Date()
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
      const ref = `REF-${dateStr}-${String(Math.floor(Math.random() * 90000) + 10000)}`
      setScanning(false)
      onRefReceived(ref)
    }, 1800)
  }

  function handleManual() {
    const trimmed = manualRef.trim().toUpperCase()
    if (trimmed.startsWith('REF-') && trimmed.length >= 14) onRefReceived(trimmed)
  }

  if (receivedRef) {
    return (
      <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700 rounded-2xl px-4 py-4 flex items-center gap-3">
        <span className="text-teal-500 text-2xl shrink-0">✓</span>
        <div>
          <p className="font-semibold text-teal-800 dark:text-teal-300 text-sm">Reference Confirmed</p>
          <p className="font-mono text-xs text-teal-600 dark:text-teal-400 mt-0.5">{receivedRef}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button onClick={simulateScan} disabled={scanning}
        className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-dashed transition-all active:scale-[0.98] ${
          scanning ? 'border-teal-400 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-teal-400 dark:hover:border-teal-500'
        }`}>
        {scanning ? (
          <>
            <div className="w-6 h-6 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
            <span className="font-semibold text-teal-700 dark:text-teal-300">Scanning QR Code…</span>
          </>
        ) : (
          <>
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-slate-500" />
                <rect x="4" y="4" width="5" height="5" rx="0.5" fill="currentColor" className="text-slate-500" />
                <rect x="13" y="2" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-slate-500" />
                <rect x="15" y="4" width="5" height="5" rx="0.5" fill="currentColor" className="text-slate-500" />
                <rect x="2" y="13" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-slate-500" />
                <rect x="4" y="15" width="5" height="5" rx="0.5" fill="currentColor" className="text-slate-500" />
                <rect x="13" y="13" width="2" height="2" fill="currentColor" className="text-slate-500" />
                <rect x="16" y="13" width="2" height="2" fill="currentColor" className="text-slate-500" />
                <rect x="19" y="13" width="3" height="2" fill="currentColor" className="text-slate-500" />
                <rect x="13" y="16" width="2" height="2" fill="currentColor" className="text-slate-500" />
                <rect x="16" y="16" width="2" height="5" fill="currentColor" className="text-slate-500" />
                <rect x="19" y="17" width="3" height="2" fill="currentColor" className="text-slate-500" />
                <rect x="13" y="19" width="5" height="3" fill="currentColor" className="text-slate-500" />
                <rect x="19" y="20" width="3" height="2" fill="currentColor" className="text-slate-500" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Scan Store QR Code</p>
              <p className="font-mono text-[10px] text-slate-400">Tap to open camera and scan the store's delivery QR</p>
            </div>
          </>
        )}
      </button>

      <div className="flex items-center gap-2 my-1">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        <span className="font-mono text-[10px] text-slate-400 px-2">or enter manually</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>

      <div className="flex gap-2">
        <input value={manualRef} onChange={e => setManualRef(e.target.value.toUpperCase())}
          placeholder="REF-20261003-00441"
          className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 text-sm font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20" />
        <button onClick={handleManual}
          disabled={!manualRef.trim().startsWith('REF-')}
          className="px-4 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors">
          OK
        </button>
      </div>
      <p className="font-mono text-[10px] text-slate-400 text-center">Format: REF-YYYYMMDD-XXXXX</p>
    </div>
  )
}

function StopCard({ stop, onTap }: { stop: DeliveryStop; isDark: boolean; onTap: () => void }) {
  const isActive = stop.status === 'active' || stop.status === 'arrived' || stop.status === 'unloading' || stop.status === 'pod'
  const isDone = stop.status === 'completed'
  const totalWeight = stop.items.reduce((s, i) => s + i.weightKg, 0)

  return (
    <button onClick={isDone ? undefined : onTap} disabled={stop.status === 'upcoming' || isDone}
      className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all active:scale-[0.98] ${
        isDone ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60'
        : isActive ? 'border-teal-500 bg-white dark:bg-slate-800 shadow-lg shadow-teal-100 dark:shadow-teal-900/30'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
      }`}>
      {isActive && <div className="h-1 bg-teal-500" />}
      {isDone && <div className="h-1 bg-emerald-400" />}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-bold text-lg ${
            isDone ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300'
            : isActive ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
          }`}>
            {isDone ? '✓' : stop.stopNo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-base leading-tight">{stop.outletId}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">{stop.district}</span>
              </div>
              {isActive && <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 shrink-0">Active</span>}
              {isDone && <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 shrink-0">Done {stop.completedAt}</span>}
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium truncate mb-2">{stop.outletName}</p>
            <div className="flex items-center gap-2 mb-2.5 font-mono text-xs">
              <span className={`font-semibold ${isActive ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>{stop.windowStart} – {stop.windowEnd}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-slate-400">{totalWeight} kg · {stop.items.length} lines</span>
            </div>
            {stop.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {stop.tags.map(tag => (
                  <span key={tag.type} className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full border ${tagStyle(tag.type)}`}>
                    <span>{tagIcon(tag.type)}</span>{tag.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

function ActiveStopScreen({ stop, offlineActions, onBack, onStatusUpdate }: {
  stop: DeliveryStop; isDark: boolean; offlineActions: OfflineAction[]
  onBack: () => void
  onStatusUpdate: (stopId: string, status: StopStatus, extra?: Partial<DeliveryStop>) => void
}) {
  const [podName, setPodName] = useState('')
  const [podRef, setPodRef] = useState<string | null>(null)
  const [podPhoto, setPodPhoto] = useState(false)

  const totalWeight = stop.items.reduce((s, i) => s + i.weightKg, 0)
  const totalCases = stop.items.reduce((s, i) => s + i.cases, 0)

  function handlePrimary() {
    if (stop.status === 'active') onStatusUpdate(stop.id, 'arrived', { arrivedAt: nowTime() })
    else if (stop.status === 'arrived') onStatusUpdate(stop.id, 'unloading')
    else if (stop.status === 'unloading') onStatusUpdate(stop.id, 'pod')
    else if (stop.status === 'pod') {
      if (!podName.trim() || !podRef) return
      onStatusUpdate(stop.id, 'completed', { completedAt: nowTime(), podName: podName.trim(), podRef, podPhoto })
      onBack()
    }
  }

  const btnLabel = { active: 'Mark Arrived', arrived: 'Start Unloading', unloading: 'Complete Delivery', pod: 'Submit & Complete' }[stop.status as string] ?? ''
  const btnEnabled = stop.status !== 'pod' || (!!podName.trim() && !!podRef)

  const progressSteps = [
    { key: 'active', label: 'En Route' }, { key: 'arrived', label: 'Arrived' },
    { key: 'unloading', label: 'Unloading' }, { key: 'pod', label: 'Sign-off' }, { key: 'completed', label: 'Done' },
  ]
  const stepIndex = progressSteps.findIndex(s => s.key === stop.status)

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 active:bg-slate-200 transition-colors">←</button>
        <div className="flex-1">
          <div className="font-bold text-slate-900 dark:text-white text-base">{stop.outletId} · Stop {stop.stopNo}</div>
          <div className="font-mono text-xs text-slate-500 dark:text-slate-400">{stop.outletName}</div>
        </div>
        <div className={`font-mono text-[10px] px-2 py-1 rounded-lg border ${
          stop.status === 'unloading' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-300'
          : stop.status === 'arrived' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300'
          : stop.status === 'pod' ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/40 dark:border-violet-700 dark:text-violet-300'
          : 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900/40 dark:border-teal-700 dark:text-teal-300'
        }`}>
          {stop.status === 'active' ? 'En Route' : stop.status === 'arrived' ? 'Arrived' : stop.status === 'unloading' ? 'Unloading' : 'Sign-off'}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 py-3 shrink-0">
        <div className="flex items-center gap-0">
          {progressSteps.map((step, i) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i < stepIndex ? 'bg-teal-500 border-teal-500 text-white'
                  : i === stepIndex ? 'bg-white dark:bg-slate-800 border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-300 dark:text-slate-600'
                }`}>
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span className={`font-mono text-[9px] mt-0.5 whitespace-nowrap ${i === stepIndex ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-400'}`}>{step.label}</span>
              </div>
              {i < progressSteps.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-3 ${i < stepIndex ? 'bg-teal-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 pb-20">
        <div className="bg-white dark:bg-slate-800 mx-4 mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">Delivery Window</span>
              <span className="font-mono text-sm font-bold text-teal-700 dark:text-teal-400">{stop.windowStart} – {stop.windowEnd}</span>
            </div>
          </div>
          <div className="px-4 py-3">
            <p className="font-mono text-[10px] text-slate-400 uppercase mb-1">Address & Instructions</p>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{stop.address}</p>
          </div>
          {stop.arrivedAt && <div className="px-4 py-2.5 bg-teal-50 dark:bg-teal-900/20 border-t border-teal-100 dark:border-teal-800"><span className="font-mono text-xs text-teal-700 dark:text-teal-400">✓ Arrived at {stop.arrivedAt}</span></div>}
        </div>

        {stop.tags.length > 0 && (
          <div className="mx-4 mt-3 space-y-2">
            {stop.tags.map(tag => (
              <div key={tag.type} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${tagStyle(tag.type)}`}>
                <span className="text-lg shrink-0">{tagIcon(tag.type)}</span>
                <span className="font-semibold text-sm">{tag.label}</span>
              </div>
            ))}
          </div>
        )}

        {stop.status !== 'pod' && (
          <div className="bg-white dark:bg-slate-800 mx-4 mt-3 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">Order Lines</span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{totalCases} cases · {totalWeight} kg</span>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700/60">
              {stop.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-mono text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">{item.cases}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-tight">{item.description}</p>
                    <p className="font-mono text-[11px] text-slate-400">{item.weightKg} kg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stop.status === 'pod' && (
          <div className="mx-4 mt-3 mb-4 space-y-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-amber-500 text-xl">📋</span>
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Proof of Delivery Required</p>
                <p className="font-mono text-[10px] text-amber-600 dark:text-amber-400">Scan the store's QR code or enter the reference number</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <label className="font-mono text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Received By <span className="text-red-500">*</span></label>
                <input type="text" value={podName} onChange={e => setPodName(e.target.value)} placeholder="Customer / store manager name"
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3.5 text-base text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-4">
              <label className="font-mono text-[10px] text-slate-400 uppercase tracking-widest block mb-3">
                Delivery Reference <span className="text-red-500">*</span>
              </label>
              <QRReferenceInput receivedRef={podRef} onRefReceived={ref => setPodRef(ref)} />
            </div>

            <button onClick={() => setPodPhoto(p => !p)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${podPhoto ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-400 text-teal-700 dark:text-teal-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{podPhoto ? '✓' : '📷'}</span>
                <div className="text-left">
                  <p className="font-semibold text-sm">{podPhoto ? 'Photo Captured' : 'Capture Delivery Photo'}</p>
                  <p className="font-mono text-[10px] text-slate-400">Optional — recommended for dispute prevention</p>
                </div>
              </div>
              {podPhoto && <span className="text-teal-500 font-bold">✓</span>}
            </button>

            {(!podName.trim() || !podRef) && (
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700/60 rounded-xl">
                <span className="text-slate-400 text-sm">ℹ</span>
                <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {!podName.trim() ? 'Enter customer name' : 'Scan or enter reference number'} to complete
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-4">
        {offlineActions.length > 0 && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300">{offlineActions.length} action{offlineActions.length > 1 ? 's' : ''} pending sync</span>
          </div>
        )}
        <button onClick={handlePrimary} disabled={!btnEnabled}
          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] ${
            btnEnabled
              ? stop.status === 'pod' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-100 dark:shadow-emerald-900/30' : 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-100 dark:shadow-teal-900/30'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}>
          {btnLabel}
        </button>
      </div>
    </div>
  )
}

export default function DriverApp({ onSwitchView, isDark = false, onToggleDark }: {
  onSwitchView: () => void; isDark?: boolean; onToggleDark?: () => void
}) {
  const [stops, setStops] = useState<DeliveryStop[]>(INITIAL_STOPS)
  const [activeStopId, setActiveStopId] = useState<string | null>(null)
  const [connection, setConnection] = useState<ConnectionState>('online')
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([])
  const [battery] = useState(78)
  const [signal] = useState(3)
  const [time, setTime] = useState(new Date())

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    const t = setTimeout(() => setConnection('offline'), 8000)
    const t2 = setTimeout(() => setConnection('syncing'), 14000)
    const t3 = setTimeout(() => setConnection('online'), 17000)
    return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  function handleStatusUpdate(stopId: string, status: StopStatus, extra?: Partial<DeliveryStop>) {
    setStops(prev => prev.map(s => s.id === stopId ? { ...s, status, ...extra } : s))
    if (connection !== 'online') {
      setOfflineActions(prev => [...prev, { id: crypto.randomUUID(), type: `status:${status}`, timestamp: nowTime(), stopId }])
    }
    if (connection === 'online') setOfflineActions([])
  }

  const activeStop = stops.find(s => s.id === activeStopId)
  const completedCount = stops.filter(s => s.status === 'completed').length
  const timeStr = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-[100dvh] bg-slate-200 dark:bg-slate-950 sm:flex sm:items-center sm:justify-center sm:p-6">
        <div className="h-[100dvh] sm:h-[min(844px,calc(100dvh-3rem))] w-full sm:max-w-[400px] flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden sm:rounded-[2rem] sm:border-[6px] sm:border-slate-900 dark:sm:border-slate-700 sm:shadow-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>

          <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 pt-3 pb-2.5 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-1.5 text-xs font-mono font-medium rounded-full px-2.5 py-1 ${
                connection === 'online' ? 'bg-emerald-900/60 text-emerald-400'
                : connection === 'syncing' ? 'bg-amber-900/60 text-amber-400'
                : 'bg-red-900/60 text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connection === 'online' ? 'bg-emerald-500' : connection === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                {connection === 'online' ? 'Online' : connection === 'syncing' ? 'Syncing…' : 'Offline'}
              </div>
              <span className="font-mono text-sm font-semibold text-white">{timeStr}</span>
              <div className="flex items-center gap-3">
                {onToggleDark && (
                  <button onClick={onToggleDark} className="font-mono text-[10px] text-slate-400 hover:text-white transition-colors">
                    {isDark ? '☀' : '☾'}
                  </button>
                )}
                <div className="flex items-end gap-0.5 h-4">
                  {[1, 2, 3, 4].map(bar => <div key={bar} className={`w-1 rounded-sm ${bar <= signal ? 'bg-white' : 'bg-white/20'}`} style={{ height: `${bar * 4}px` }} />)}
                </div>
                <div className="flex items-center gap-1">
                  <div className="relative w-6 h-3 rounded-sm border border-white/60 overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 rounded-sm ${battery < 20 ? 'bg-red-500' : battery < 40 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${battery}%` }} />
                  </div>
                  <span className="font-mono text-[10px] text-white/70">{battery}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-400">Vehicle</span>
                <span className="font-mono text-xs font-bold text-teal-400 bg-teal-900/50 px-2 py-0.5 rounded-md">{VEHICLE_ID}</span>
                <span className="font-mono text-[10px] text-slate-500">{PLATE}</span>
              </div>
              {offlineActions.length > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-900/50 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-mono text-[10px] text-amber-300">{offlineActions.length} pending</span>
                </div>
              )}
            </div>
          </div>

          {activeStop && activeStop.status !== 'completed' ? (
            <ActiveStopScreen stop={activeStop} isDark={isDark} offlineActions={offlineActions} onBack={() => setActiveStopId(null)} onStatusUpdate={handleStatusUpdate} />
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3.5 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">Today's Route</h1>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">{DRIVER} · Trip 1</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-slate-400">{completedCount}/{stops.length} stops</div>
                    <div className="font-mono text-[10px] text-slate-400">Waypoint Fresh</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all duration-700" style={{ width: `${(completedCount / stops.length) * 100}%` }} />
                  </div>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 shrink-0">{Math.round((completedCount / stops.length) * 100)}%</span>
                </div>
              </div>

              <div className="mx-4 mt-3 shrink-0 rounded-xl overflow-hidden border border-slate-700 h-[220px]">
                <MapContainer 
                  center={[6.8721, 79.8886]} 
                  zoom={10} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <Marker position={[6.9678, 79.8897]}>
                    <Popup><strong>Depot</strong> - Peliyagoda Hub</Popup>
                  </Marker>
                  <Marker position={[6.8721, 79.8886]}>
                    <Popup><strong>Stop 1: PLY-004</strong><br />Keells Nugegoda (Active)</Popup>
                  </Marker>
                  <Marker position={[6.8481, 79.9267]}>
                    <Popup><strong>Stop 2: MGM-011</strong><br />Cargills Maharagama</Popup>
                  </Marker>
                  <Marker position={[7.2906, 80.6337]}>
                    <Popup><strong>Stop 3: KDY-002</strong><br />Kandy Outlet</Popup>
                  </Marker>
                </MapContainer>
              </div>

              {offlineActions.length > 0 && (
                <div className="mx-4 mt-3 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 shrink-0">
                  <span className="text-amber-500 text-lg shrink-0">{connection === 'syncing' ? '↻' : '⟳'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{connection === 'offline' ? 'Offline — Working Locally' : 'Syncing…'}</p>
                    <p className="font-mono text-[10px] text-amber-600 dark:text-amber-400">{offlineActions.length} recorded action{offlineActions.length > 1 ? 's' : ''} waiting to sync · local storage active</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center font-mono text-sm font-bold text-amber-700 dark:text-amber-300 shrink-0">{offlineActions.length}</div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-6">
                {stops.map(stop => (
                  <StopCard key={stop.id} stop={stop} isDark={isDark} onTap={() => setActiveStopId(stop.id)} />
                ))}
                <div className="text-center py-6">
                  <div className="inline-flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-slate-400 text-lg">⚑</span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">Return to depot after Stop 3</span>
                    <span className="font-mono text-[10px] text-slate-300 dark:text-slate-600">Peliyagoda · {VEHICLE_ID}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
                <button onClick={onSwitchView} className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 font-mono text-xs hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  ⇄ Switch Role
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}