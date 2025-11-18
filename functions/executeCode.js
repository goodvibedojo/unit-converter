/**
 * Execute Code Firebase Function
 * Handles single code execution requests via Judge0 API
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const judge0Client = require('./utils/judge0Client');
const securityChecker = require('./utils/securityChecker');
const cacheManager = require('./utils/cacheManager');
const performanceMonitor = require('./utils/performanceMonitor');

/**
 * Execute user code
 * @param {Object} data - Request data
 * @param {string} data.code - Source code to execute
 * @param {string} data.language - Programming language
 * @param {string} data.stdin - Standard input (optional)
 * @param {Object} context - Firebase auth context
 * @returns {Promise<Object>} Execution result
 */
exports.executeCode = functions.https.onCall(async (data, context) => {
  const startTime = Date.now();

  try {
    // 1. Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to execute code'
      );
    }

    const userId = context.auth.uid;
    console.log('[executeCode] Request from user:', userId);

    // 2. Input validation
    const { code, language, stdin = '' } = data;

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

    // 3. Rate limiting check
    const rateLimitOk = await checkRateLimit(userId);
    if (!rateLimitOk) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Rate limit exceeded. Please try again later.'
      );
    }

    // 4. Check cache first
    const cachedResult = await cacheManager.getCachedExecution(code, language, stdin);
    if (cachedResult) {
      console.log('[executeCode] Cache hit! Returning cached result');
      const totalTime = Date.now() - startTime;

      // Record cache hit
      performanceMonitor.recordExecution({
        success: cachedResult.success,
        executionTime: totalTime,
        cached: true,
        language,
        userId,
      });

      return {
        ...cachedResult,
        totalTime,
        cached: true,
      };
    }

    // 5. Security check
    const securityCheck = securityChecker.checkCode(code, language);
    if (!securityCheck.safe) {
      console.warn('[executeCode] Security check failed:', securityCheck.issues);
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Code contains potentially dangerous operations: ' +
        securityCheck.issues.map(i => i.message).join('; ')
      );
    }

    // 6. Log security warnings
    const warnings = securityCheck.issues.filter(i => i.severity === 'warning');
    if (warnings.length > 0) {
      console.warn('[executeCode] Security warnings:', warnings);
    }

    // 7. Execute code via Judge0
    console.log('[executeCode] Executing code:', {
      language,
      codeLength: code.length,
      hasStdin: !!stdin,
    });

    const result = await judge0Client.executeCode({
      code,
      language,
      stdin,
    });

    // 8. Sanitize output
    if (result.output) {
      result.output = securityChecker.sanitizeOutput(result.output);
    }
    if (result.error) {
      result.error = securityChecker.sanitizeOutput(result.error);
    }

    // 9. Cache successful results
    if (result.success) {
      await cacheManager.cacheExecution(code, language, stdin, result);
    }

    // 10. Record performance metrics
    performanceMonitor.recordExecution({
      success: result.success,
      executionTime: result.executionTime,
      cached: false,
      language,
      userId,
    });

    // 11. Log execution
    const totalTime = Date.now() - startTime;
    await logExecution(userId, {
      language,
      success: result.success,
      executionTime: result.executionTime,
      totalTime,
    });

    console.log('[executeCode] Execution completed:', {
      userId,
      success: result.success,
      executionTime: result.executionTime,
      totalTime,
    });

    return {
      ...result,
      totalTime,
      cached: false,
    };
  } catch (error) {
    console.error('[executeCode] Error:', error);

    // Re-throw Firebase errors
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Wrap other errors
    throw new functions.https.HttpsError(
      'internal',
      'Code execution failed: ' + error.message
    );
  }
});

/**
 * Check rate limit for user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if within rate limit
 */
async function checkRateLimit(userId) {
  const db = admin.firestore();
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const rateLimitDoc = db.collection('rateLimits').doc(userId);

  try {
    const doc = await rateLimitDoc.get();

    if (!doc.exists) {
      // First request, create rate limit doc
      await rateLimitDoc.set({
        executions: [now],
        lastReset: now,
      });
      return true;
    }

    const data = doc.data();
    let executions = data.executions || [];

    // Remove executions older than 1 hour
    executions = executions.filter(time => time > oneHourAgo);

    // Check limit
    const maxExecutions = parseInt(
      process.env.MAX_EXECUTIONS_PER_USER_PER_HOUR || '100',
      10
    );

    if (executions.length >= maxExecutions) {
      console.warn('[Rate Limit] User exceeded limit:', {
        userId,
        executions: executions.length,
        limit: maxExecutions,
      });
      return false;
    }

    // Add current execution and update
    executions.push(now);
    await rateLimitDoc.update({
      executions,
      lastReset: now,
    });

    return true;
  } catch (error) {
    console.error('[Rate Limit] Error checking rate limit:', error);
    // On error, allow the request (fail open)
    return true;
  }
}

/**
 * Log code execution for analytics
 * @param {string} userId - User ID
 * @param {Object} metadata - Execution metadata
 * @returns {Promise<void>}
 */
async function logExecution(userId, metadata) {
  const db = admin.firestore();

  try {
    await db.collection('executionLogs').add({
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ...metadata,
    });
  } catch (error) {
    console.error('[Log] Error logging execution:', error);
    // Don't throw, just log the error
  }
}
