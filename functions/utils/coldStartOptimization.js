/**
 * Cold Start Optimization Utilities
 *
 * Techniques to reduce Cloud Functions cold start time
 */

const admin = require('firebase-admin');

/**
 * Global connection pool
 * Reuse connections across invocations
 */
const connectionPool = {
  firestore: null,
  auth: null,
  storage: null,
};

/**
 * Get Firestore instance (reused across invocations)
 */
function getFirestore() {
  if (!connectionPool.firestore) {
    connectionPool.firestore = admin.firestore();

    // Configure for better performance
    connectionPool.firestore.settings({
      ignoreUndefinedProperties: true,
    });
  }
  return connectionPool.firestore;
}

/**
 * Get Auth instance (reused across invocations)
 */
function getAuth() {
  if (!connectionPool.auth) {
    connectionPool.auth = admin.auth();
  }
  return connectionPool.auth;
}

/**
 * Get Storage instance (reused across invocations)
 */
function getStorage() {
  if (!connectionPool.storage) {
    connectionPool.storage = admin.storage();
  }
  return connectionPool.storage;
}

/**
 * Lazy-load heavy dependencies
 */
const lazyModules = {
  openai: null,
  stripe: null,
};

/**
 * Get OpenAI client (lazy loaded)
 */
function getOpenAI() {
  if (!lazyModules.openai) {
    const OpenAI = require('openai');
    lazyModules.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return lazyModules.openai;
}

/**
 * Get Stripe client (lazy loaded)
 */
function getStripe() {
  if (!lazyModules.stripe) {
    const Stripe = require('stripe');
    lazyModules.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return lazyModules.stripe;
}

/**
 * In-memory cache for frequently accessed data
 */
class ColdStartCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new ColdStartCache();

/**
 * Preload frequently accessed problems
 */
async function preloadPopularProblems() {
  if (cache.has('popular_problems')) {
    return cache.get('popular_problems');
  }

  const db = getFirestore();

  try {
    const snapshot = await db
      .collection('problems')
      .orderBy('stats.totalAttempts', 'desc')
      .limit(10)
      .get();

    const problems = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    cache.set('popular_problems', problems);
    return problems;
  } catch (error) {
    console.error('Error preloading problems:', error);
    return [];
  }
}

/**
 * Warm up function (call during initialization)
 */
async function warmUp() {
  // Initialize services
  getFirestore();
  getAuth();

  // Preload data
  await preloadPopularProblems();

  console.log('Cold start optimization: Warm-up completed');
}

/**
 * Minimize cold start by running initialization in parallel
 */
async function initializeInParallel() {
  await Promise.all([
    getFirestore(),
    getAuth(),
    preloadPopularProblems(),
  ]);
}

/**
 * Function to reduce code size
 * Tree-shake unused dependencies
 */
const minimalImports = {
  // Only import what's needed
  firestoreFieldValue: () => admin.firestore.FieldValue,
  firestoreTimestamp: () => admin.firestore.Timestamp,
};

/**
 * Optimize function memory usage
 */
function optimizeMemory() {
  // Set appropriate memory limits in firebase.json
  return {
    memory: '256MB', // Adjust based on function needs
    timeoutSeconds: 60,
    minInstances: 0, // Set to 1+ for hot functions
    maxInstances: 100,
  };
}

/**
 * Background function optimization
 * Use events instead of polling
 */
const optimizationTips = {
  useEventDriven: 'Use Firestore triggers instead of scheduled functions',
  minimizeDependencies: 'Only include necessary npm packages',
  reuseConnections: 'Reuse Firebase connections across invocations',
  lazuyLoadModules: 'Load heavy modules (OpenAI, Stripe) only when needed',
  cacheStaticData: 'Cache frequently accessed data in global scope',
  optimizeFirestoreQueries: 'Use indexes and limit result sets',
  useMinInstances: 'Set minInstances > 0 for frequently called functions',
  splitLargeFunctions: 'Break large functions into smaller, focused ones',
};

/**
 * Monitoring cold starts
 */
let coldStartMetrics = {
  coldStarts: 0,
  warmStarts: 0,
  lastStartType: null,
};

/**
 * Detect and log cold starts
 */
function detectColdStart() {
  const isColdStart = coldStartMetrics.lastStartType === null;

  if (isColdStart) {
    coldStartMetrics.coldStarts++;
    coldStartMetrics.lastStartType = 'cold';
    console.log('COLD START detected');
  } else {
    coldStartMetrics.warmStarts++;
    coldStartMetrics.lastStartType = 'warm';
  }

  return isColdStart;
}

/**
 * Get cold start metrics
 */
function getColdStartMetrics() {
  return {
    ...coldStartMetrics,
    coldStartRate:
      coldStartMetrics.coldStarts /
      (coldStartMetrics.coldStarts + coldStartMetrics.warmStarts),
  };
}

module.exports = {
  getFirestore,
  getAuth,
  getStorage,
  getOpenAI,
  getStripe,
  cache,
  preloadPopularProblems,
  warmUp,
  initializeInParallel,
  minimalImports,
  optimizeMemory,
  optimizationTips,
  detectColdStart,
  getColdStartMetrics,
};
