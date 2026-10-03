export type OrderStatus = 'Unassigned' | 'Assigned' | 'Deferred' | 'Delivered'
export type TempReq = 'Reefer' | 'Ambient'
export type VehicleType = 'Dry-box' | 'Refrigerated' | 'Small Van'
export type BrandTab = 'All' | 'Waypoint Fresh' | 'Waypoint Style' | 'Waypoint Tech'
export type NavItem =
  | 'dashboard'
  | 'order-queue'
  | 'fleet-allocation'
  | 'live-tracking'
  | 'deferrals'
  | 'reports'
  | 'delivery-confirmation'

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
  orderId: string
  outletId: string
  brand: string
  district: string
  weight: number
  reasonCode: string
  note: string
  timestamp: string
  deferredYesterday: boolean
}

export interface CompletedTrip {
  vehicleId: string
  plate: string
  driver: string
  depot: string
  completedAt: string
  confirmedByDispatcher: boolean
  confirmedAt?: string
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

export const SEED_ORDERS: Order[] = [
  { id: 'ORD-101', outletId: 'PLY-004', district: 'Colombo', brand: 'Waypoint Fresh', tempReq: 'Reefer', volume: 1.8, weight: 420, status: 'Unassigned' },
  { id: 'ORD-102', outletId: 'MGM-011', district: 'Colombo', brand: 'Waypoint Fresh', tempReq: 'Reefer', volume: 1.3, weight: 310, status: 'Unassigned' },
  { id: 'ORD-103', outletId: 'KDY-007', district: 'Central', brand: 'Waypoint Fresh', tempReq: 'Reefer', volume: 0.9, weight: 210, status: 'Unassigned' },
  { id: 'ORD-104', outletId: 'CBO-002', district: 'Colombo', brand: 'Waypoint Style', tempReq: 'Ambient', volume: 2.1, weight: 180, status: 'Unassigned' },
  { id: 'ORD-105', outletId: 'CBO-005', district: 'Colombo', brand: 'Waypoint Tech', tempReq: 'Ambient', volume: 1.5, weight: 140, status: 'Unassigned' },
  { id: 'ORD-106', outletId: 'NEG-001', district: 'Gampaha', brand: 'Waypoint Fresh', tempReq: 'Reefer', volume: 2.4, weight: 580, status: 'Unassigned', deferredYesterday: true },
]

export const SEED_VEHICLES: Vehicle[] = [
  { id: 'VH-01', plate: 'WP-CAB-7732', driver: 'Nuwan Perera', type: 'Refrigerated', tempType: 'Reefer', depot: 'Peliyagoda', maxWeight: 3000, maxVolume: 12.0, availability: 'Available', fuelUsed: 140, fuelQuota: 160, routeProgress: 62, trip1Orders: [], trip2Orders: [], eta: '08:24' },
  { id: 'VH-02', plate: 'WP-CAB-8819', driver: 'Kasun Silva', type: 'Dry-box', tempType: 'Ambient', depot: 'Peliyagoda', maxWeight: 3500, maxVolume: 15.0, availability: 'Available', fuelUsed: 80, fuelQuota: 180, routeProgress: 0, trip1Orders: [], trip2Orders: [], eta: '09:15' },
  { id: 'VH-03', plate: 'WP-CAB-9901', driver: 'Sunil Fernando', type: 'Small Van', tempType: 'Ambient', depot: 'Kandy', maxWeight: 1200, maxVolume: 6.0, availability: 'In Workshop', fuelUsed: 155, fuelQuota: 150, routeProgress: 0, trip1Orders: [], trip2Orders: [], eta: 'N/A' },
]

export const SEED_DEFERRALS: DeferralEntry[] = [
  { orderId: 'ORD-106', outletId: 'NEG-001', brand: 'Waypoint Fresh', district: 'Gampaha', weight: 580, reasonCode: 'CAP_EXCEEDED', note: 'Exceeded reefer truck capacity on Trip 1', timestamp: '08:15', deferredYesterday: true },
]

export const SEED_COMPLETED_TRIPS: CompletedTrip[] = [
  {
    vehicleId: 'VH-02',
    plate: 'WP-CAB-8819',
    driver: 'Kasun Silva',
    depot: 'Peliyagoda',
    completedAt: '12:30',
    confirmedByDispatcher: false,
    stops: [
      { outletId: 'CBO-002', signedBy: 'S. Jayasooriya', status: 'Delivered' },
      { outletId: 'CBO-005', signedBy: 'M. Perera', status: 'Delivered' },
    ],
  },
]