import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestIdMiddleware } from './middleware/requestId.js';
import { globalRateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import { authRoutes } from './modules/auth/routes.js';
import { driverRoutes } from './modules/driver/routes.js';
import { availabilityRoutes } from './modules/availability/routes.js';
import { assignmentRoutes } from './modules/assignments/routes.js';
import { tripRoutes } from './modules/trips/routes.js';
import { locationRoutes } from './modules/location/routes.js';
import { earningRoutes } from './modules/earnings/routes.js';
import { notificationRoutes } from './modules/notifications/routes.js';
import { complaintRoutes } from './modules/complaints/routes.js';
import { safetyRoutes } from './modules/safety/routes.js';
import { adminRoutes } from './modules/admin/routes.js';

const app: Express = express();

// Security and standard middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(globalRateLimiter);

// Health check endpoint (Task 3: returns status, uptime, version)
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount modules under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/drivers/me/availability', availabilityRoutes);
app.use('/api/v1/availability', availabilityRoutes);
app.use('/api/v1/drivers/me/location', locationRoutes);
app.use('/api/v1/location', locationRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/trips', tripRoutes);
app.use('/api/v1/earnings', earningRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1', safetyRoutes);
app.use('/', safetyRoutes); // allows unauthenticated /public/track/:token directly


// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      requestId: req.id || req.requestId || '',
    },
  });
});

// Central error handler
app.use(errorHandler);

export { app };
