export type OrderStatus = 'Unassigned' | 'Assigned' | 'Deferred' | 'Delivered'
export type TempReq = 'Reefer' | 'Ambient'
export type VehicleType = 'Dry-box' | 'Refrigerated' | 'Small Van'
export type BrandTab = 'All' | 'Waypoint Fresh' | 'Waypoint Style' | 'Waypoint Tech'
export type NavItem = 'dashboard' | 'order-queue' | 'fleet-allocation' | 'live-tracking' | 'deferrals' | 'reports' | 'delivery-confirmation'

export interface Order {
  id: string
  outletId: string
  district: string
  brand: BrandTab
  tempReq: TempReq
  volume: number
  weight: number
  status: OrderStatus
  vehicleId?: string
  tripNo?: 1 | 2
  deferredYesterday?: boolean
}
export interface Vehicle {
  id: string
  plate: string
  driver: string
  type: VehicleType
  tempType: TempReq
  depot: 'Peliyagoda' | 'Kandy'
  maxWeight: number
  maxVolume: number
  availability: 'Available' | 'In Transit' | 'In Workshop' | 'Loading'
  fuelUsed: number
  fuelQuota: number
  routeProgress: number
  trip1Orders: string[]
  trip2Orders: string[]
  eta: string
}
export interface DeferralEntry {
  orderId: string; outletId: string; brand: string; district: string; weight: number
  reasonCode: string; note: string; timestamp: string; deferredYesterday: boolean
}
export interface CompletedTrip {
  vehicleId: string; plate: string; driver: string; depot: string; completedAt: string
  confirmedByDispatcher: boolean; confirmedAt?: string
  stops: { outletId: string; signedBy?: string; status: string }[]
}
export const NAV_ITEMS: { id: NavItem; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'order-queue', label: 'Order Queue', icon: '📋' },
  { id: 'fleet-allocation', label: 'Fleet & Allocation', icon: '🚛' },
  { id: 'live-tracking', label: 'Live Tracking', icon: '📍' },
  { id: 'deferrals', label: 'Deferrals Log', icon: '⚠️' },
  { id: 'reports', label: 'Reports & Analytics', icon: '📈' },
  { id: 'delivery-confirmation', label: 'Delivery Confirm', icon: '✓' },
]
export const REASON_CODES = [
  { code: 'CAP_EXCEEDED', label: 'Weight or volume exceeds vehicle capacity' },
  { code: 'NO_REEFER', label: 'No refrigerated vehicle available for fresh items' },
  { code: 'TIME_CUTOFF', label: 'Order placed after daily cutoff window' },
  { code: 'FUEL_LIMIT', label: 'Vehicle reached weekly fuel quota limit' },
  { code: 'OUTLET_CLOSED', label: 'Outlet receiving window unavailable' },
]
