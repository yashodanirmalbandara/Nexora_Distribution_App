import { useState, useEffect } from 'react'

type Tab = 'dashboard' | 'order' | 'history' | 'settings'
type OrderStatus = 'delivered' | 'in-transit' | 'scheduled' | 'deferred' | 'pending'
type IssueType = 'missing' | 'damaged' | 'wrong-item' | 'quantity-short'

interface ProductCategory {
  id: string; name: string; unit: string; minQty: number; maxQty: number
  pricePerUnit: number; stock: number; reorderAt: number
}

interface PastOrder {
  id: string; date: string; items: { name: string; qty: number; unit: string }[]
  totalValue: number; status: OrderStatus; deferralReason?: string; deliveredAt?: string; vehicleId?: string
}

const OUTLET = { id: 'OUT-001', name: 'Waypoint Fresh Colombo', brand: 'Waypoint Fresh' as const, manager: 'Dilini Rajapaksa', district: 'Colombo', phone: '+94 11 456 7890' }

const INCOMING = { vehicleId: 'VH-01', plate: 'WP-CAB-7732', driver: 'Nuwan Perera', etaTime: '08:24', progress: 62, status: 'In Transit' as const, stops: 3, currentStop: 2, departedAt: '06:10' }

const CATEGORIES: ProductCategory[] = [
  { id: 'dairy', name: 'Fresh Dairy', unit: 'cases', minQty: 1, maxQty: 30, pricePerUnit: 2400, stock: 8, reorderAt: 12 },
  { id: 'poultry', name: 'Fresh Poultry', unit: 'cases', minQty: 1, maxQty: 20, pricePerUnit: 3800, stock: 3, reorderAt: 6 },
  { id: 'beverages', name: 'Chilled Beverages', unit: 'cases', minQty: 1, maxQty: 25, pricePerUnit: 1800, stock: 14, reorderAt: 10 },
  { id: 'bread', name: 'Fresh Bread & Bakery', unit: 'cases', minQty: 1, maxQty: 15, pricePerUnit: 1200, stock: 5, reorderAt: 8 },
  { id: 'desserts', name: 'Chilled Desserts', unit: 'cases', minQty: 1, maxQty: 12, pricePerUnit: 2100, stock: 4, reorderAt: 6 },
  { id: 'eggs', name: 'Fresh Eggs', unit: 'trays', minQty: 5, maxQty: 60, pricePerUnit: 480, stock: 18, reorderAt: 20 },
]

function getRecentDateStr(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PAST_ORDERS: PastOrder[] = [
  { id: 'ORD-20261003', date: getRecentDateStr(0), items: [{ name: 'Fresh Dairy', qty: 14, unit: 'cases' }, { name: 'Fresh Poultry', qty: 5, unit: 'cases' }, { name: 'Chilled Beverages', qty: 6, unit: 'cases' }], totalValue: 68400, status: 'in-transit', vehicleId: 'VH-01' },
  { id: 'ORD-20261002', date: getRecentDateStr(1), items: [{ name: 'Fresh Dairy', qty: 12, unit: 'cases' }, { name: 'Chilled Beverages', qty: 8, unit: 'cases' }, { name: 'Fresh Bread & Bakery', qty: 4, unit: 'cases' }], totalValue: 57600, status: 'deferred', deferralReason: 'Fleet weight capacity exceeded. Your Fresh delivery has been rescheduled to the next available run.' },
  { id: 'ORD-20261001', date: getRecentDateStr(2), items: [{ name: 'Fresh Dairy', qty: 16, unit: 'cases' }, { name: 'Fresh Poultry', qty: 6, unit: 'cases' }, { name: 'Chilled Desserts', qty: 4, unit: 'cases' }], totalValue: 76800, status: 'delivered', deliveredAt: '07:44', vehicleId: 'VH-02' },
  { id: 'ORD-20260930', date: getRecentDateStr(3), items: [{ name: 'Fresh Dairy', qty: 10, unit: 'cases' }, { name: 'Fresh Eggs', qty: 20, unit: 'trays' }, { name: 'Chilled Beverages', qty: 5, unit: 'cases' }], totalValue: 49800, status: 'delivered', deliveredAt: '08:12', vehicleId: 'VH-01' },
]

const ISSUE_TAGS: { id: IssueType; label: string; icon: string }[] = [
  { id: 'missing', label: 'Missing Items', icon: '📦' },
  { id: 'damaged', label: 'Damaged Goods', icon: '⚠️' },
  { id: 'wrong-item', label: 'Wrong Item', icon: '↩️' },
  { id: 'quantity-short', label: 'Quantity Short', icon: '⚖️' },
]

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'order', label: 'Place Order', icon: '＋' },
  { id: 'history', label: 'History', icon: '▤' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

function fmtLKR(n: number) { return `LKR ${n.toLocaleString()}` }

function generateRefNumber() {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const seq = String(Math.floor(Math.random() * 90000) + 10000)
  return `REF-${dateStr}-${seq}`
}

function QRCodeDisplay({ value }: { value: string }) {
  let hash = 0
  for (const c of value) hash = (hash * 31 + c.charCodeAt(0)) >>> 0
  const SIZE = 9
  const cells = Array.from({ length: SIZE * SIZE }, (_, i) => {
    const row = Math.floor(i / SIZE), col = i % SIZE
    if (row < 3 && col < 3) return true
    if (row < 3 && col >= SIZE - 3) return true
    if (row >= SIZE - 3 && col < 3) return true
    if (row === 0 || row === SIZE - 1 || col === 0 || col === SIZE - 1) return (i % 2 === 0)
    return ((hash >> (i % 29)) & 1) === 1
  })
  return (
    <div className="bg-white p-3 rounded-xl inline-block shadow-inner">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {cells.map((filled, i) => (
          <div key={i} className={`w-5 h-5 rounded-sm ${filled ? 'bg-slate-900' : 'bg-white'}`} />
        ))}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: OrderStatus }) {
  const cfg = {
    delivered: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
    'in-transit': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
    scheduled: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
    deferred: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
  }[status]
  const label = { delivered: '✓ Delivered', 'in-transit': '→ In Transit', scheduled: '◷ Scheduled', deferred: '⚑ Deferred', pending: '◌ Pending' }[status]
  return <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg}`}>{label}</span>
}

function CutoffTimer() {
  const [secs, setSecs] = useState(() => {
    const now = new Date(); const cutoff = new Date(now); cutoff.setHours(16, 0, 0, 0)
    if (cutoff <= now) cutoff.setDate(cutoff.getDate() + 1)
    return Math.max(0, Math.floor((cutoff.getTime() - now.getTime()) / 1000))
  })
  useEffect(() => { const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000); return () => clearInterval(t) }, [])
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  const pct = (secs / (8 * 3600)) * 100
  const urgent = secs < 3600

  return (
    <div className={`rounded-xl border px-4 py-3 ${urgent ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700' : 'bg-navy-50 dark:bg-navy-900/20 border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold ${urgent ? 'text-orange-700 dark:text-orange-300' : 'text-slate-600 dark:text-slate-300'}`}>{urgent ? '⏱ Order cutoff approaching' : '⏱ Daily order cutoff'}</span>
        <span className={`font-mono text-xs ${urgent ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'}`}>16:00 today</span>
      </div>
      <div className={`font-mono text-2xl font-bold tracking-wider mb-2 ${urgent ? 'text-orange-600 dark:text-orange-400' : 'text-navy-800 dark:text-navy-200'}`}>
        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${urgent ? 'bg-orange-400' : 'bg-navy-500 dark:bg-navy-400'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-1.5">Submit your order before this deadline to guarantee tomorrow's delivery</p>
    </div>
  )
}

function ReceiptModal({ onClose }: { onClose: () => void }) {
  const [issues, setIssues] = useState<IssueType[]>([])
  const [affectedItem, setAffectedItem] = useState('')
  const [note, setNote] = useState('')
  const [signed, setSigned] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [refNumber] = useState(generateRefNumber)

  function toggleIssue(id: IssueType) { setIssues(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 dark:text-green-400 text-3xl">✓</span>
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-xl mb-2">Receipt Confirmed</h2>
          {issues.length > 0
            ? <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Delivery accepted with {issues.length} issue{issues.length > 1 ? 's' : ''} reported. Our team will follow up within 2 hours.</p>
            : <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Delivery confirmed with no issues. Stock records have been updated.</p>
          }

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 p-4 mb-4">
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-3">Driver Reference — Show or read to driver</p>
            <div className="flex flex-col items-center gap-3">
              <QRCodeDisplay value={refNumber} />
              <div>
                <p className="font-mono text-xl font-bold text-slate-900 dark:text-white tracking-wider">{refNumber}</p>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5">Delivery proof reference number</p>
              </div>
            </div>
          </div>

          <p className="font-mono text-[10px] text-slate-400 mb-4">Driver scans this QR or enters the reference number in their app to complete proof of delivery</p>
          <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-navy-700 dark:bg-navy-600 text-white font-semibold text-base hover:bg-navy-600 dark:hover:bg-navy-500 transition-colors">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
        <div className="bg-navy-700 dark:bg-navy-800 px-5 py-4">
          <h2 className="font-bold text-white text-lg">Delivery Receipt</h2>
          <p className="text-navy-200 text-sm mt-0.5">Confirm what arrived or report a problem</p>
        </div>

        <div className="overflow-y-auto max-h-[70vh] p-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">VH-01 · WP-CAB-7732</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Nuwan Perera · Arrived 08:24</p>
              </div>
              <StatusPill status="delivered" />
            </div>
            <div className="space-y-1.5">
              {PAST_ORDERS[0].items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200 font-medium">{item.qty} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Any issues with this delivery?</p>
            <div className="grid grid-cols-2 gap-2">
              {ISSUE_TAGS.map(tag => (
                <button key={tag.id} onClick={() => toggleIssue(tag.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all active:scale-95 ${issues.includes(tag.id) ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500'}`}>
                  <span className="text-lg shrink-0">{tag.icon}</span>
                  <span className={`text-sm font-medium leading-tight ${issues.includes(tag.id) ? 'text-orange-700 dark:text-orange-300' : 'text-slate-600 dark:text-slate-300'}`}>{tag.label}</span>
                </button>
              ))}
            </div>
          </div>

          {issues.length > 0 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Affected Item(s)</label>
                <input value={affectedItem} onChange={e => setAffectedItem(e.target.value)} placeholder="e.g. Fresh Dairy — Full Cream Milk"
                  className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-400/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Notes</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Describe the issue — batch, quantity affected, visible damage…"
                  className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-400/20" />
              </div>
            </div>
          )}

          <button onClick={() => setSigned(s => !s)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${signed ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700'}`}>
            <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${signed ? 'border-green-500 bg-green-500' : 'border-slate-300 dark:border-slate-500'}`}>
              {signed && <span className="text-white font-bold">✓</span>}
            </div>
            <span className={`text-sm font-medium text-left ${signed ? 'text-green-800 dark:text-green-300' : 'text-slate-600 dark:text-slate-300'}`}>
              I confirm the above goods have been physically received at {OUTLET.name}
            </span>
          </button>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
          <button onClick={() => { if (signed) setSubmitted(true) }} disabled={!signed}
            className={`flex-[2] py-3.5 rounded-xl font-semibold text-sm transition-all ${signed ? issues.length > 0 ? 'bg-orange-500 hover:bg-orange-400 text-white' : 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}>
            {issues.length > 0 ? 'Confirm & Report Issues' : 'Confirm Receipt'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DashboardTab({ onOpenReceipt }: { onOpenReceipt: () => void }) {
  const deferredOrders = PAST_ORDERS.filter(o => o.status === 'deferred')
  return (
    <div className="space-y-4">
      {deferredOrders.map(order => (
        <div key={order.id} className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 rounded-r-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-orange-500 text-xl shrink-0">⚑</span>
            <div className="flex-1">
              <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm mb-0.5">Delivery Notice: Order {order.id}</p>
              <p className="text-orange-700 dark:text-orange-400 text-sm leading-relaxed">{order.deferralReason}</p>
              <p className="font-mono text-[11px] text-orange-500 mt-2">Placed {order.date} · {fmtLKR(order.totalValue)}</p>
            </div>
          </div>
        </div>
      ))}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-navy-600/20 dark:border-navy-700/40 shadow-sm overflow-hidden">
        <div className="bg-navy-700 dark:bg-navy-800 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] text-navy-200 uppercase tracking-widest">Incoming Delivery</p>
            <p className="font-bold text-white text-base mt-0.5">{INCOMING.vehicleId} · {INCOMING.plate}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] text-navy-300">ETA</p>
            <p className="font-mono text-2xl font-bold text-white">{INCOMING.etaTime}</p>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-slate-600 dark:text-slate-300">Driver: <span className="font-medium text-slate-800 dark:text-white">{INCOMING.driver}</span></span>
            <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-700">In Transit</span>
          </div>
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Depot</span><span>Stop {INCOMING.currentStop}/{INCOMING.stops}</span><span>Your outlet</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-navy-600 dark:bg-navy-400 rounded-full transition-all" style={{ width: `${INCOMING.progress}%` }} />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-slate-400 mt-1">
              <span>Departed {INCOMING.departedAt}</span><span>{INCOMING.progress}% complete</span>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-3 py-2.5 text-sm text-blue-700 dark:text-blue-300">
            <span className="font-semibold">👷 Prepare receiving staff</span> — estimated arrival in approx. {Math.round((100 - INCOMING.progress) * 0.8)} min
          </div>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3">
          <button onClick={onOpenReceipt} className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors active:scale-[0.98]">
            Confirm Delivery Receipt
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <span className="font-semibold text-slate-800 dark:text-white text-sm">Stock Alerts</span>
          <span className="font-mono text-[10px] text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded-full">{CATEGORIES.filter(c => c.stock <= c.reorderAt).length} low</span>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700/60">
          {CATEGORIES.filter(c => c.stock <= c.reorderAt).map(cat => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0"><span className="text-orange-600 dark:text-orange-400 text-sm font-bold">{cat.stock}</span></div>
              <div className="flex-1"><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{cat.name}</p><p className="font-mono text-[10px] text-slate-400">Reorder at {cat.reorderAt} {cat.unit}</p></div>
              <span className="font-mono text-[10px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 px-2 py-0.5 rounded-full">Low Stock</span>
            </div>
          ))}
          {CATEGORIES.filter(c => c.stock > c.reorderAt).slice(0, 2).map(cat => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3 opacity-60">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0"><span className="text-green-600 dark:text-green-400 text-sm font-bold">{cat.stock}</span></div>
              <div className="flex-1"><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{cat.name}</p><p className="font-mono text-[10px] text-slate-400">Reorder at {cat.reorderAt} {cat.unit}</p></div>
              <span className="font-mono text-[10px] text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 px-2 py-0.5 rounded-full">OK</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OrderTab() {
  const [quantities, setQuantities] = useState<Record<string, number>>(Object.fromEntries(CATEGORIES.map(c => [c.id, 0])))
  const [submitted, setSubmitted] = useState(false)
  const [orderNote, setOrderNote] = useState('')

  function setQty(id: string, delta: number) {
    const cat = CATEGORIES.find(c => c.id === id)!
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, Math.min(cat.maxQty, (prev[id] ?? 0) + delta)) }))
  }

  const lines = CATEGORIES.filter(c => quantities[c.id] > 0)
  const totalValue = lines.reduce((s, c) => s + quantities[c.id] * c.pricePerUnit, 0)
  const totalWeight = lines.reduce((s, c) => s + quantities[c.id] * 18, 0)

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center"><span className="text-green-600 dark:text-green-400 text-4xl">✓</span></div>
        <h2 className="font-bold text-slate-900 dark:text-white text-xl">Order Submitted</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">Your order has been sent to the Waypoint dispatch system and will be allocated to tomorrow's run.</p>
        <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-5 py-4 text-left w-full max-w-xs">
          <p className="font-mono text-[10px] text-slate-400 uppercase mb-2">Order Summary</p>
          {lines.map(c => <div key={c.id} className="flex justify-between text-sm py-1"><span className="text-slate-600 dark:text-slate-300">{c.name}</span><span className="font-mono text-slate-700 dark:text-slate-200">{quantities[c.id]} {c.unit}</span></div>)}
          <div className="border-t border-slate-200 dark:border-slate-600 mt-2 pt-2 flex justify-between font-semibold">
            <span className="text-slate-700 dark:text-slate-200">Total</span><span className="text-navy-700 dark:text-navy-300">{fmtLKR(totalValue)}</span>
          </div>
        </div>
        <button onClick={() => { setSubmitted(false); setQuantities(Object.fromEntries(CATEGORIES.map(c => [c.id, 0]))) }}
          className="mt-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          Place Another Order
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <CutoffTimer />
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <p className="font-semibold text-slate-800 dark:text-white text-sm">Select Products</p>
          <p className="font-mono text-[11px] text-slate-400 mt-0.5">Daily chilled & fresh order · Delivery tomorrow</p>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700/60">
          {CATEGORIES.map(cat => {
            const qty = quantities[cat.id]
            const isLow = cat.stock <= cat.reorderAt
            return (
              <div key={cat.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{cat.name}</p>
                      {isLow && <span className="font-mono text-[9px] px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 rounded-full border border-orange-200 dark:border-orange-700">Low Stock</span>}
                    </div>
                    <p className="font-mono text-[11px] text-slate-400 mt-0.5">{fmtLKR(cat.pricePerUnit)} / {cat.unit}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setQty(cat.id, -1)} disabled={qty === 0}
                      className="w-9 h-9 rounded-xl border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-lg text-slate-500 dark:text-slate-400 hover:border-navy-400 hover:text-navy-700 disabled:opacity-30 transition-all active:scale-90">−</button>
                    <span className={`font-mono text-base font-bold w-8 text-center ${qty > 0 ? 'text-navy-700 dark:text-navy-300' : 'text-slate-300 dark:text-slate-600'}`}>{qty}</span>
                    <button onClick={() => setQty(cat.id, 1)} disabled={qty >= cat.maxQty}
                      className="w-9 h-9 rounded-xl border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-lg text-slate-500 dark:text-slate-400 hover:border-navy-400 hover:text-navy-700 disabled:opacity-30 transition-all active:scale-90">+</button>
                  </div>
                </div>
                {qty > 0 && (
                  <div className="flex justify-between font-mono text-xs text-navy-600 dark:text-navy-300 bg-navy-50 dark:bg-navy-900/20 rounded-lg px-3 py-1.5 border border-navy-100 dark:border-navy-800">
                    <span>{qty} {cat.unit}</span><span>{fmtLKR(qty * cat.pricePerUnit)}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {lines.length > 0 && (
        <>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Special Instructions (optional)</label>
            <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} rows={2} placeholder="e.g. Split delivery preferred, call ahead on arrival…"
              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-400/20" />
          </div>
          <div className="bg-white dark:bg-slate-800 border-2 border-navy-100 dark:border-navy-800/60 rounded-2xl p-4 space-y-2">
            <p className="font-semibold text-slate-800 dark:text-white text-sm">Order Summary</p>
            {lines.map(c => <div key={c.id} className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-300">{c.name} × {quantities[c.id]}</span><span className="font-mono text-slate-700 dark:text-slate-200">{fmtLKR(quantities[c.id] * c.pricePerUnit)}</span></div>)}
            <div className="border-t border-slate-200 dark:border-slate-600 pt-2 flex justify-between font-semibold">
              <span className="text-slate-700 dark:text-slate-200">Total · ~{totalWeight} kg</span>
              <span className="text-navy-700 dark:text-navy-300 text-base">{fmtLKR(totalValue)}</span>
            </div>
          </div>
          <button onClick={() => setSubmitted(true)}
            className="w-full py-4 rounded-2xl bg-navy-700 dark:bg-navy-600 hover:bg-navy-600 dark:hover:bg-navy-500 text-white font-bold text-base transition-colors active:scale-[0.98] shadow-lg shadow-navy-900/20">
            Submit Order →
          </button>
        </>
      )}
      {lines.length === 0 && <div className="text-center py-6"><p className="text-slate-400 text-sm">Add quantities above to build your order</p></div>}
    </div>
  )
}

function HistoryTab() {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <div className="space-y-3">
      {PAST_ORDERS.map(order => (
        <div key={order.id} className={`bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden ${order.status === 'deferred' ? 'border-orange-300 dark:border-orange-700' : 'border-slate-200 dark:border-slate-700'}`}>
          <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            className="w-full text-left px-4 py-4 flex items-start gap-3 active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors">
            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${order.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/40' : order.status === 'deferred' ? 'bg-orange-100 dark:bg-orange-900/40' : order.status === 'in-transit' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <span className="text-lg">{order.status === 'delivered' ? '✓' : order.status === 'deferred' ? '⚑' : order.status === 'in-transit' ? '→' : '◌'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-sm font-bold text-slate-800 dark:text-white">{order.id}</span>
                <StatusPill status={order.status} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{order.date} · {order.items.length} lines · {fmtLKR(order.totalValue)}</p>
            </div>
          </button>
          {expanded === order.id && (
            <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 space-y-3">
              {order.status === 'deferred' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl px-3 py-2.5 text-sm text-orange-700 dark:text-orange-300">
                  <span className="font-semibold">Notice: </span>{order.deferralReason}
                </div>
              )}
              <div className="space-y-1.5">
                {order.items.map((item, i) => <div key={i} className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-300">{item.name}</span><span className="font-mono text-slate-700 dark:text-slate-200">{item.qty} {item.unit}</span></div>)}
              </div>
              {order.deliveredAt && <p className="font-mono text-[11px] text-green-600 dark:text-green-400">✓ Delivered at {order.deliveredAt} by {order.vehicleId}</p>}
              {order.vehicleId && order.status === 'in-transit' && <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400">→ {order.vehicleId} en route · ETA {INCOMING.etaTime}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function SettingsTab() {
  const [notifications, setNotifications] = useState(true)
  const [etaAlerts, setEtaAlerts] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(false)
  const [contactName, setContactName] = useState('Dilini Rajapaksa')
  const [contactPhone, setContactPhone] = useState('+94 11 456 7890')

  function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button onClick={onToggle} className={`w-11 h-6 rounded-full transition-colors ${on ? 'bg-navy-600 dark:bg-navy-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
        <div className={`bg-white rounded-full shadow transition-transform`} style={{ width: 18, height: 18, margin: '3px', transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700"><p className="font-semibold text-slate-800 dark:text-white text-sm">Outlet Details</p></div>
        <div className="p-4 space-y-3">
          {[{ label: 'Outlet ID', value: OUTLET.id }, { label: 'Outlet Name', value: OUTLET.name }, { label: 'Brand', value: OUTLET.brand }, { label: 'District', value: OUTLET.district }].map(f => (
            <div key={f.label} className="flex justify-between items-center py-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{f.label}</span>
              <span className="font-mono text-xs text-slate-700 dark:text-slate-200 font-medium">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700"><p className="font-semibold text-slate-800 dark:text-white text-sm">Store Contact</p></div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1.5">Manager Name</label>
            <input value={contactName} onChange={e => setContactName(e.target.value)} className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-400/20" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1.5">Phone</label>
            <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-400/20" />
          </div>
          <button className="w-full py-2.5 rounded-xl bg-navy-700 dark:bg-navy-600 text-white font-semibold text-sm hover:bg-navy-600 dark:hover:bg-navy-500 transition-colors active:scale-[0.98]">Save Changes</button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700"><p className="font-semibold text-slate-800 dark:text-white text-sm">Notifications</p></div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700/60">
          {[
            { label: 'Push notifications', sub: 'Delivery updates and alerts', on: notifications, toggle: () => setNotifications(n => !n) },
            { label: 'ETA alerts', sub: '30-min arrival reminder', on: etaAlerts, toggle: () => setEtaAlerts(n => !n) },
            { label: 'SMS alerts', sub: 'Text message for deferral notices', on: smsAlerts, toggle: () => setSmsAlerts(n => !n) },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3.5">
              <div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p><p className="text-xs text-slate-400">{item.sub}</p></div>
              <Toggle on={item.on} onToggle={item.toggle} />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-navy-50 dark:bg-navy-900/20 border border-navy-100 dark:border-navy-800/60 rounded-2xl p-4">
        <p className="font-semibold text-navy-800 dark:text-navy-200 text-sm mb-2">Delivery Schedule</p>
        <div className="space-y-1.5 font-mono text-xs text-navy-600 dark:text-navy-300">
          <div className="flex justify-between"><span>Order cutoff</span><span className="font-bold">16:00 daily</span></div>
          <div className="flex justify-between"><span>Fresh orders</span><span>Daily (Mon–Sat)</span></div>
          <div className="flex justify-between"><span>Delivery window</span><span>06:30 – 08:00</span></div>
          <div className="flex justify-between"><span>Hub</span><span>Peliyagoda</span></div>
        </div>
      </div>
    </div>
  )
}

export default function StoreApp({ onSwitchView, isDark = false, onToggleDark }: {
  onSwitchView: () => void; isDark?: boolean; onToggleDark?: () => void
}) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [showReceipt, setShowReceipt] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifCount = PAST_ORDERS.filter(o => o.status === 'deferred').length + 1

  const content = (
    <main className="flex-1 p-4 pb-8 overflow-y-auto">
      {tab === 'dashboard' && <DashboardTab onOpenReceipt={() => setShowReceipt(true)} />}
      {tab === 'order' && <OrderTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'settings' && <SettingsTab />}
    </main>
  )

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-[100dvh] bg-slate-100 dark:bg-slate-900 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="hidden lg:flex h-[100dvh] overflow-hidden">
          <aside className="w-56 bg-navy-700 dark:bg-navy-900 flex flex-col shrink-0">
            <div className="px-5 py-6 border-b border-navy-600/60 dark:border-navy-800">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0"><span className="font-black text-white text-base">W</span></div>
                <div><div className="font-mono text-[10px] text-navy-200 uppercase tracking-widest leading-none mb-0.5">{OUTLET.id}</div><div className="font-bold text-white text-sm leading-tight">{OUTLET.name}</div></div>
              </div>
              <div className="flex items-center gap-2 mt-3"><div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[9px] text-white shrink-0">{OUTLET.manager.split(' ').map(n => n[0]).join('')}</div><span className="font-mono text-[10px] text-navy-200">{OUTLET.manager} · Manager</span></div>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${tab === t.id ? 'bg-white/20 text-white' : 'text-navy-200 hover:bg-white/10 hover:text-white'}`}>
                  <span className="text-lg shrink-0">{t.icon}</span>
                  <span className="text-sm font-medium">{t.label}</span>
                  {t.id === 'dashboard' && notifCount > 0 && <span className="ml-auto font-mono text-[10px] bg-orange-400 text-white px-1.5 py-0.5 rounded-full">{notifCount}</span>}
                </button>
              ))}
            </nav>
            <div className="px-3 pb-4 space-y-2">
              {onToggleDark && (
                <button onClick={onToggleDark} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-navy-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium">
                  <span className="text-lg">{isDark ? '☀' : '☾'}</span>
                  <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              )}
              <button onClick={onSwitchView} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-navy-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium">
                <span className="text-lg">⇄</span><span>Switch Role</span>
              </button>
            </div>
          </aside>

          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-4 shrink-0 flex items-center justify-between">
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white text-xl">{TABS.find(t => t.id === tab)?.label}</h1>
                <p className="font-mono text-xs text-slate-400 mt-0.5">Waypoint Fresh Colombo · OUT-001</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono text-[10px] text-slate-400">Incoming ETA</p>
                  <p className="font-mono text-lg font-bold text-navy-700 dark:text-navy-300">{INCOMING.etaTime}</p>
                </div>
                <div className="relative">
                  <button onClick={() => setNotifOpen(n => !n)} className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 flex items-center justify-center transition-colors hover:border-slate-300 relative">
                    <span className="text-lg">🔔</span>
                    {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-400 text-white font-mono text-[9px] font-bold flex items-center justify-center">{notifCount}</span>}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 top-12 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700"><p className="font-semibold text-slate-800 dark:text-white text-sm">Notifications</p></div>
                      <div className="divide-y divide-slate-50 dark:divide-slate-700/60">
                        <div className="px-4 py-3 flex items-start gap-3"><span className="text-orange-500 text-lg shrink-0">⚑</span><div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Delivery Deferred</p><p className="text-xs text-slate-500 dark:text-slate-400">ORD-20261002 moved to next run</p><p className="font-mono text-[10px] text-slate-400 mt-0.5">{PAST_ORDERS[1].date}</p></div></div>
                        <div className="px-4 py-3 flex items-start gap-3"><span className="text-blue-500 text-lg shrink-0">→</span><div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">VH-01 En Route</p><p className="text-xs text-slate-500 dark:text-slate-400">ETA 08:24 · Prepare receiving staff</p><p className="font-mono text-[10px] text-slate-400 mt-0.5">Today</p></div></div>
                      </div>
                      <button onClick={() => setNotifOpen(false)} className="w-full py-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-mono transition-colors">Dismiss all</button>
                    </div>
                  )}
                </div>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl">
              {tab === 'dashboard' && <DashboardTab onOpenReceipt={() => setShowReceipt(true)} />}
              {tab === 'order' && <OrderTab />}
              {tab === 'history' && <HistoryTab />}
              {tab === 'settings' && <SettingsTab />}
            </div>
          </div>
        </div>

        <div className="lg:hidden flex flex-col min-h-[100dvh] max-w-[480px] md:max-w-2xl mx-auto w-full">
          <header className="bg-navy-700 dark:bg-navy-900 text-white sticky top-0 z-40 shadow-lg">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0"><span className="font-black text-white text-base">W</span></div>
                  <div><div className="font-mono text-[10px] text-navy-200 uppercase tracking-widest leading-none mb-0.5">{OUTLET.id}</div><div className="font-bold text-white text-base leading-tight">{OUTLET.name}</div></div>
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-1">
                  {onToggleDark && (
                    <button onClick={onToggleDark} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors font-mono text-sm">
                      {isDark ? '☀' : '☾'}
                    </button>
                  )}
                  <div className="relative">
                    <button onClick={() => setNotifOpen(n => !n)} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors relative">
                      <span className="text-lg">🔔</span>
                      {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-400 text-white font-mono text-[9px] font-bold flex items-center justify-center">{notifCount}</span>}
                    </button>
                    {notifOpen && (
                      <div className="absolute right-0 top-11 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700"><p className="font-semibold text-slate-800 dark:text-white text-sm">Notifications</p></div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-700/60">
                          <div className="px-4 py-3 flex items-start gap-3"><span className="text-orange-500 text-lg shrink-0">⚑</span><div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Delivery Deferred</p><p className="text-xs text-slate-500 dark:text-slate-400">ORD-20261002 moved to next run</p></div></div>
                          <div className="px-4 py-3 flex items-start gap-3"><span className="text-blue-500 text-lg shrink-0">→</span><div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">VH-01 En Route · ETA 08:24</p></div></div>
                        </div>
                        <button onClick={() => setNotifOpen(false)} className="w-full py-3 text-xs text-slate-400 font-mono transition-colors">Dismiss all</button>
                      </div>
                    )}
                  </div>
                  <button onClick={onSwitchView} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 text-base transition-colors" title="Switch view">⇄</button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] text-white shrink-0">{OUTLET.manager.split(' ').map(n => n[0]).join('')}</div>
                <span className="font-mono text-[11px] text-navy-200">{OUTLET.manager} · Store Manager</span>
              </div>
            </div>
            <div className="flex border-t border-white/10">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-mono font-medium transition-colors border-b-2 ${tab === t.id ? 'border-white text-white' : 'border-transparent text-navy-300 hover:text-white'}`}>
                  <span className="text-base leading-none">{t.icon}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </header>
          {content}
        </div>

        {showReceipt && <ReceiptModal onClose={() => setShowReceipt(false)} />}
        {notifOpen && <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />}
      </div>
    </div>
  )
}