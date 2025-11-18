/**
 * Cloud Function: executeCode
 *
 * Type: HTTP Callable
 * Purpose: Execute user code and return results
 *
 * Note: This uses Judge0 API initially for MVP
 * Future: Migrate to self-hosted Docker sandbox for production
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { validateSessionId, validateCode, validateLanguage } = require('../utils/validators');

// Language ID mapping for Judge0 API
const LANGUAGE_IDS = {
  python: 71, // Python 3
  javascript: 63, // JavaScript (Node.js)
  java: 62, // Java
  cpp: 54, // C++ (GCC 9.2.0)
};

exports.executeCode = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { sessionId, code, language, stdin = '' } = data;

    // Validate inputs
    if (!validateSessionId(sessionId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid session ID');
    }

    const codeValidation = validateCode(code);
    if (!codeValidation.valid) {
      throw new functions.https.HttpsError('invalid-argument', codeValidation.error);
    }

    if (!validateLanguage(language)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid language');
    }

    const db = admin.firestore();
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionDoc.data();

    // Verify ownership
    if (sessionData.userId !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You do not have permission to access this session'
      );
    }

    // For MVP: Mock code execution
    // TODO: Integrate Judge0 API or Docker sandbox
    const useMockExecution = process.env.USE_MOCK_EXECUTION !== 'false';

    let executionResult;
    if (useMockExecution) {
      executionResult = mockExecuteCode(code, language, stdin);
    } else {
      // TODO: Integrate with Judge0 API
      // executionResult = await executeWithJudge0(code, language, stdin);
      executionResult = {
        stdout: 'Judge0 integration coming soon!',
        stderr: '',
        exitCode: 0,
        executionTime: 0,
        memory: 0,
      };
    }

    console.log('Code executed for session:', sessionId);

    return {
      success: true,
      result: executionResult,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error executing code:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to execute code');
  }
});

/**
 * Mock code execution for development
 */
function mockExecuteCode(code, language, stdin) {
  // Simple mock execution
  // In reality, code would be executed in a sandbox

  // Check for syntax errors (very basic)
  if (code.includes('syntax error')) {
    return {
      stdout: '',
      stderr: 'SyntaxError: invalid syntax',
      exitCode: 1,
      executionTime: 10,
      memory: 1024,
    };
  }

  // Mock successful execution
  let output = '';

  if (code.includes('print') || code.includes('console.log')) {
    if (code.includes('Hello')) {
      output = 'Hello, World!\n';
    } else {
      output = '[1, 2, 3]\n';
    }
  }

  return {
    stdout: output,
    stderr: '',
    exitCode: 0,
    executionTime: Math.floor(Math.random() * 100), // Random execution time
    memory: Math.floor(Math.random() * 10000) + 1024, // Random memory usage
  };
}

/**
 * Execute code using Judge0 API
 * TODO: Implement this function
 */
async function executeWithJudge0(code, language, stdin) {
  // Implementation will be added when integrating Judge0
  throw new Error('Judge0 integration not yet implemented');
}
