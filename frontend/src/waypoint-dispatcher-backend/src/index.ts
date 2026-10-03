import express from 'express';
import cors from 'cors';

// Import modular role routes
import dispatcherRoutes from './routes/dispatcher';
import storeRoutes from './routes/store';
import driverRoutes from './routes/driver';
import loaderRoutes from './routes/loader';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// System Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    system: 'Waypoint Logistics API Engine',
    timestamp: new Date().toISOString()
  });
});

// Mount Modular API Routes
app.use('/api/dispatcher', dispatcherRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/loader', loaderRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// Start Express Server
app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Waypoint Backend Engine Running`);
  console.log(`📡 Base URL: http://localhost:${PORT}`);
  console.log(`📋 Loader API: http://localhost:${PORT}/api/loader/manifests`);
  console.log(`🚚 Driver API: http://localhost:${PORT}/api/driver/active-route`);
  console.log('=================================');
});