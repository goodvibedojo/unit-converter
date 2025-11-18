// Code Execution Service
// Handles running user code via Firebase Functions + Judge0 API

import { getFunctions, httpsCallable } from 'firebase/functions';

class CodeExecutionService {
  constructor() {
    this.functions = null;
    this.executeCodeFn = null;
    this.runTestCasesFn = null;
    this.useMock = import.meta.env.VITE_USE_MOCK_EXECUTION === 'true';

    // Initialize Firebase Functions
    this.initializeFunctions();
  }

  /**
   * Initialize Firebase Functions
   */
  initializeFunctions() {
    try {
      this.functions = getFunctions();

      // Get callable functions
      this.executeCodeFn = httpsCallable(this.functions, 'executeCode');
      this.runTestCasesFn = httpsCallable(this.functions, 'runTestCases');

      console.log('[CodeExecution] Firebase Functions initialized');
    } catch (error) {
      console.warn('[CodeExecution] Firebase Functions not available, using mock mode:', error.message);
      this.useMock = true;
    }
  }

  /**
   * Execute code in specified language
   * @param {string} code - Source code to execute
   * @param {string} language - Programming language
   * @param {string} stdin - Standard input (optional)
   * @returns {Promise<Object>} Execution result
   */
  async executeCode(code, language = 'python', stdin = '') {
    // Use mock in development or if Firebase not available
    if (this.useMock) {
      return this.mockExecution(code, language, stdin);
    }

    try {
      console.log('[CodeExecution] Executing code:', { language, codeLength: code.length });

      const result = await this.executeCodeFn({
        code,
        language: language.toLowerCase(),
        stdin,
      });

      console.log('[CodeExecution] Execution completed:', result.data);
      return this.formatResult(result.data);
    } catch (error) {
      console.error('[CodeExecution] Execution failed:', error);
      return {
        success: false,
        output: '',
        error: this.formatError(error),
        executionTime: 0,
      };
    }
  }

  /**
   * Execute Python code (convenience method)
   * @param {string} code - Python code
   * @param {string} stdin - Standard input
   * @returns {Promise<Object>} Execution result
   */
  async executePython(code, stdin = '') {
    return this.executeCode(code, 'python', stdin);
  }

  /**
   * Execute JavaScript code (convenience method)
   * @param {string} code - JavaScript code
   * @param {string} stdin - Standard input
   * @returns {Promise<Object>} Execution result
   */
  async executeJavaScript(code, stdin = '') {
    return this.executeCode(code, 'javascript', stdin);
  }

  /**
   * Run test cases against code
   * @param {string} code - Source code
   * @param {Array} testCases - Array of test case objects
   * @param {string} language - Programming language
   * @param {string} sessionId - Interview session ID (optional)
   * @returns {Promise<Object>} Test results
   */
  async runTestCases(code, testCases, language = 'python', sessionId = null) {
    // Use mock in development or if Firebase not available
    if (this.useMock) {
      return this.mockTestExecution(code, testCases, language);
    }

    try {
      console.log('[CodeExecution] Running tests:', {
        language,
        testCount: testCases.length,
        codeLength: code.length,
      });

      const result = await this.runTestCasesFn({
        code,
        language: language.toLowerCase(),
        testCases,
        sessionId,
      });

      console.log('[CodeExecution] Tests completed:', {
        passed: result.data.passed,
        total: result.data.total,
        score: result.data.score,
      });

      return result.data;
    } catch (error) {
      console.error('[CodeExecution] Test execution failed:', error);
      return {
        results: testCases.map(tc => ({
          ...tc,
          passed: false,
          actualOutput: '',
          error: this.formatError(error),
        })),
        passed: 0,
        total: testCases.length,
        score: 0,
        feedback: 'Test execution failed: ' + this.formatError(error),
      };
    }
  }

  /**
   * Format execution result
   * @param {Object} data - Raw result from Firebase Function
   * @returns {Object} Formatted result
   */
  formatResult(data) {
    return {
      success: data.success || false,
      output: data.output || '',
      error: data.error || '',
      executionTime: data.executionTime || 0,
      cpuTime: data.cpuTime || 0,
      memory: data.memory || 0,
      status: data.status || 'unknown',
    };
  }

  /**
   * Format error message
   * @param {Error} error - Error object
   * @returns {string} Formatted error message
   */
  formatError(error) {
    if (error.code === 'unauthenticated') {
      return 'Please log in to execute code';
    }
    if (error.code === 'resource-exhausted') {
      return 'Rate limit exceeded. Please try again later.';
    }
    if (error.code === 'invalid-argument') {
      return error.message || 'Invalid code or arguments';
    }
    if (error.message) {
      return error.message;
    }
    return 'Code execution failed. Please try again.';
  }

  /**
   * Mock execution for development
   * @param {string} code - Source code
   * @param {string} language - Programming language
   * @param {string} stdin - Standard input
   * @returns {Promise<Object>} Mock result
   */
  async mockExecution(code, language, stdin = '') {
    console.log('[CodeExecution] Using MOCK execution');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const lowerCode = code.toLowerCase();

    // Check for syntax errors
    if (!code.trim()) {
      return {
        success: false,
        output: '',
        error: 'SyntaxError: unexpected EOF while parsing',
        executionTime: 0,
      };
    }

    // Check for infinite loops
    if (lowerCode.includes('while true') && !lowerCode.includes('break')) {
      return {
        success: false,
        output: '',
        error: 'TimeoutError: Execution exceeded time limit (10s)',
        executionTime: 10000,
      };
    }

    // Simulate successful execution
    let output = '';

    if (language === 'python') {
      // Extract print statements
      const printMatches = code.match(/print\((.*?)\)/g);
      if (printMatches) {
        output = printMatches.map(p => {
          const content = p.match(/print\((.*?)\)/)[1];
          if (content.includes('[') || content.includes('{')) {
            return content;
          }
          return content.replace(/['"]/g, '');
        }).join('\n');
      }
    } else if (language === 'javascript') {
      // Extract console.log statements
      const logMatches = code.match(/console\.log\((.*?)\)/g);
      if (logMatches) {
        output = logMatches.map(l => {
          const content = l.match(/console\.log\((.*?)\)/)[1];
          return content.replace(/['"]/g, '');
        }).join('\n');
      }
    }

    if (!output) {
      output = '(Code executed successfully - no output)';
    }

    return {
      success: true,
      output,
      error: '',
      executionTime: Math.random() * 500 + 200,
      cpuTime: Math.random() * 200,
      memory: 2048,
      status: 'accepted',
    };
  }

  /**
   * Mock test execution
   * @param {string} code - Source code
   * @param {Array} testCases - Test cases
   * @param {string} language - Programming language
   * @returns {Promise<Object>} Mock test results
   */
  async mockTestExecution(code, testCases, language) {
    console.log('[CodeExecution] Using MOCK test execution');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const results = [];
    let passed = 0;

    for (const testCase of testCases) {
      // Simulate random pass/fail (70% pass rate)
      const isPassed = Math.random() > 0.3;

      if (isPassed) {
        passed++;
      }

      results.push({
        ...testCase,
        passed: isPassed,
        actualOutput: isPassed ? testCase.expectedOutput : '(incorrect output)',
        error: isPassed ? '' : 'AssertionError: Output does not match expected result',
        executionTime: Math.random() * 500 + 100,
      });
    }

    const score = Math.round((passed / testCases.length) * 100);

    return {
      results,
      passed,
      total: testCases.length,
      score,
      feedback: this.getMockFeedback(score),
      report: {
        summary: {
          allPassed: passed === testCases.length,
          somePassed: passed > 0 && passed < testCases.length,
          allFailed: passed === 0,
        },
        executionStats: {
          totalTime: results.reduce((sum, r) => sum + r.executionTime, 0),
          averageTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        },
      },
    };
  }

  /**
   * Get mock feedback based on score
   * @param {number} score - Test score
   * @returns {string} Feedback message
   */
  getMockFeedback(score) {
    if (score === 100) {
      return '✅ Perfect! All test cases passed.';
    } else if (score >= 80) {
      return '✅ Great job! Most test cases passed.';
    } else if (score >= 60) {
      return '⚠️ Good progress. More than half passed.';
    } else if (score > 0) {
      return '⚠️ Keep working. Some tests still failing.';
    } else {
      return '❌ No tests passed. Review your solution.';
    }
  }

  /**
   * Get supported languages
   * @returns {Array} List of supported languages
   */
  getSupportedLanguages() {
    return [
      { id: 'python', name: 'Python', version: '3.8.1' },
      { id: 'javascript', name: 'JavaScript', version: 'Node.js 12' },
      { id: 'java', name: 'Java', version: 'OpenJDK 13' },
      { id: 'cpp', name: 'C++', version: 'GCC 9.2.0' },
      { id: 'c', name: 'C', version: 'GCC 9.2.0' },
    ];
  }
}

export default new CodeExecutionService();
