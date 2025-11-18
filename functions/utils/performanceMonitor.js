/**
 * Performance Monitor
 * Tracks and analyzes performance metrics for code execution service
 */

const admin = require('firebase-admin');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      executions: {
        total: 0,
        successful: 0,
        failed: 0,
      },
      latency: {
        total: 0,
        count: 0,
        min: Infinity,
        max: 0,
      },
      cache: {
        hits: 0,
        misses: 0,
      },
    };
  }

  /**
   * Record execution metric
   * @param {Object} data - Execution data
   * @param {boolean} data.success - Whether execution was successful
   * @param {number} data.executionTime - Execution time in ms
   * @param {boolean} data.cached - Whether result was cached
   * @param {string} data.language - Programming language
   * @param {string} data.userId - User ID
   */
  recordExecution(data) {
    const {success, executionTime, cached = false, language, userId} = data;

    // Update execution counts
    this.metrics.executions.total++;
    if (success) {
      this.metrics.executions.successful++;
    } else {
      this.metrics.executions.failed++;
    }

    // Update latency metrics (only for non-cached)
    if (!cached && executionTime) {
      this.metrics.latency.total += executionTime;
      this.metrics.latency.count++;
      this.metrics.latency.min = Math.min(this.metrics.latency.min, executionTime);
      this.metrics.latency.max = Math.max(this.metrics.latency.max, executionTime);
    }

    // Update cache metrics
    if (cached) {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }

    // Log to Firestore for persistent analytics
    this.logToFirestore({
      success,
      executionTime,
      cached,
      language,
      userId,
      timestamp: Date.now(),
    }).catch(err => {
      console.error('[PerfMonitor] Error logging to Firestore:', err);
    });
  }

  /**
   * Record test run metric
   * @param {Object} data - Test run data
   * @param {number} data.testCount - Number of tests
   * @param {number} data.passed - Number of passed tests
   * @param {number} data.totalTime - Total execution time
   * @param {boolean} data.cached - Whether result was cached
   * @param {string} data.language - Programming language
   * @param {string} data.userId - User ID
   */
  recordTestRun(data) {
    const {testCount, passed, totalTime, cached = false, language, userId} = data;

    // Log test run metrics
    this.logTestRunToFirestore({
      testCount,
      passed,
      score: (passed / testCount) * 100,
      totalTime,
      cached,
      language,
      userId,
      timestamp: Date.now(),
    }).catch(err => {
      console.error('[PerfMonitor] Error logging test run:', err);
    });
  }

  /**
   * Record cache operation
   * @param {string} operation - 'hit' or 'miss'
   * @param {string} type - 'execution' or 'testRun'
   */
  recordCacheOperation(operation, type = 'execution') {
    if (operation === 'hit') {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }

    console.log('[PerfMonitor] Cache operation:', {
      operation,
      type,
      hitRate: this.getCacheHitRate(),
    });
  }

  /**
   * Get current metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    const avgLatency = this.metrics.latency.count > 0
      ? this.metrics.latency.total / this.metrics.latency.count
      : 0;

    const successRate = this.metrics.executions.total > 0
      ? (this.metrics.executions.successful / this.metrics.executions.total) * 100
      : 0;

    const cacheHitRate = this.getCacheHitRate();

    return {
      executions: this.metrics.executions,
      latency: {
        average: Math.round(avgLatency),
        min: this.metrics.latency.min === Infinity ? 0 : this.metrics.latency.min,
        max: this.metrics.latency.max,
      },
      cache: {
        hits: this.metrics.cache.hits,
        misses: this.metrics.cache.misses,
        hitRate: cacheHitRate + '%',
      },
      successRate: successRate.toFixed(2) + '%',
    };
  }

  /**
   * Get cache hit rate percentage
   * @returns {number} Hit rate percentage
   */
  getCacheHitRate() {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    return total > 0 ? ((this.metrics.cache.hits / total) * 100).toFixed(2) : 0;
  }

  /**
   * Log execution to Firestore for persistent analytics
   * @param {Object} data - Execution data
   * @returns {Promise<void>}
   */
  async logToFirestore(data) {
    try {
      const db = admin.firestore();

      await db.collection('performanceMetrics').add({
        type: 'execution',
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      // Don't throw, metrics logging is non-critical
      console.error('[PerfMonitor] Firestore log error:', error);
    }
  }

  /**
   * Log test run to Firestore
   * @param {Object} data - Test run data
   * @returns {Promise<void>}
   */
  async logTestRunToFirestore(data) {
    try {
      const db = admin.firestore();

      await db.collection('performanceMetrics').add({
        type: 'testRun',
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('[PerfMonitor] Firestore log error:', error);
    }
  }

  /**
   * Get performance statistics from Firestore
   * @param {Object} options - Query options
   * @param {number} options.hours - Hours to look back (default: 24)
   * @param {string} options.userId - Filter by user ID (optional)
   * @param {string} options.language - Filter by language (optional)
   * @returns {Promise<Object>} Performance statistics
   */
  async getPerformanceStats(options = {}) {
    const {hours = 24, userId, language} = options;

    try {
      const db = admin.firestore();
      const since = Date.now() - (hours * 60 * 60 * 1000);

      let query = db.collection('performanceMetrics')
        .where('timestamp', '>=', since);

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      if (language) {
        query = query.where('language', '==', language);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        return {
          totalExecutions: 0,
          successful: 0,
          failed: 0,
          averageTime: 0,
          cacheHitRate: 0,
        };
      }

      let totalExecutions = 0;
      let successful = 0;
      let failed = 0;
      let totalTime = 0;
      let cacheHits = 0;
      let cacheMisses = 0;

      snapshot.forEach(doc => {
        const data = doc.data();

        if (data.type === 'execution') {
          totalExecutions++;
          if (data.success) {
            successful++;
          } else {
            failed++;
          }

          if (!data.cached) {
            totalTime += data.executionTime || 0;
          }

          if (data.cached) {
            cacheHits++;
          } else {
            cacheMisses++;
          }
        }
      });

      const averageTime = totalExecutions > 0 ? Math.round(totalTime / totalExecutions) : 0;
      const cacheTotal = cacheHits + cacheMisses;
      const cacheHitRate = cacheTotal > 0 ? ((cacheHits / cacheTotal) * 100).toFixed(2) : 0;

      return {
        period: `${hours} hours`,
        totalExecutions,
        successful,
        failed,
        successRate: totalExecutions > 0 ? ((successful / totalExecutions) * 100).toFixed(2) : 0,
        averageTime,
        cacheHitRate: cacheHitRate + '%',
        cacheHits,
        cacheMisses,
      };
    } catch (error) {
      console.error('[PerfMonitor] Error getting stats:', error);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Reset in-memory metrics
   */
  reset() {
    this.metrics = {
      executions: {
        total: 0,
        successful: 0,
        failed: 0,
      },
      latency: {
        total: 0,
        count: 0,
        min: Infinity,
        max: 0,
      },
      cache: {
        hits: 0,
        misses: 0,
      },
    };

    console.log('[PerfMonitor] Metrics reset');
  }

  /**
   * Generate performance report
   * @returns {Object} Formatted performance report
   */
  generateReport() {
    const metrics = this.getMetrics();

    return {
      summary: {
        totalExecutions: metrics.executions.total,
        successRate: metrics.successRate,
        cacheHitRate: metrics.cache.hitRate,
      },
      performance: {
        averageLatency: metrics.latency.average + 'ms',
        minLatency: metrics.latency.min + 'ms',
        maxLatency: metrics.latency.max + 'ms',
      },
      reliability: {
        successful: metrics.executions.successful,
        failed: metrics.executions.failed,
      },
      cache: {
        hits: metrics.cache.hits,
        misses: metrics.cache.misses,
        hitRate: metrics.cache.hitRate,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new PerformanceMonitor();
