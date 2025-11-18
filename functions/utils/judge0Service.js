/**
 * Judge0 API Integration
 *
 * Production code execution service using Judge0 CE (Community Edition)
 * Docs: https://ce.judge0.com/
 */

const axios = require('axios');
const functions = require('firebase-functions');
const { logger } = require('./monitoring');

// Language ID mappings for Judge0
const LANGUAGE_IDS = {
  python: 71, // Python 3.8.1
  javascript: 63, // JavaScript (Node.js 12.14.0)
  java: 62, // Java (OpenJDK 13.0.1)
  cpp: 54, // C++ (GCC 9.2.0)
  c: 50, // C (GCC 9.2.0)
  typescript: 74, // TypeScript 3.7.4
  ruby: 72, // Ruby 2.7.0
  go: 60, // Go 1.13.5
};

/**
 * Get Judge0 configuration
 */
function getJudge0Config() {
  const apiKey = functions.config().judge0?.apikey || process.env.JUDGE0_API_KEY;
  const baseUrl =
    functions.config().judge0?.url ||
    process.env.JUDGE0_URL ||
    'https://judge0-ce.p.rapidapi.com';

  return {
    apiKey,
    baseUrl,
  };
}

/**
 * Check if Judge0 is configured
 */
function isJudge0Configured() {
  const { apiKey } = getJudge0Config();
  return !!apiKey;
}

/**
 * Execute code using Judge0
 *
 * @param {Object} params - Execution parameters
 * @param {string} params.code - Source code to execute
 * @param {string} params.language - Programming language
 * @param {string} params.stdin - Standard input (optional)
 * @param {number} params.timeout - Timeout in seconds (default: 10)
 * @param {number} params.memoryLimit - Memory limit in KB (default: 524288 = 512MB)
 * @returns {Promise<Object>} Execution result
 */
async function executeCode({
  code,
  language,
  stdin = '',
  timeout = 10,
  memoryLimit = 524288,
}) {
  try {
    const { apiKey, baseUrl } = getJudge0Config();

    if (!apiKey) {
      throw new Error('Judge0 API key not configured');
    }

    const languageId = LANGUAGE_IDS[language];

    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    logger.info('Submitting code to Judge0', {
      language,
      languageId,
      codeLength: code.length,
      hasStdin: !!stdin,
    });

    // Step 1: Submit code for execution
    const submissionResponse = await axios.post(
      `${baseUrl}/submissions`,
      {
        source_code: Buffer.from(code).toString('base64'),
        language_id: languageId,
        stdin: stdin ? Buffer.from(stdin).toString('base64') : null,
        cpu_time_limit: timeout,
        memory_limit: memoryLimit,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        params: {
          base64_encoded: 'true',
          wait: 'false',
        },
      }
    );

    const token = submissionResponse.data.token;

    logger.debug('Submission created', { token });

    // Step 2: Poll for result (with timeout)
    const maxAttempts = 30; // 30 attempts * 500ms = 15 seconds max wait
    let attempts = 0;
    let result = null;

    while (attempts < maxAttempts) {
      await sleep(500); // Wait 500ms between polls

      const resultResponse = await axios.get(
        `${baseUrl}/submissions/${token}`,
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          },
          params: {
            base64_encoded: 'true',
          },
        }
      );

      result = resultResponse.data;

      // Status 1 = In Queue, 2 = Processing
      if (result.status.id > 2) {
        // Execution complete
        break;
      }

      attempts++;
    }

    if (!result || result.status.id <= 2) {
      throw new Error('Execution timeout: Code took too long to execute');
    }

    logger.info('Execution complete', {
      statusId: result.status.id,
      statusDescription: result.status.description,
      time: result.time,
      memory: result.memory,
    });

    // Decode base64 outputs
    const stdout = result.stdout
      ? Buffer.from(result.stdout, 'base64').toString('utf-8')
      : '';
    const stderr = result.stderr
      ? Buffer.from(result.stderr, 'base64').toString('utf-8')
      : '';
    const compileOutput = result.compile_output
      ? Buffer.from(result.compile_output, 'base64').toString('utf-8')
      : '';

    // Map Judge0 status to our format
    const executionResult = {
      stdout,
      stderr,
      compileOutput,
      exitCode: result.status.id === 3 ? 0 : result.status.id, // 3 = Accepted
      status: result.status.description,
      executionTime: parseFloat(result.time) * 1000 || 0, // Convert to ms
      memory: parseInt(result.memory) * 1024 || 0, // Convert to bytes
      success: result.status.id === 3, // Accepted
      error: result.status.id !== 3 ? getErrorMessage(result) : null,
    };

    return executionResult;
  } catch (error) {
    logger.error('Judge0 execution error', {
      error: error.message,
      response: error.response?.data,
    });

    // Handle specific errors
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    if (error.response?.status === 401) {
      throw new Error('Judge0 API authentication failed. Please contact support.');
    }

    throw new Error(`Code execution failed: ${error.message}`);
  }
}

/**
 * Get error message from Judge0 result
 */
function getErrorMessage(result) {
  const statusId = result.status.id;

  // Status codes: https://ce.judge0.com/#statuses
  const errorMessages = {
    4: 'Wrong Answer',
    5: 'Time Limit Exceeded',
    6: 'Compilation Error',
    7: 'Runtime Error (SIGSEGV)',
    8: 'Runtime Error (SIGXFSZ)',
    9: 'Runtime Error (SIGFPE)',
    10: 'Runtime Error (SIGABRT)',
    11: 'Runtime Error (NZEC)',
    12: 'Runtime Error (Other)',
    13: 'Internal Error',
    14: 'Exec Format Error',
  };

  return errorMessages[statusId] || result.status.description;
}

/**
 * Run test cases against code
 *
 * @param {Object} params - Test parameters
 * @param {string} params.code - Source code
 * @param {string} params.language - Programming language
 * @param {Array} params.testCases - Array of test cases
 * @returns {Promise<Object>} Test results
 */
async function runTestCases({ code, language, testCases }) {
  logger.info('Running test cases', {
    language,
    testCaseCount: testCases.length,
  });

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const [index, testCase] of testCases.entries()) {
    try {
      logger.debug(`Running test case ${index + 1}`, {
        hasInput: !!testCase.input,
      });

      const result = await executeCode({
        code,
        language,
        stdin: testCase.input || '',
        timeout: 5, // 5 seconds per test
      });

      // Compare output (trim whitespace)
      const expectedOutput = (testCase.expectedOutput || '').trim();
      const actualOutput = (result.stdout || '').trim();
      const testPassed = actualOutput === expectedOutput && result.success;

      if (testPassed) {
        passed++;
      } else {
        failed++;
      }

      results.push({
        testCase: index + 1,
        passed: testPassed,
        input: testCase.input,
        expectedOutput,
        actualOutput,
        executionTime: result.executionTime,
        memory: result.memory,
        error: result.error,
        hidden: testCase.hidden || false,
      });
    } catch (error) {
      failed++;
      results.push({
        testCase: index + 1,
        passed: false,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: '',
        error: error.message,
        hidden: testCase.hidden || false,
      });
    }
  }

  logger.info('Test cases complete', {
    passed,
    failed,
    total: testCases.length,
  });

  return {
    passed,
    failed,
    total: testCases.length,
    results: results.map((r) =>
      r.hidden
        ? { testCase: r.testCase, passed: r.passed, hidden: true }
        : r
    ),
    allPassed: passed === testCases.length,
  };
}

/**
 * Validate code syntax (compile without executing)
 *
 * @param {Object} params - Validation parameters
 * @param {string} params.code - Source code
 * @param {string} params.language - Programming language
 * @returns {Promise<Object>} Validation result
 */
async function validateSyntax({ code, language }) {
  try {
    // For compiled languages, submit with no stdin and minimal timeout
    const result = await executeCode({
      code,
      language,
      stdin: '',
      timeout: 2,
    });

    return {
      valid: !result.compileOutput && result.status !== 'Compilation Error',
      errors: result.compileOutput || result.stderr || null,
    };
  } catch (error) {
    return {
      valid: false,
      errors: error.message,
    };
  }
}

/**
 * Get supported languages
 */
function getSupportedLanguages() {
  return Object.keys(LANGUAGE_IDS);
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  executeCode,
  runTestCases,
  validateSyntax,
  isJudge0Configured,
  getSupportedLanguages,
  LANGUAGE_IDS,
};
