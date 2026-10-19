import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again after 15 minutes',
        requestId: req.id || req.requestId || '',
      },
    });
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // stricter for auth
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many authentication attempts, please try again later',
        requestId: req.id || req.requestId || '',
      },
    });
  },
});
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // limit upload attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many document upload requests, please try again later',
        requestId: req.id || req.requestId || '',
      },
    });
  },
});

export const locationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // up to 120 requests per minute per driver
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Location update rate limit exceeded, please slow down pings',
        requestId: req.id || req.requestId || '',
      },
    });
  },
});
