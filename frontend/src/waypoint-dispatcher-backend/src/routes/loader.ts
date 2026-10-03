import { Router, Request, Response } from 'express';

const router = Router();

// Sample in-memory manifest data for vehicle loading dock
let loadingManifests = [
  {
    tripId: "TRIP-8042",
    vehicleId: "REEFER-04",
    vehiclePlate: "WP-CAB-7732",
    driverName: "Nuwan Perera",
    dockNumber: "DOCK-02",
    tempRequirement: "Reefer (4°C)",
    currentTemp: "3.8°C",
    status: "LOADING", // "QUEUED" | "LOADING" | "DISPATCHED"
    totalCrateCount: 45,
    loadedCrateCount: 30,
    items: [
      { id: "ITEM-101", name: "Fresh Dairy Crates", qty: 20, loaded: true },
      { id: "ITEM-102", name: "Chilled Produce Bins", qty: 25, loaded: false }
    ]
  }
];

// GET /api/loader/manifests - Active dock loading queues
router.get('/manifests', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: loadingManifests
  });
});

// POST /api/loader/update-crate - Mark crates or items as loaded
router.post('/update-crate', (req: Request, res: Response) => {
  const { tripId, itemId, loaded } = req.body;

  const manifest = loadingManifests.find(m => m.tripId === tripId);
  if (!manifest) {
    return res.status(404).json({ success: false, error: "Trip manifest not found" });
  }

  const item = manifest.items.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ success: false, error: "Item not found in manifest" });
  }

  item.loaded = loaded;

  // Recalculate total loaded count
  manifest.loadedCrateCount = manifest.items
    .filter(i => i.loaded)
    .reduce((sum, i) => sum + i.qty, 0);

  res.json({
    success: true,
    message: `Updated item ${itemId} loading state.`,
    data: manifest
  });
});

// POST /api/loader/dispatch - Finalize loading and release vehicle to Driver
router.post('/dispatch', (req: Request, res: Response) => {
  const { tripId } = req.body;

  const manifest = loadingManifests.find(m => m.tripId === tripId);
  if (!manifest) {
    return res.status(404).json({ success: false, error: "Trip manifest not found" });
  }

  manifest.status = "DISPATCHED";

  res.json({
    success: true,
    message: `Vehicle ${manifest.vehiclePlate} marked DISPATCHED for driver transit.`,
    data: manifest
  });
});

export default router;