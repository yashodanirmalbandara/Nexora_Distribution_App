export interface Order {
  id: string
  customer: string
  status: 'PENDING' | 'DISPATCHED' | 'DELIVERED'
  items_count: number
}

const API_BASE = '/api'

export const api = {
  // Fetch all orders
  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders`)
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch orders`)
    return res.json()
  },

  // Update order status (Mutation)
  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to update order`)
    return res.json()
  },
}