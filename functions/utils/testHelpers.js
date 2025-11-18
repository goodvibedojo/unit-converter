/**
 * Test Helpers and Fixtures
 *
 * Utilities for testing Cloud Functions
 */

const admin = require('firebase-admin');

/**
 * Create mock request object for testing
 *
 * @param {Object} data - Request data
 * @param {Object} auth - Auth context
 * @returns {Object} Mock request
 */
function createMockRequest(data = {}, auth = null) {
  return {
    data,
    auth: auth || {
      uid: 'test-user-id',
      email: 'test@example.com',
    },
    rawRequest: {
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    },
  };
}

/**
 * Create test user in Firestore
 *
 * @param {string} userId - User ID
 * @param {Object} overrides - Optional field overrides
 * @returns {Promise<Object>} User data
 */
async function createTestUser(userId = 'test-user', overrides = {}) {
  const db = admin.firestore();

  const userData = {
    uid: userId,
    email: `${userId}@test.com`,
    displayName: `Test User ${userId}`,
    subscriptionStatus: 'trial',
    trialSessionsUsed: 0,
    trialSessionsTotal: 3,
    stats: {
      totalSessions: 0,
      problemsSolved: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
    },
    preferences: {
      theme: 'light',
      defaultLanguage: 'python',
      voiceEnabled: false,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...overrides,
  };

  await db.collection('users').doc(userId).set(userData);

  return userData;
}

/**
 * Create test problem
 *
 * @param {string} problemId - Problem ID
 * @param {Object} overrides - Optional field overrides
 * @returns {Promise<Object>} Problem data
 */
async function createTestProblem(problemId = 'test-problem', overrides = {}) {
  const db = admin.firestore();

  const problemData = {
    id: problemId,
    title: 'Test Problem',
    slug: 'test-problem',
    difficulty: 'easy',
    category: ['array', 'test'],
    companyTags: ['test-company'],
    description: 'This is a test problem',
    constraints: ['1 <= n <= 100'],
    examples: [
      {
        input: 'nums = [1,2,3]',
        output: '6',
        explanation: 'Sum of array',
      },
    ],
    starterCode: {
      python: 'def solve(nums):\n    pass',
      javascript: 'function solve(nums) {\n    // code\n}',
      java: 'class Solution {\n    public int solve(int[] nums) {\n        return 0;\n    }\n}',
    },
    testCases: [
      {
        id: 'tc1',
        input: '[1,2,3]',
        expectedOutput: '6',
        isHidden: false,
        weight: 1,
      },
    ],
    hints: ['Think about iteration'],
    stats: {
      totalAttempts: 0,
      successRate: 0,
      averageTime: 0,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...overrides,
  };

  await db.collection('problems').doc(problemId).set(problemData);

  return problemData;
}

/**
 * Create test session
 *
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @param {string} problemId - Problem ID
 * @param {Object} overrides - Optional field overrides
 * @returns {Promise<Object>} Session data
 */
async function createTestSession(
  sessionId = 'test-session',
  userId = 'test-user',
  problemId = 'test-problem',
  overrides = {}
) {
  const db = admin.firestore();

  const sessionData = {
    id: sessionId,
    userId,
    problemId,
    language: 'python',
    startTime: admin.firestore.FieldValue.serverTimestamp(),
    endTime: null,
    duration: null,
    status: 'active',
    code: 'def solve(nums):\n    pass',
    codeHistory: [],
    chatHistory: [
      {
        role: 'ai',
        content: 'Welcome to the interview!',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      },
    ],
    testResults: {
      passed: 0,
      total: 1,
      details: [],
    },
    aiScore: null,
    aiFeedback: null,
    metadata: {
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    },
    ...overrides,
  };

  await db.collection('sessions').doc(sessionId).set(sessionData);

  return sessionData;
}

/**
 * Clean up test data
 *
 * @param {Array<string>} collections - Collections to clean
 * @returns {Promise<number>} Number of documents deleted
 */
async function cleanupTestData(collections = ['users', 'sessions', 'problems']) {
  const db = admin.firestore();
  let deletedCount = 0;

  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      // Only delete test data
      if (doc.id.startsWith('test-') || doc.data().email?.includes('@test.com')) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    await batch.commit();
  }

  return deletedCount;
}

/**
 * Assert response format
 *
 * @param {Object} response - Response object
 * @param {boolean} expectedSuccess - Expected success value
 */
function assertResponseFormat(response, expectedSuccess = true) {
  if (!response.success === expectedSuccess) {
    throw new Error(
      `Expected success to be ${expectedSuccess}, got ${response.success}`
    );
  }

  if (!response.timestamp) {
    throw new Error('Response missing timestamp');
  }

  if (expectedSuccess && !response.data) {
    throw new Error('Success response missing data');
  }

  if (!expectedSuccess && !response.error) {
    throw new Error('Error response missing error object');
  }
}

/**
 * Wait for async operations
 *
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random test data
 */
const testDataGenerators = {
  email: (prefix = 'test') => `${prefix}-${Date.now()}@test.com`,

  userId: (prefix = 'user') => `${prefix}-${Date.now()}`,

  sessionId: (prefix = 'session') => `${prefix}-${Date.now()}`,

  problemId: (prefix = 'problem') => `${prefix}-${Date.now()}`,

  code: (language = 'python') => {
    const templates = {
      python: 'def solution():\n    pass',
      javascript: 'function solution() {\n    // code\n}',
      java: 'class Solution {\n    public void solution() {\n        // code\n    }\n}',
    };
    return templates[language] || templates.python;
  },

  testCase: (input = '[]', output = '[]') => ({
    id: `tc-${Date.now()}`,
    input,
    expectedOutput: output,
    isHidden: false,
    weight: 1,
  }),
};

/**
 * Mock Firebase Functions context
 */
function createMockContext(userId = 'test-user') {
  return {
    auth: {
      uid: userId,
      email: `${userId}@test.com`,
      token: {
        firebase: {
          sign_in_provider: 'password',
        },
      },
    },
    instanceIdToken: undefined,
    rawRequest: {
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
        authorization: 'Bearer test-token',
      },
    },
  };
}

/**
 * Test fixtures
 */
const fixtures = {
  user: {
    trial: {
      subscriptionStatus: 'trial',
      trialSessionsUsed: 0,
      trialSessionsTotal: 3,
    },
    active: {
      subscriptionStatus: 'active',
      trialSessionsUsed: 3,
      trialSessionsTotal: 3,
    },
    inactive: {
      subscriptionStatus: 'inactive',
      trialSessionsUsed: 3,
      trialSessionsTotal: 3,
    },
  },

  problem: {
    easy: {
      difficulty: 'easy',
      category: ['array'],
    },
    medium: {
      difficulty: 'medium',
      category: ['tree', 'graph'],
    },
    hard: {
      difficulty: 'hard',
      category: ['dynamic-programming'],
    },
  },

  session: {
    active: {
      status: 'active',
      endTime: null,
    },
    completed: {
      status: 'completed',
      endTime: admin.firestore.Timestamp.now(),
      aiScore: 85,
    },
  },
};

module.exports = {
  createMockRequest,
  createTestUser,
  createTestProblem,
  createTestSession,
  cleanupTestData,
  assertResponseFormat,
  wait,
  testDataGenerators,
  createMockContext,
  fixtures,
};
