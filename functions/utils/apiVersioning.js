/**
 * API Versioning Utilities
 *
 * Provides versioning support for Cloud Functions APIs
 */

const functions = require('firebase-functions');

/**
 * API versions registry
 */
const apiVersions = new Map();

/**
 * Register API version
 *
 * @param {string} version - Version identifier (e.g., 'v1', 'v2')
 * @param {Object} handlers - Version-specific handlers
 */
function registerVersion(version, handlers) {
  if (apiVersions.has(version)) {
    throw new Error(`API version ${version} already registered`);
  }

  apiVersions.set(version, {
    handlers,
    registeredAt: new Date().toISOString(),
  });

  console.log(`Registered API version: ${version}`);
}

/**
 * Get handler for specific version
 *
 * @param {string} version - Version identifier
 * @param {string} handlerName - Handler name
 * @returns {Function} Handler function
 */
function getVersionedHandler(version, handlerName) {
  const versionData = apiVersions.get(version);

  if (!versionData) {
    throw new Error(`API version ${version} not found`);
  }

  const handler = versionData.handlers[handlerName];

  if (!handler) {
    throw new Error(`Handler ${handlerName} not found in version ${version}`);
  }

  return handler;
}

/**
 * Versioned function wrapper
 *
 * @param {string} functionName - Base function name
 * @param {Object} versionHandlers - Handlers for each version
 * @returns {Object} Versioned functions
 */
function createVersionedFunction(functionName, versionHandlers) {
  const versionedFunctions = {};

  for (const [version, handler] of Object.entries(versionHandlers)) {
    const versionedName = `${functionName}_${version}`;

    versionedFunctions[version] = functions.https.onCall(async (data, context) => {
      try {
        return await handler(data, context);
      } catch (error) {
        console.error(`Error in ${versionedName}:`, error);
        throw error;
      }
    });
  }

  return versionedFunctions;
}

/**
 * API version middleware
 * Extracts version from request and routes to correct handler
 */
function withVersioning(handlers) {
  return functions.https.onCall(async (data, context) => {
    // Get version from data or default to latest
    const requestedVersion = data._version || 'v1';
    const latestVersion = getLatestVersion();

    // Check if requested version exists
    const version = apiVersions.has(requestedVersion)
      ? requestedVersion
      : latestVersion;

    if (requestedVersion !== latestVersion) {
      console.warn(
        `Client requested version ${requestedVersion}, using ${version}`
      );
    }

    // Get handler for version
    const handler = handlers[version];

    if (!handler) {
      throw new functions.https.HttpsError(
        'not-found',
        `No handler found for version ${version}`
      );
    }

    // Remove version from data before passing to handler
    const cleanData = { ...data };
    delete cleanData._version;

    // Call versioned handler
    return await handler(cleanData, context);
  });
}

/**
 * Get latest version
 */
function getLatestVersion() {
  const versions = Array.from(apiVersions.keys());
  if (versions.length === 0) {
    return 'v1';
  }

  // Sort versions (v1, v2, v3, etc.)
  const sorted = versions.sort((a, b) => {
    const aNum = parseInt(a.replace('v', ''));
    const bNum = parseInt(b.replace('v', ''));
    return bNum - aNum;
  });

  return sorted[0];
}

/**
 * Version deprecation middleware
 */
function deprecateVersion(version, deprecationDate, message) {
  return (handler) => {
    return async (data, context) => {
      const now = new Date();
      const sunset = new Date(deprecationDate);

      if (now > sunset) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `API version ${version} has been deprecated. ${message}`
        );
      }

      // Add deprecation warning to response
      const result = await handler(data, context);

      return {
        ...result,
        _deprecation: {
          version,
          sunsetDate: deprecationDate,
          message,
          daysRemaining: Math.ceil((sunset - now) / (1000 * 60 * 60 * 24)),
        },
      };
    };
  };
}

/**
 * Version compatibility layer
 * Transforms requests/responses between versions
 */
class VersionAdapter {
  constructor() {
    this.transformers = new Map();
  }

  /**
   * Register request transformer
   */
  registerRequestTransformer(fromVersion, toVersion, transformer) {
    const key = `${fromVersion}->${toVersion}`;
    this.transformers.set(`request-${key}`, transformer);
  }

  /**
   * Register response transformer
   */
  registerResponseTransformer(fromVersion, toVersion, transformer) {
    const key = `${fromVersion}->${toVersion}`;
    this.transformers.set(`response-${key}`, transformer);
  }

  /**
   * Transform request
   */
  transformRequest(data, fromVersion, toVersion) {
    const key = `request-${fromVersion}->${toVersion}`;
    const transformer = this.transformers.get(key);

    if (!transformer) {
      return data; // No transformation needed
    }

    return transformer(data);
  }

  /**
   * Transform response
   */
  transformResponse(result, fromVersion, toVersion) {
    const key = `response-${fromVersion}->${toVersion}`;
    const transformer = this.transformers.get(key);

    if (!transformer) {
      return result; // No transformation needed
    }

    return transformer(result);
  }
}

const globalAdapter = new VersionAdapter();

/**
 * Example: Versioned startSession function
 */
const startSessionVersions = {
  v1: async (data, context) => {
    // Original v1 implementation
    return {
      sessionId: 'session-1',
      problem: {
        id: 'problem-1',
        title: 'Two Sum',
      },
    };
  },

  v2: async (data, context) => {
    // v2 with additional fields
    return {
      sessionId: 'session-1',
      problem: {
        id: 'problem-1',
        title: 'Two Sum',
        difficulty: 'easy', // New in v2
        estimatedTime: 30, // New in v2
      },
      trialInfo: {
        // New in v2
        sessionsRemaining: 2,
      },
    };
  },
};

/**
 * Register transformers for backward compatibility
 */
globalAdapter.registerResponseTransformer('v2', 'v1', (response) => {
  // Transform v2 response to v1 format
  const { problem, trialInfo, ...rest } = response;

  return {
    ...rest,
    problem: {
      id: problem.id,
      title: problem.title,
      // Remove v2-only fields
    },
    // Remove trialInfo for v1 clients
  };
});

/**
 * API changelog tracker
 */
const changelog = [];

/**
 * Add changelog entry
 */
function addChangelogEntry(version, changes) {
  changelog.push({
    version,
    changes,
    date: new Date().toISOString(),
  });
}

/**
 * Get API changelog
 */
function getChangelog() {
  return changelog.sort((a, b) => {
    const aNum = parseInt(a.version.replace('v', ''));
    const bNum = parseInt(b.version.replace('v', ''));
    return bNum - aNum;
  });
}

/**
 * Document API changes
 */
addChangelogEntry('v1', [
  { type: 'initial', description: 'Initial API release' },
]);

addChangelogEntry('v2', [
  {
    type: 'added',
    endpoint: 'startSession',
    description: 'Added difficulty and estimatedTime to problem response',
  },
  {
    type: 'added',
    endpoint: 'startSession',
    description: 'Added trialInfo to response',
  },
]);

/**
 * Version negotiation
 * Client sends supported versions, server responds with best match
 */
function negotiateVersion(clientVersions) {
  const serverVersions = Array.from(apiVersions.keys());

  // Find best matching version (highest common version)
  const commonVersions = clientVersions.filter((v) => serverVersions.includes(v));

  if (commonVersions.length === 0) {
    // Fallback to lowest server version
    return serverVersions.sort()[0] || 'v1';
  }

  // Return highest common version
  return commonVersions.sort((a, b) => {
    const aNum = parseInt(a.replace('v', ''));
    const bNum = parseInt(b.replace('v', ''));
    return bNum - aNum;
  })[0];
}

/**
 * API version info endpoint
 */
function getVersionInfo() {
  const versions = Array.from(apiVersions.keys());
  const latest = getLatestVersion();

  return {
    versions,
    latest,
    deprecated: [], // TODO: Track deprecated versions
    changelog: getChangelog(),
  };
}

module.exports = {
  registerVersion,
  getVersionedHandler,
  createVersionedFunction,
  withVersioning,
  getLatestVersion,
  deprecateVersion,
  VersionAdapter,
  globalAdapter,
  addChangelogEntry,
  getChangelog,
  negotiateVersion,
  getVersionInfo,
  startSessionVersions, // Example
};
