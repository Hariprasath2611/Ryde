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

import { env } from './config/env.js';
import { supabaseServiceClient } from './config/supabase.js';

const app: Express = express();

// Security and standard middlewares
app.use(helmet());

const allowedOrigins = env.CORS_ORIGIN === '*'
  ? true
  : env.CORS_ORIGIN.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Accept'],
  }),
);

// OWASP API4: Strict request body size limits to prevent Denial of Service
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestIdMiddleware);
app.use(globalRateLimiter);

// Liveness health check endpoint
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Deep readiness check with DB connection validation
app.get('/api/v1/health/readiness', async (req, res) => {
  try {
    const startTime = Date.now();
    const { error } = await supabaseServiceClient
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (error) {
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || req.requestId || '',
      });
      return;
    }

    const latencyMs = Date.now() - startTime;
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      dbLatencyMs: latencyMs,
      uptime: process.uptime(),
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      requestId: req.id || req.requestId || '',
    });
  } catch (err: unknown) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'error',
      message: err instanceof Error ? err.message : 'Unknown database error',
      timestamp: new Date().toISOString(),
      requestId: req.id || req.requestId || '',
    });
  }
});

// Minimum App Version check endpoint for Force Update
app.get('/api/v1/app/version', (req, res) => {
  const platform = (req.query['platform'] as string) || 'android';
  res.status(200).json({
    platform,
    minVersion: env.MIN_APP_VERSION,
    latestVersion: env.LATEST_APP_VERSION,
    updateUrl:
      platform === 'ios'
        ? 'https://apps.apple.com/app/id6400000000'
        : 'https://play.google.com/store/apps/details?id=com.ryde.capital',
    forceUpdateRequired: false,
    message: 'App is up to date',
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
