// Performance Monitoring Utilities
// Engineer 5 - Performance Optimization

import { useEffect, useRef, useState, lazy } from 'react';

/**
 * Monitor component render performance
 * Logs warnings when renders exceed threshold
 */
export function usePerformanceMonitor(componentName, options = {}) {
  const {
    trackRenders = true,
    warnThreshold = 100, // milliseconds
    logToConsole = process.env.NODE_ENV === 'development'
  } = options;

  const renderCount = useRef(0);
  const renderTimes = useRef([]);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    if (!trackRenders) return;

    renderCount.current += 1;
    const now = Date.now();
    const renderTime = now - lastRenderTime.current;
    lastRenderTime.current = now;

    renderTimes.current.push(renderTime);
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift(); // Keep last 10 renders
    }

    // Warn if render time exceeds threshold
    if (renderTime > warnThreshold && logToConsole) {
      console.warn(
        `⚠️ Slow render detected in ${componentName}:`,
        `${renderTime}ms (threshold: ${warnThreshold}ms)`
      );
    }

    // Log stats every 50 renders
    if (renderCount.current % 50 === 0 && logToConsole) {
      const avgRenderTime =
        renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      console.log(
        `📊 ${componentName} Performance:`,
        `Renders: ${renderCount.current},`,
        `Avg: ${avgRenderTime.toFixed(2)}ms,`,
        `Last: ${renderTime}ms`
      );
    }
  });

  return {
    renderCount: renderCount.current,
    avgRenderTime:
      renderTimes.current.length > 0
        ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
        : 0
  };
}

/**
 * Track component mount time
 */
export function useMountTime(componentName, logToConsole = process.env.NODE_ENV === 'development') {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const mountTime = performance.now() - startTime;
      if (logToConsole) {
        console.log(`🕒 ${componentName} mount time: ${mountTime.toFixed(2)}ms`);
      }
    };
  }, [componentName, logToConsole]);
}

/**
 * Measure async operation performance
 */
export async function measureAsync(operationName, asyncFn, logToConsole = true) {
  const startTime = performance.now();

  try {
    const result = await asyncFn();
    const duration = performance.now() - startTime;

    if (logToConsole) {
      console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  } catch (error) {
    const duration = performance.now() - startTime;

    if (logToConsole) {
      console.error(`❌ ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
    }

    throw error;
  }
}

/**
 * Debounce function to limit execution rate
 */
export function debounce(func, wait = 300) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle(func, limit = 300) {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Hook to track page load performance
 */
export function usePageLoadTime(pageName) {
  const [loadTime, setLoadTime] = useState(null);

  useEffect(() => {
    // Wait for page to be fully loaded
    if (document.readyState === 'complete') {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        const time = perfData.loadEventEnd - perfData.fetchStart;
        setLoadTime(time);
        console.log(`📄 ${pageName} load time: ${time.toFixed(2)}ms`);
      }
    } else {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          const time = perfData.loadEventEnd - perfData.fetchStart;
          setLoadTime(time);
          console.log(`📄 ${pageName} load time: ${time.toFixed(2)}ms`);
        }
      });
    }
  }, [pageName]);

  return loadTime;
}

/**
 * Hook to detect slow network
 */
export function useNetworkSpeed() {
  const [networkSpeed, setNetworkSpeed] = useState('unknown');

  useEffect(() => {
    const connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
      const updateSpeed = () => {
        const effectiveType = connection.effectiveType;
        setNetworkSpeed(effectiveType || 'unknown');

        // Log slow network warning
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          console.warn('⚠️ Slow network detected:', effectiveType);
        }
      };

      updateSpeed();
      connection.addEventListener('change', updateSpeed);

      return () => {
        connection.removeEventListener('change', updateSpeed);
      };
    }
  }, []);

  return networkSpeed;
}

/**
 * Memory usage monitoring (if available)
 */
export function useMemoryMonitor(componentName, interval = 10000) {
  useEffect(() => {
    if (!performance.memory) {
      console.log('Memory monitoring not available in this browser');
      return;
    }

    const logMemory = () => {
      const memory = performance.memory;
      const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
      const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);

      console.log(
        `💾 ${componentName} Memory:`,
        `Used: ${usedMB}MB,`,
        `Total: ${totalMB}MB,`,
        `Limit: ${limitMB}MB`
      );

      // Warn if memory usage is high
      if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9) {
        console.warn(`⚠️ High memory usage detected in ${componentName}!`);
      }
    };

    const intervalId = setInterval(logMemory, interval);
    return () => clearInterval(intervalId);
  }, [componentName, interval]);
}

/**
 * Bundle size analyzer
 * Reports component bundle contribution
 */
export function reportBundleSize(componentName, sizeKB) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📦 ${componentName} bundle size: ${sizeKB}KB`);

    if (sizeKB > 100) {
      console.warn(`⚠️ Large bundle detected in ${componentName}: ${sizeKB}KB`);
    }
  }
}

/**
 * Lazy load component with loading boundary
 */
export function lazyLoadComponent(importFn, options = {}) {
  const { fallback = null, onError = null } = options;

  return {
    Component: lazy(importFn),
    fallback,
    onError
  };
}

/**
 * Performance observer for long tasks
 */
export function observeLongTasks(callback) {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // Long task threshold
            console.warn('⚠️ Long task detected:', {
              name: entry.name,
              duration: `${entry.duration.toFixed(2)}ms`,
              startTime: entry.startTime
            });

            if (callback) {
              callback(entry);
            }
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });

      return () => observer.disconnect();
    } catch (e) {
      console.log('Long task monitoring not supported');
    }
  }

  return () => {};
}

/**
 * Get Web Vitals metrics
 */
export async function getWebVitals() {
  try {
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');

    const vitals = {};

    getCLS((metric) => {
      vitals.CLS = metric.value;
      console.log('📊 CLS (Cumulative Layout Shift):', metric.value);
    });

    getFID((metric) => {
      vitals.FID = metric.value;
      console.log('📊 FID (First Input Delay):', metric.value, 'ms');
    });

    getFCP((metric) => {
      vitals.FCP = metric.value;
      console.log('📊 FCP (First Contentful Paint):', metric.value, 'ms');
    });

    getLCP((metric) => {
      vitals.LCP = metric.value;
      console.log('📊 LCP (Largest Contentful Paint):', metric.value, 'ms');
    });

    getTTFB((metric) => {
      vitals.TTFB = metric.value;
      console.log('📊 TTFB (Time to First Byte):', metric.value, 'ms');
    });

    return vitals;
  } catch (error) {
    console.log('Web Vitals not available:', error);
    return null;
  }
}

/**
 * Image loading optimization
 */
export function useImagePreload(imageSources = []) {
  const [loadedImages, setLoadedImages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (imageSources.length === 0) {
      setIsLoading(false);
      return;
    }

    let loaded = 0;

    imageSources.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loaded += 1;
        setLoadedImages(loaded);

        if (loaded === imageSources.length) {
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        console.error(`Failed to preload image: ${src}`);
        loaded += 1;
        setLoadedImages(loaded);

        if (loaded === imageSources.length) {
          setIsLoading(false);
        }
      };
    });
  }, [imageSources]);

  return { loadedImages, totalImages: imageSources.length, isLoading };
}

/**
 * Cache manager for expensive computations
 */
export class ComputationCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    return this.cache.get(JSON.stringify(key));
  }

  set(key, value) {
    const stringKey = JSON.stringify(key);

    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(stringKey, value);
  }

  has(key) {
    return this.cache.has(JSON.stringify(key));
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

export default {
  usePerformanceMonitor,
  useMountTime,
  measureAsync,
  debounce,
  throttle,
  usePageLoadTime,
  useNetworkSpeed,
  useMemoryMonitor,
  reportBundleSize,
  observeLongTasks,
  getWebVitals,
  useImagePreload,
  ComputationCache
};
