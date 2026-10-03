import { Router, Request, Response } from 'express';

const router = Router();

// In-memory mock data (zero database dependence)
let orders: any[] = [
  {
    id: "ORD-901",
    brand: "Waypoint Fresh",
    items: [{ name: "Organic Produce Box", qty: 25 }],
    submittedAt: "2026-10-02T14:30:00Z",
    status: "CONFIRMED_SCHEDULED",
    deliveryWindow: "Before 8:00 AM",
    isDeferred: false
  },
  {
    id: "ORD-902",
    brand: "Waypoint Style",
    items: [{ name: "Apparel Rack A", qty: 10 }],
    submittedAt: "2026-10-01T16:15:00Z",
    status: "DEFERRED",
    deliveryWindow: "Next Fulfillment Run",
    isDeferred: true,
    deferralReason: "Submitted past 4:00 PM cutoff window"
  }
];

let deliveries: any[] = [
  {
    id: "DEL-401",
    brand: "Waypoint Fresh",
    vehicleId: "REEFER-04",
    eta: "07:45 AM",
    status: "IN_TRANSIT",
    itemsCount: 25,
    podCode: "POD-FRESH-8821"
  }
];

function checkIsPastCutoff(): boolean {
  const now = new Date();
  return now.getHours() >= 16; // 4:00 PM cutoff
}

// GET /api/store/dashboard
router.get('/dashboard', (_req: Request, res: Response) => {
  const isPastCutoff = checkIsPastCutoff();
  const now = new Date();
  
  const cutoffTime = new Date();
  cutoffTime.setHours(16, 0, 0, 0);
  if (isPastCutoff) {
    cutoffTime.setDate(cutoffTime.getDate() + 1);
  }
  
  const minutesRemaining = Math.max(0, Math.floor((cutoffTime.getTime() - now.getTime()) / 60000));

  res.json({
    success: true,
    data: {
      cutoffStatus: {
        isPastCutoff,
        cutoffTime: "16:00:00 (4:00 PM)",
        minutesUntilCutoff: minutesRemaining,
        message: isPastCutoff 
          ? "Orders submitted now will defer to the next cycle." 
          : "Orders submitted before 4:00 PM will be processed today."
      },
      summary: {
        activeOrders: orders.filter(o => !o.isDeferred).length,
        deferredOrders: orders.filter(o => o.isDeferred).length,
        incomingDeliveries: deliveries.filter(d => d.status === 'IN_TRANSIT').length
      },
      orders,
      deliveries
    }
  });
});

// POST /api/store/orders
router.post('/orders', (req: Request, res: Response) => {
  const { brand, items } = req.body;

  if (!brand || !items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, error: "Brand and items array are required" });
  }

  const isPastCutoff = checkIsPastCutoff();
  const newOrder = {
    id: `ORD-${Math.floor(100 + Math.random() * 900)}`,
    brand,
    items,
    submittedAt: new Date().toISOString(),
    status: isPastCutoff ? "DEFERRED" : "CONFIRMED_SCHEDULED",
    deliveryWindow: brand === "Waypoint Fresh" ? "Before 8:00 AM" : "Standard Dispatch",
    isDeferred: isPastCutoff,
    deferralReason: isPastCutoff ? "Order placed after the 4:00 PM cutoff deadline." : null
  };

  orders.unshift(newOrder);

  res.status(201).json({
    success: true,
    message: isPastCutoff 
      ? "Order accepted but deferred to the next fulfillment cycle (past 4:00 PM)." 
      : "Order successfully submitted for today's dispatch.",
    data: newOrder
  });
});

// POST /api/store/deliveries/confirm-pod
router.post('/deliveries/confirm-pod', (req: Request, res: Response) => {
  const { deliveryId, podCode } = req.body;

  const delivery = deliveries.find(d => d.id === deliveryId);

  if (!delivery) {
    return res.status(404).json({ success: false, error: "Delivery shipment not found" });
  }

  if (delivery.podCode !== podCode) {
    return res.status(400).json({ success: false, error: "Invalid Proof-of-Delivery confirmation code" });
  }

  delivery.status = "COMPLETED_DELIVERED";
  delivery.receivedAt = new Date().toISOString();

  res.json({
    success: true,
    message: "Proof of Delivery verified and goods acknowledged.",
    data: delivery
  });
});

export default router;