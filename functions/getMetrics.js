/**
 * Get Metrics Firebase Function
 * Provides access to performance metrics and statistics
 */

const functions = require('firebase-functions');
const performanceMonitor = require('./utils/performanceMonitor');
const cacheManager = require('./utils/cacheManager');

/**
 * Get current performance metrics
 * @param {Object} data - Request data
 * @param {Object} context - Firebase auth context
 * @returns {Promise<Object>} Performance metrics
 */
exports.getPerformanceMetrics = functions.https.onCall(async (data, context) => {
  try {
    // Authentication check - only for admin/authenticated users
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to view metrics'
      );
    }

    const userId = context.auth.uid;
    console.log('[getPerformanceMetrics] Request from user:', userId);

    // Get current in-memory metrics
    const currentMetrics = performanceMonitor.getMetrics();

    // Get historical metrics from Firestore
    const historicalMetrics = await performanceMonitor.getPerformanceStats({
      hours: data.hours || 24,
      userId: data.userId,
      language: data.language,
    });

    // Get cache statistics
    const cacheStats = cacheManager.getCacheStats();

    return {
      current: currentMetrics,
      historical: historicalMetrics,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[getPerformanceMetrics] Error:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to get performance metrics: ' + error.message
    );
  }
});

/**
 * Get performance report
 * @param {Object} data - Request data
 * @param {Object} context - Firebase auth context
 * @returns {Promise<Object>} Performance report
 */
exports.getPerformanceReport = functions.https.onCall(async (data, context) => {
  try {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const report = performanceMonitor.generateReport();

    return report;
  } catch (error) {
    console.error('[getPerformanceReport] Error:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate performance report: ' + error.message
    );
  }
});

/**
 * Clear expired cache entries (maintenance function)
 * @param {Object} data - Request data
 * @param {Object} context - Firebase auth context
 * @returns {Promise<Object>} Number of entries cleared
 */
exports.clearExpiredCache = functions.https.onCall(async (data, context) => {
  try {
    // Authentication check - admin only
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    // TODO: Add admin check here
    // const isAdmin = await checkIfAdmin(context.auth.uid);
    // if (!isAdmin) {
    //   throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    // }

    const deletedCount = await cacheManager.clearExpiredCache();

    console.log('[clearExpiredCache] Cleared entries:', deletedCount);

    return {
      deletedCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[clearExpiredCache] Error:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to clear cache: ' + error.message
    );
  }
});

/**
 * Scheduled function to clean expired cache daily
 */
exports.scheduledCacheClear = functions.pubsub
  .schedule('0 0 * * *') // Run daily at midnight
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    console.log('[scheduledCacheClear] Running daily cache cleanup');

    try {
      const deletedCount = await cacheManager.clearExpiredCache();

      console.log('[scheduledCacheClear] Deleted entries:', deletedCount);

      return null;
    } catch (error) {
      console.error('[scheduledCacheClear] Error:', error);
      return null;
    }
  });
