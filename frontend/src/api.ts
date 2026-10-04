const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`HTTP ${res.status}: ${detail || 'Request failed'}`)
  }
  return res.json()
}

export interface BackendOrder {
  delivery_id: string
  order_date: string
  dispatch_date?: string | null
  dispatch_status: string
  outlet_id: string
  brand: string
  district: string
  depot: string
  temp_requirement: string
  order_units: number
  order_weight_kg: number
  order_volume_m3: number
  vehicle_id?: string | null
  trip_id?: number | null
  seq_in_route?: number | null
  deferred_yesterday?: number
  days_since_last_served?: number
}

export interface BackendVehicle {
  vehicle_id: string
  type: string
  temp: string
  weight_cap_kg: number
  volume_cap_m3: number
  fuel_type: string
  km_per_l: number
  weekly_fuel_quota_l: number
  depot: string
}

export interface BackendOutlet {
  outlet_id: string
  brand: string
  district: string
  depot: string
  dock_type: string
  parking_constraint: string
  window_open_time: string
  window_close_time: string
  mall_window?: string | null
}

export const api = {
  getOrders: () => request<BackendOrder[]>('/orders'),
  createOrder: (data: any) => request<BackendOrder>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrder: (id: string, data: Partial<Pick<BackendOrder, 'dispatch_status' | 'vehicle_id' | 'trip_id' | 'seq_in_route'>>) =>
    request<BackendOrder>(`/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getVehicles: () => request<BackendVehicle[]>('/fleet/vehicles'),
  getOutlets: () => request<BackendOutlet[]>('/planning/outlets').catch(() => [] as BackendOutlet[]),
  getActiveRoute: () => request<any>('/delivery/active-route'),
  completeStop: (deliveryId: string) =>
    request<any>('/delivery/complete-stop', { method: 'POST', body: JSON.stringify({ delivery_id: deliveryId }) }),
  getLoadingManifests: () => request<any[]>('/loading/manifests'),
  dispatchTrip: (tripId: string) =>
    request<any>(`/loading/dispatch/${encodeURIComponent(tripId)}`, { method: 'POST' }),
}
