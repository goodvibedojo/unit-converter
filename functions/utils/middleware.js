/**
 * Middleware utilities for Cloud Functions
 * Provides authentication, CORS, validation, and rate limiting
 */

const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

/**
 * CORS middleware wrapper
 * Enables CORS for all HTTP functions
 */
const withCORS = (handler) => {
  return (req, res) => {
    return cors(req, res, () => handler(req, res));
  };
};

/**
 * Authentication middleware
 * Verifies Firebase Auth token and attaches user info to request
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Extract and verify token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication token',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Rate limiting middleware
 * Limits requests per user to prevent abuse
 *
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 */
const rateLimit = (maxRequests = 100, windowMs = 3600000) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return next(); // Skip if no user (will be caught by auth middleware)
      }

      const db = admin.firestore();
      const now = Date.now();
      const windowStart = now - windowMs;

      // Rate limit document path
      const rateLimitRef = db.collection('rateLimits').doc(userId);
      const rateLimitDoc = await rateLimitRef.get();

      let requests = [];

      if (rateLimitDoc.exists) {
        requests = rateLimitDoc.data().requests || [];
        // Filter out old requests outside the window
        requests = requests.filter((timestamp) => timestamp > windowStart);
      }

      // Check if limit exceeded
      if (requests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Maximum ${maxRequests} requests per hour.`,
            retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000),
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Add current request
      requests.push(now);

      // Update rate limit document
      await rateLimitRef.set({
        requests,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // Don't block request on rate limit errors
      next();
    }
  };
};

/**
 * Subscription check middleware
 * Verifies user has active subscription or trial sessions remaining
 */
const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return next(); // Will be caught by auth middleware
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const userData = userDoc.data();
    const subscriptionStatus = userData.subscriptionStatus || 'trial';
    const trialSessionsUsed = userData.trialSessionsUsed || 0;
    const trialSessionsTotal = userData.trialSessionsTotal || 3;

    // Check if user has access
    if (subscriptionStatus === 'active') {
      // Active subscription - allow access
      req.subscriptionStatus = 'active';
      next();
    } else if (subscriptionStatus === 'trial') {
      // Trial user - check remaining sessions
      if (trialSessionsUsed < trialSessionsTotal) {
        req.subscriptionStatus = 'trial';
        req.trialSessionsRemaining = trialSessionsTotal - trialSessionsUsed;
        next();
      } else {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TRIAL_EXPIRED',
            message: 'Trial sessions exhausted. Please subscribe to continue.',
          },
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // Inactive subscription
      return res.status(403).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'Active subscription required to access this feature.',
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify subscription status',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Error handler middleware
 * Catches and formats errors consistently
 */
const errorHandler = (error, req, res, next) => {
  console.error('Unhandled error:', error);

  const statusCode = error.statusCode || 500;
  const errorCode = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'An unexpected error occurred';

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Success response helper
 */
const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error response helper
 */
const sendError = (res, code, message, statusCode = 400, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  withCORS,
  authenticateUser,
  rateLimit,
  checkSubscription,
  errorHandler,
  sendSuccess,
  sendError,
};
