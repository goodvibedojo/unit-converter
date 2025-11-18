/**
 * Run Test Cases Firebase Function
 * Executes code against multiple test cases and validates results
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const judge0Client = require('./utils/judge0Client');
const securityChecker = require('./utils/securityChecker');
const testValidator = require('./utils/testValidator');

/**
 * Run test cases against user code
 * @param {Object} data - Request data
 * @param {string} data.code - Source code to test
 * @param {string} data.language - Programming language
 * @param {Array} data.testCases - Array of test case objects
 * @param {string} data.sessionId - Interview session ID (optional)
 * @param {Object} context - Firebase auth context
 * @returns {Promise<Object>} Test results
 */
exports.runTestCases = functions.https.onCall(async (data, context) => {
  const startTime = Date.now();

  try {
    // 1. Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to run tests'
      );
    }

    const userId = context.auth.uid;
    console.log('[runTestCases] Request from user:', userId);

    // 2. Input validation
    const { code, language, testCases, sessionId } = data;

    if (!code || typeof code !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Code must be a non-empty string'
      );
    }

    if (!language || typeof language !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Language must be specified'
      );
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Test cases must be a non-empty array'
      );
    }

    // 3. Validate test cases
    const testCaseValidation = securityChecker.validateTestCases(testCases);
    if (!testCaseValidation.valid) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid test cases: ' + testCaseValidation.issues.map(i => i.message).join('; ')
      );
    }

    // 4. Security check on code
    const securityCheck = securityChecker.checkCode(code, language);
    if (!securityCheck.safe) {
      console.warn('[runTestCases] Security check failed:', securityCheck.issues);
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Code contains potentially dangerous operations: ' +
        securityCheck.issues.map(i => i.message).join('; ')
      );
    }

    // 5. Rate limiting (for test runs)
    const rateLimitOk = await checkTestRunRateLimit(userId);
    if (!rateLimitOk) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Test run rate limit exceeded. Please try again later.'
      );
    }

    console.log('[runTestCases] Running tests:', {
      language,
      testCount: testCases.length,
      codeLength: code.length,
    });

    // 6. Run each test case
    const results = [];
    let passed = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const testStartTime = Date.now();

      console.log(`[runTestCases] Running test ${i + 1}/${testCases.length}`);

      try {
        // Execute code with test input
        const execution = await judge0Client.executeCode({
          code,
          language,
          stdin: testCase.input || '',
        });

        const testExecutionTime = Date.now() - testStartTime;

        // Compare outputs
        const isPassed = execution.success &&
          testValidator.compareOutputs(
            execution.output,
            testCase.expectedOutput
          );

        if (isPassed) {
          passed++;
        }

        results.push({
          ...testCase,
          passed: isPassed,
          actualOutput: execution.output,
          error: execution.error,
          executionTime: testExecutionTime,
          cpuTime: execution.cpuTime,
          memory: execution.memory,
          status: execution.status,
        });
      } catch (error) {
        console.error(`[runTestCases] Test ${i + 1} failed:`, error);

        results.push({
          ...testCase,
          passed: false,
          actualOutput: '',
          error: error.message || 'Test execution failed',
          executionTime: Date.now() - testStartTime,
        });
      }
    }

    // 7. Calculate score and generate report
    const scoreInfo = testValidator.calculateScore(results);
    const report = testValidator.generateReport(results);
    const feedback = testValidator.getFeedback(scoreInfo.score);

    const totalTime = Date.now() - startTime;

    const response = {
      results,
      passed,
      total: testCases.length,
      score: scoreInfo.score,
      feedback,
      report,
      totalTime,
      executionStats: report.executionStats,
    };

    // 8. Save test results to session (if sessionId provided)
    if (sessionId) {
      await saveTestResults(userId, sessionId, response);
    }

    // 9. Log test run
    await logTestRun(userId, {
      language,
      testCount: testCases.length,
      passed,
      score: scoreInfo.score,
      totalTime,
    });

    console.log('[runTestCases] Tests completed:', {
      userId,
      passed,
      total: testCases.length,
      score: scoreInfo.score,
      totalTime,
    });

    return response;
  } catch (error) {
    console.error('[runTestCases] Error:', error);

    // Re-throw Firebase errors
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Wrap other errors
    throw new functions.https.HttpsError(
      'internal',
      'Test execution failed: ' + error.message
    );
  }
});

/**
 * Check rate limit for test runs
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if within rate limit
 */
async function checkTestRunRateLimit(userId) {
  const db = admin.firestore();
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const rateLimitDoc = db.collection('testRunRateLimits').doc(userId);

  try {
    const doc = await rateLimitDoc.get();

    if (!doc.exists) {
      await rateLimitDoc.set({
        testRuns: [now],
        lastReset: now,
      });
      return true;
    }

    const data = doc.data();
    let testRuns = data.testRuns || [];

    // Remove test runs older than 1 hour
    testRuns = testRuns.filter(time => time > oneHourAgo);

    // Check limit (less strict than single executions)
    const maxTestRuns = 50; // 50 test runs per hour

    if (testRuns.length >= maxTestRuns) {
      console.warn('[Rate Limit] User exceeded test run limit:', {
        userId,
        testRuns: testRuns.length,
        limit: maxTestRuns,
      });
      return false;
    }

    testRuns.push(now);
    await rateLimitDoc.update({
      testRuns,
      lastReset: now,
    });

    return true;
  } catch (error) {
    console.error('[Rate Limit] Error checking test run rate limit:', error);
    return true; // Fail open
  }
}

/**
 * Save test results to interview session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @param {Object} results - Test results
 * @returns {Promise<void>}
 */
async function saveTestResults(userId, sessionId, results) {
  const db = admin.firestore();

  try {
    const sessionRef = db.collection('sessions').doc(sessionId);
    const session = await sessionRef.get();

    if (!session.exists) {
      console.warn('[Save] Session not found:', sessionId);
      return;
    }

    // Verify session belongs to user
    if (session.data().userId !== userId) {
      console.warn('[Save] Session does not belong to user:', {
        sessionId,
        sessionUserId: session.data().userId,
        requestUserId: userId,
      });
      return;
    }

    // Update session with test results
    await sessionRef.update({
      testResults: {
        passed: results.passed,
        total: results.total,
        score: results.score,
        feedback: results.feedback,
        executionStats: results.executionStats,
        lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('[Save] Test results saved to session:', sessionId);
  } catch (error) {
    console.error('[Save] Error saving test results:', error);
    // Don't throw, just log the error
  }
}

/**
 * Log test run for analytics
 * @param {string} userId - User ID
 * @param {Object} metadata - Test run metadata
 * @returns {Promise<void>}
 */
async function logTestRun(userId, metadata) {
  const db = admin.firestore();

  try {
    await db.collection('testRunLogs').add({
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ...metadata,
    });
  } catch (error) {
    console.error('[Log] Error logging test run:', error);
  }
}
