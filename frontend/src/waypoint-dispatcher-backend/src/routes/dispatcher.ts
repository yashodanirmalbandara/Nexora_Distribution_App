import { Router, Request, Response } from 'express';

const router = Router();

router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    // Hardcoded mock values bypassing Prisma completely
    const unassignedOrders = 12;
    const availableVehicles = 5;
    const activeRoutes = 3;
    const completedDeliveriesToday = 28;

    res.json({
      success: true,
      data: {
        unassignedOrders,
        availableVehicles,
        activeRoutes,
        completedDeliveriesToday,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;