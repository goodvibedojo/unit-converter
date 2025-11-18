// Code Execution Service
// Handles running user code in a sandboxed environment

class CodeExecutionService {
  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  }

  /**
   * Execute Python code
   * @param {string} code - The Python code to execute
   * @param {string} input - Optional stdin input
   * @returns {Promise<{output: string, error: string, executionTime: number}>}
   */
  async executePython(code, input = '') {
    try {
      // TODO: In production, this would call a Firebase Function that runs code in a Docker container
      // For now, using a mock implementation
      const result = await this.mockPythonExecution(code, input);
      return result;
    } catch (error) {
      return {
        output: '',
        error: error.message || 'Execution failed',
        executionTime: 0
      };
    }
  }

  /**
   * Mock Python execution for development
   * Simulates running code and returning output
   */
  async mockPythonExecution(code, input = '') {
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Basic simulation - check for common patterns
    const lowerCode = code.toLowerCase();

    // Check for syntax errors (very basic)
    if (!code.trim()) {
      return {
        output: '',
        error: 'SyntaxError: unexpected EOF while parsing',
        executionTime: 0
      };
    }

    // Check for infinite loops (basic detection)
    if (lowerCode.includes('while true') && !lowerCode.includes('break')) {
      return {
        output: '',
        error: 'TimeoutError: Execution exceeded time limit (30s)',
        executionTime: 30000
      };
    }

    // Simulate successful execution
    // In a real implementation, this would actually run the code
    let output = '';

    // Try to extract print statements for simulation
    const printMatches = code.match(/print\((.*?)\)/g);
    if (printMatches) {
      output = printMatches.map(p => {
        // Very basic simulation - just extract what's being printed
        const content = p.match(/print\((.*?)\)/)[1];
        if (content.includes('[')) {
          return content; // Likely printing a list/result
        }
        return content.replace(/['"]/g, '');
      }).join('\n');
    } else {
      output = '(No output - code executed successfully)';
    }

    return {
      output: output || '(Code executed successfully)',
      error: '',
      executionTime: Math.random() * 200 + 100 // 100-300ms
    };
  }

  /**
   * Execute JavaScript code
   * @param {string} code - The JavaScript code to execute
   * @param {string} input - Optional stdin input
   * @returns {Promise<{output: string, error: string, executionTime: number}>}
   */
  async executeJavaScript(code, input = '') {
    const startTime = performance.now();

    try {
      // Capture console.log output
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '));
      };

      // Execute code in a sandboxed manner
      // Note: eval is used here for demo purposes only
      // In production, use WebContainers or a proper sandbox
      eval(code);

      // Restore console.log
      console.log = originalLog;

      const executionTime = performance.now() - startTime;

      return {
        output: logs.join('\n') || '(Code executed successfully)',
        error: '',
        executionTime
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      return {
        output: '',
        error: `${error.name}: ${error.message}`,
        executionTime
      };
    }
  }

  /**
   * Run test cases against code
   * @param {string} code - The code to test
   * @param {Array} testCases - Array of test case objects
   * @param {string} language - Programming language
   * @returns {Promise<{results: Array, passed: number, total: number}>}
   */
  async runTestCases(code, testCases, language = 'python') {
    const results = [];
    let passed = 0;

    for (const testCase of testCases) {
      const startTime = performance.now();

      // TODO: Actually execute the code with test inputs
      // For now, using mock results
      const testResult = await this.mockTestExecution(code, testCase, language);

      if (testResult.passed) {
        passed++;
      }

      results.push({
        ...testCase,
        ...testResult,
        executionTime: performance.now() - startTime
      });
    }

    return {
      results,
      passed,
      total: testCases.length,
      score: (passed / testCases.length) * 100
    };
  }

  /**
   * Mock test execution
   */
  async mockTestExecution(code, testCase, language) {
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simple mock - randomly pass/fail for demo
    // In production, this would actually run the code with test inputs
    const passed = Math.random() > 0.3; // 70% pass rate for demo

    return {
      passed,
      actualOutput: passed ? testCase.expectedOutput : '(incorrect output)',
      error: passed ? '' : 'AssertionError: Output does not match expected result'
    };
  }
}

export default new CodeExecutionService();

// Example Firebase Function for production code execution:
/*
// functions/executeCode.js
const functions = require('firebase-functions');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

exports.executeCode = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { code, language, input } = data;

  // Validate input
  if (!code || !language) {
    throw new functions.https.HttpsError('invalid-argument', 'Code and language are required');
  }

  try {
    // Create temporary file
    const tempDir = '/tmp';
    const fileName = `code_${Date.now()}`;
    const filePath = path.join(tempDir, `${fileName}.${language === 'python' ? 'py' : 'js'}`);

    await fs.writeFile(filePath, code);

    // Execute in Docker container with resource limits
    const result = await executeInDocker(filePath, language, input);

    // Clean up
    await fs.unlink(filePath);

    return result;
  } catch (error) {
    console.error('Execution error:', error);
    throw new functions.https.HttpsError('internal', 'Code execution failed');
  }
});

async function executeInDocker(filePath, language, input) {
  return new Promise((resolve, reject) => {
    const command = language === 'python' ? 'python3' : 'node';
    const args = [filePath];

    // Spawn process with timeout and resource limits
    const process = spawn('docker', [
      'run',
      '--rm',
      '--network', 'none',
      '--memory', '512m',
      '--cpus', '1',
      '--pids-limit', '50',
      '-v', `${filePath}:/code:ro`,
      'python:3.9-slim',  // or node:18-slim for JS
      command,
      '/code'
    ]);

    let output = '';
    let error = '';
    const startTime = Date.now();

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      process.kill();
      reject(new Error('Execution timeout'));
    }, 30000);

    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      error += data.toString();
    });

    process.on('close', (code) => {
      clearTimeout(timeout);
      const executionTime = Date.now() - startTime;

      resolve({
        output,
        error,
        exitCode: code,
        executionTime
      });
    });

    process.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
*/
