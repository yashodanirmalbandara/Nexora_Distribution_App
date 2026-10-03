import { Router, Request, Response } from 'express';

const router = Router();

// In-memory store directory (can be added to manually)
let stores = [
  { id: "STORE-101", name: "Waypoint Fresh - Peliyagoda Outlet", lat: 6.9678, lng: 79.8897, accessType: "Standard" },
  { id: "STORE-102", name: "Waypoint Style - Kandy City Centre", lat: 7.2906, lng: 80.6337, accessType: "Van Only" },
  { id: "STORE-103", name: "Waypoint Tech - Colombo Fort", lat: 6.9344, lng: 79.8428, accessType: "Mall Window" }
];

// In-memory driver active trip route
let activeTrip = {
  tripId: "TRIP-8042",
  driverName: "Nuwan Perera",
  vehicleId: "REEFER-04",
  vehiclePlate: "WP-CAB-7732",
  status: "IN_TRANSIT",
  stops: [
    {
      stopNumber: 1,
      storeId: "STORE-101",
      storeName: "Waypoint Fresh - Peliyagoda Outlet",
      lat: 6.9678,
      lng: 79.8897,
      deliveryStatus: "COMPLETED",
      podCode: "POD-991",
      eta: "07:15 AM"
    },
    {
      stopNumber: 2,
      storeId: "STORE-102",
      storeName: "Waypoint Style - Kandy City Centre",
      lat: 7.2906,
      lng: 80.6337,
      deliveryStatus: "PENDING",
      podCode: "POD-882",
      eta: "08:30 AM"
    }
  ]
};

// GET /api/driver/active-route - Fetch map coordinates & stop sequence
router.get('/active-route', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: activeTrip
  });
});

// POST /api/driver/stores - Add a new store manually with GPS coordinates
router.post('/stores', (req: Request, res: Response) => {
  const { name, lat, lng, accessType } = req.body;

  if (!name || lat === undefined || lng === undefined) {
    return res.status(400).json({ 
      success: false, 
      error: "Store name, latitude (lat), and longitude (lng) are required." 
    });
  }

  const newStore = {
    id: `STORE-${100 + stores.length + 1}`,
    name,
    lat: Number(lat),
    lng: Number(lng),
    accessType: accessType || "Standard"
  };

  stores.push(newStore);

  res.status(201).json({
    success: true,
    message: "New store location registered successfully.",
    data: newStore
  });
});

// GET /api/driver/stores - List all registered store locations
router.get('/stores', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: stores.length,
    data: stores
  });
});

// POST /api/driver/complete-stop - Confirm delivery at a map stop
router.post('/complete-stop', (req: Request, res: Response) => {
  const { stopNumber, podCode } = req.body;

  const stop = activeTrip.stops.find(s => s.stopNumber === Number(stopNumber));

  if (!stop) {
    return res.status(404).json({ success: false, error: "Stop number not found in route" });
  }

  if (stop.podCode !== podCode) {
    return res.status(400).json({ success: false, error: "Invalid Proof-of-Delivery code" });
  }

  stop.deliveryStatus = "COMPLETED";

  res.json({
    success: true,
    message: `Stop #${stopNumber} at ${stop.storeName} marked as delivered.`,
    data: stop
  });
});

export default router;