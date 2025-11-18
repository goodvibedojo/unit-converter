/**
 * Monitoring and Logging Utilities
 *
 * Provides structured logging and performance monitoring
 */

const functions = require('firebase-functions');

/**
 * Log levels
 */
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

/**
 * Structured logger
 */
class Logger {
  constructor(functionName) {
    this.functionName = functionName;
    this.startTime = Date.now();
  }

  /**
   * Log message with context
   */
  log(level, message, data = {}) {
    const logEntry = {
      level,
      function: this.functionName,
      message,
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - this.startTime,
      ...data,
    };

    const logString = JSON.stringify(logEntry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(logString);
        }
        break;
      default:
        console.log(logString);
    }
  }

  debug(message, data) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message, data) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message, data) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message, error, data = {}) {
    this.log(LogLevel.ERROR, message, {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
      ...data,
    });
  }

  /**
   * Log function execution time
   */
  logExecutionTime(additionalData = {}) {
    const executionTime = Date.now() - this.startTime;
    this.info('Function execution completed', {
      executionTimeMs: executionTime,
      ...additionalData,
    });
    return executionTime;
  }
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  constructor(functionName) {
    this.functionName = functionName;
    this.marks = new Map();
    this.measures = [];
    this.startTime = Date.now();
  }

  /**
   * Mark a point in time
   */
  mark(name) {
    this.marks.set(name, Date.now());
  }

  /**
   * Measure time between two marks
   */
  measure(name, startMark, endMark) {
    const startTime = this.marks.get(startMark);
    const endTime = this.marks.get(endMark);

    if (!startTime || !endTime) {
      console.warn(`Missing marks for measure: ${name}`);
      return null;
    }

    const duration = endTime - startTime;
    this.measures.push({
      name,
      duration,
      startMark,
      endMark,
    });

    return duration;
  }

  /**
   * Get all measurements
   */
  getMeasures() {
    return {
      function: this.functionName,
      totalDuration: Date.now() - this.startTime,
      measures: this.measures,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Log performance metrics
   */
  logMetrics() {
    const metrics = this.getMeasures();
    console.log(JSON.stringify({
      type: 'PERFORMANCE_METRICS',
      ...metrics,
    }));
    return metrics;
  }
}

/**
 * Error tracking
 */
class ErrorTracker {
  constructor(functionName) {
    this.functionName = functionName;
    this.errors = [];
  }

  /**
   * Track an error
   */
  track(error, context = {}) {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      context,
      timestamp: new Date().toISOString(),
    };

    this.errors.push(errorEntry);

    // Log to console
    console.error(JSON.stringify({
      type: 'ERROR_TRACKED',
      function: this.functionName,
      ...errorEntry,
    }));

    // In production, send to error tracking service
    // (e.g., Sentry, Firebase Crashlytics)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service
      // Sentry.captureException(error, { contexts: { custom: context } });
    }
  }

  /**
   * Get all tracked errors
   */
  getErrors() {
    return {
      function: this.functionName,
      errorCount: this.errors.length,
      errors: this.errors,
    };
  }
}

/**
 * Metrics aggregator
 */
class MetricsAggregator {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
  }

  /**
   * Increment a counter
   */
  incrementCounter(name, value = 1, tags = {}) {
    const key = this.getKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set a gauge value
   */
  setGauge(name, value, tags = {}) {
    const key = this.getKey(name, tags);
    this.gauges.set(key, value);
  }

  /**
   * Record histogram value
   */
  recordHistogram(name, value, tags = {}) {
    const key = this.getKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  /**
   * Get key with tags
   */
  getKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return tagString ? `${name}[${tagString}]` : name;
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          {
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            p50: this.percentile(values, 0.5),
            p95: this.percentile(values, 0.95),
            p99: this.percentile(values, 0.99),
          },
        ])
      ),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate percentile
   */
  percentile(values, p) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Log metrics
   */
  logMetrics() {
    const metrics = this.getMetrics();
    console.log(JSON.stringify({
      type: 'METRICS',
      ...metrics,
    }));
    return metrics;
  }
}

/**
 * Health check utilities
 */
class HealthChecker {
  constructor() {
    this.checks = new Map();
  }

  /**
   * Register a health check
   */
  register(name, checkFn) {
    this.checks.set(name, checkFn);
  }

  /**
   * Run all health checks
   */
  async runChecks() {
    const results = {};
    let allHealthy = true;

    for (const [name, checkFn] of this.checks) {
      try {
        const startTime = Date.now();
        await checkFn();
        results[name] = {
          status: 'healthy',
          responseTime: Date.now() - startTime,
        };
      } catch (error) {
        allHealthy = false;
        results[name] = {
          status: 'unhealthy',
          error: error.message,
        };
      }
    }

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks: results,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Rate limiter for logging
 */
class LogRateLimiter {
  constructor(maxLogsPerMinute = 100) {
    this.maxLogsPerMinute = maxLogsPerMinute;
    this.logs = [];
  }

  /**
   * Check if logging is allowed
   */
  shouldLog() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old logs
    this.logs = this.logs.filter((timestamp) => timestamp > oneMinuteAgo);

    // Check limit
    if (this.logs.length >= this.maxLogsPerMinute) {
      return false;
    }

    this.logs.push(now);
    return true;
  }
}

/**
 * Create logger for a function
 */
function createLogger(functionName) {
  return new Logger(functionName);
}

/**
 * Create performance monitor for a function
 */
function createPerformanceMonitor(functionName) {
  return new PerformanceMonitor(functionName);
}

/**
 * Create error tracker for a function
 */
function createErrorTracker(functionName) {
  return new ErrorTracker(functionName);
}

/**
 * Global metrics aggregator
 */
const globalMetrics = new MetricsAggregator();

/**
 * Global health checker
 */
const globalHealthChecker = new HealthChecker();

/**
 * Monitoring middleware for Cloud Functions
 */
function withMonitoring(functionName, handler) {
  return async (data, context) => {
    const logger = createLogger(functionName);
    const perfMonitor = createPerformanceMonitor(functionName);
    const errorTracker = createErrorTracker(functionName);

    logger.info('Function invocation started', {
      userId: context.auth?.uid,
      data: process.env.NODE_ENV === 'development' ? data : undefined,
    });

    perfMonitor.mark('start');

    try {
      const result = await handler(data, context);

      perfMonitor.mark('end');
      perfMonitor.measure('total', 'start', 'end');

      const executionTime = perfMonitor.getMeasures().totalDuration;

      logger.info('Function invocation completed', {
        executionTime,
        success: true,
      });

      globalMetrics.incrementCounter('function_invocations', 1, {
        function: functionName,
        status: 'success',
      });

      globalMetrics.recordHistogram('function_execution_time', executionTime, {
        function: functionName,
      });

      return result;
    } catch (error) {
      perfMonitor.mark('error');
      perfMonitor.measure('error', 'start', 'error');

      logger.error('Function invocation failed', error, {
        userId: context.auth?.uid,
      });

      errorTracker.track(error, {
        userId: context.auth?.uid,
        data,
      });

      globalMetrics.incrementCounter('function_invocations', 1, {
        function: functionName,
        status: 'error',
      });

      throw error;
    }
  };
}

module.exports = {
  Logger,
  PerformanceMonitor,
  ErrorTracker,
  MetricsAggregator,
  HealthChecker,
  LogRateLimiter,
  createLogger,
  createPerformanceMonitor,
  createErrorTracker,
  globalMetrics,
  globalHealthChecker,
  withMonitoring,
  LogLevel,
};
