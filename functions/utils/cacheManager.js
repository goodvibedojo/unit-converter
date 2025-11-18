/**
 * Cache Manager
 * Handles caching of code execution results to reduce API calls and improve performance
 */

const crypto = require('crypto');
const admin = require('firebase-admin');

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.maxMemoryCacheSize = 1000; // Store up to 1000 results in memory
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
  }

  /**
   * Generate cache key from code and language
   * @param {string} code - Source code
   * @param {string} language - Programming language
   * @param {string} stdin - Standard input
   * @returns {string} Cache key (SHA256 hash)
   */
  generateCacheKey(code, language, stdin = '') {
    const content = `${language}:${code}:${stdin}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cached execution result from memory
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} Cached result or null
   */
  getFromMemory(cacheKey) {
    if (this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey);

      // Check if cache is still valid (1 hour TTL)
      const now = Date.now();
      if (now - cached.timestamp < 60 * 60 * 1000) {
        this.cacheHitCount++;
        console.log('[Cache] Memory hit:', {
          key: cacheKey.substring(0, 8),
          hitRate: this.getHitRate(),
        });
        return cached.result;
      }

      // Expired, remove from cache
      this.memoryCache.delete(cacheKey);
    }

    this.cacheMissCount++;
    return null;
  }

  /**
   * Store result in memory cache
   * @param {string} cacheKey - Cache key
   * @param {Object} result - Execution result
   */
  setInMemory(cacheKey, result) {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    console.log('[Cache] Memory set:', {
      key: cacheKey.substring(0, 8),
      size: this.memoryCache.size,
    });
  }

  /**
   * Get cached result from Firestore
   * @param {string} cacheKey - Cache key
   * @returns {Promise<Object|null>} Cached result or null
   */
  async getFromFirestore(cacheKey) {
    try {
      const db = admin.firestore();
      const cacheDoc = await db.collection('executionCache').doc(cacheKey).get();

      if (!cacheDoc.exists) {
        return null;
      }

      const data = cacheDoc.data();
      const now = Date.now();

      // Check TTL (24 hours for Firestore cache)
      if (now - data.timestamp > 24 * 60 * 60 * 1000) {
        // Expired, delete it
        await db.collection('executionCache').doc(cacheKey).delete();
        return null;
      }

      console.log('[Cache] Firestore hit:', {
        key: cacheKey.substring(0, 8),
        age: Math.round((now - data.timestamp) / 1000 / 60) + ' minutes',
      });

      // Also store in memory for faster subsequent access
      this.setInMemory(cacheKey, data.result);

      return data.result;
    } catch (error) {
      console.error('[Cache] Firestore get error:', error);
      return null;
    }
  }

  /**
   * Store result in Firestore
   * @param {string} cacheKey - Cache key
   * @param {Object} result - Execution result
   * @param {Object} metadata - Additional metadata
   */
  async setInFirestore(cacheKey, result, metadata = {}) {
    try {
      const db = admin.firestore();

      await db.collection('executionCache').doc(cacheKey).set({
        result,
        timestamp: Date.now(),
        language: metadata.language || 'unknown',
        codeLength: metadata.codeLength || 0,
        status: result.status || 'unknown',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('[Cache] Firestore set:', {
        key: cacheKey.substring(0, 8),
        language: metadata.language,
      });
    } catch (error) {
      console.error('[Cache] Firestore set error:', error);
      // Don't throw, caching is optional
    }
  }

  /**
   * Get cached execution result (checks memory first, then Firestore)
   * @param {string} code - Source code
   * @param {string} language - Programming language
   * @param {string} stdin - Standard input
   * @returns {Promise<Object|null>} Cached result or null
   */
  async getCachedExecution(code, language, stdin = '') {
    const cacheKey = this.generateCacheKey(code, language, stdin);

    // Try memory cache first (fastest)
    const memoryResult = this.getFromMemory(cacheKey);
    if (memoryResult) {
      return memoryResult;
    }

    // Try Firestore cache
    const firestoreResult = await this.getFromFirestore(cacheKey);
    if (firestoreResult) {
      return firestoreResult;
    }

    return null;
  }

  /**
   * Cache execution result (stores in both memory and Firestore)
   * @param {string} code - Source code
   * @param {string} language - Programming language
   * @param {string} stdin - Standard input
   * @param {Object} result - Execution result
   */
  async cacheExecution(code, language, stdin, result) {
    // Only cache successful executions
    if (!result.success) {
      return;
    }

    const cacheKey = this.generateCacheKey(code, language, stdin);

    // Store in memory (synchronous)
    this.setInMemory(cacheKey, result);

    // Store in Firestore (asynchronous, don't wait)
    this.setInFirestore(cacheKey, result, {
      language,
      codeLength: code.length,
    }).catch(err => {
      console.error('[Cache] Failed to cache in Firestore:', err);
    });
  }

  /**
   * Generate cache key for test cases
   * @param {string} code - Source code
   * @param {Array} testCases - Test cases
   * @param {string} language - Programming language
   * @returns {string} Cache key
   */
  generateTestCacheKey(code, testCases, language) {
    // Create deterministic representation of test cases
    const testInputs = testCases.map(tc => tc.input).join('|');
    const content = `${language}:${code}:${testInputs}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cached test results
   * @param {string} code - Source code
   * @param {Array} testCases - Test cases
   * @param {string} language - Programming language
   * @returns {Promise<Object|null>} Cached results or null
   */
  async getCachedTestResults(code, testCases, language) {
    const cacheKey = this.generateTestCacheKey(code, testCases, language);

    // Check memory first
    const memoryResult = this.getFromMemory(cacheKey);
    if (memoryResult) {
      return memoryResult;
    }

    // Check Firestore
    return await this.getFromFirestore(cacheKey);
  }

  /**
   * Cache test results
   * @param {string} code - Source code
   * @param {Array} testCases - Test cases
   * @param {string} language - Programming language
   * @param {Object} results - Test results
   */
  async cacheTestResults(code, testCases, language, results) {
    const cacheKey = this.generateTestCacheKey(code, testCases, language);

    // Store in memory
    this.setInMemory(cacheKey, results);

    // Store in Firestore
    this.setInFirestore(cacheKey, results, {
      language,
      codeLength: code.length,
      testCount: testCases.length,
    }).catch(err => {
      console.error('[Cache] Failed to cache test results in Firestore:', err);
    });
  }

  /**
   * Clear expired cache entries from Firestore (maintenance function)
   * @returns {Promise<number>} Number of entries deleted
   */
  async clearExpiredCache() {
    try {
      const db = admin.firestore();
      const now = Date.now();
      const expiryTime = now - (24 * 60 * 60 * 1000); // 24 hours

      const expiredDocs = await db.collection('executionCache')
        .where('timestamp', '<', expiryTime)
        .limit(500) // Delete in batches
        .get();

      if (expiredDocs.empty) {
        console.log('[Cache] No expired entries to clean');
        return 0;
      }

      const batch = db.batch();
      expiredDocs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log('[Cache] Cleaned expired entries:', expiredDocs.size);
      return expiredDocs.size;
    } catch (error) {
      console.error('[Cache] Error clearing expired cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    const total = this.cacheHitCount + this.cacheMissCount;
    const hitRate = total > 0 ? (this.cacheHitCount / total * 100).toFixed(2) : 0;

    return {
      memorySize: this.memoryCache.size,
      maxSize: this.maxMemoryCacheSize,
      hits: this.cacheHitCount,
      misses: this.cacheMissCount,
      hitRate: hitRate + '%',
      total,
    };
  }

  /**
   * Get cache hit rate
   * @returns {number} Hit rate percentage
   */
  getHitRate() {
    const total = this.cacheHitCount + this.cacheMissCount;
    return total > 0 ? ((this.cacheHitCount / total) * 100).toFixed(2) : 0;
  }

  /**
   * Clear all caches (memory only, use with caution)
   */
  clearMemoryCache() {
    this.memoryCache.clear();
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
    console.log('[Cache] Memory cache cleared');
  }
}

module.exports = new CacheManager();
