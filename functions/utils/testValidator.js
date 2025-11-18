/**
 * Test Validator
 * Validates test case results and compares outputs
 */

class TestValidator {
  /**
   * Compare actual output with expected output
   * @param {string} actual - Actual output from code execution
   * @param {string} expected - Expected output
   * @param {Object} options - Comparison options
   * @returns {boolean} True if outputs match
   */
  compareOutputs(actual, expected, options = {}) {
    const {
      trimWhitespace = true,
      ignoreCase = false,
      strictMode = false,
    } = options;

    if (!actual && !expected) return true;
    if (!actual || !expected) return false;

    let actualProcessed = actual.toString();
    let expectedProcessed = expected.toString();

    // Trim whitespace
    if (trimWhitespace) {
      actualProcessed = actualProcessed.trim();
      expectedProcessed = expectedProcessed.trim();
    }

    // Ignore case
    if (ignoreCase) {
      actualProcessed = actualProcessed.toLowerCase();
      expectedProcessed = expectedProcessed.toLowerCase();
    }

    // Strict mode: exact match including whitespace
    if (strictMode) {
      return actual === expected;
    }

    // Normal mode: compare trimmed strings
    if (actualProcessed === expectedProcessed) {
      return true;
    }

    // Try comparing as numbers (for floating point)
    if (this._isNumeric(actualProcessed) && this._isNumeric(expectedProcessed)) {
      const actualNum = parseFloat(actualProcessed);
      const expectedNum = parseFloat(expectedProcessed);
      const epsilon = 1e-6;
      return Math.abs(actualNum - expectedNum) < epsilon;
    }

    // Try comparing as arrays (for list outputs like [1, 2, 3])
    if (this._isArrayLike(actualProcessed) && this._isArrayLike(expectedProcessed)) {
      return this._compareArrays(actualProcessed, expectedProcessed);
    }

    return false;
  }

  /**
   * Check if string is numeric
   * @param {string} str - String to check
   * @returns {boolean}
   */
  _isNumeric(str) {
    return !isNaN(parseFloat(str)) && isFinite(str);
  }

  /**
   * Check if string looks like an array
   * @param {string} str - String to check
   * @returns {boolean}
   */
  _isArrayLike(str) {
    const trimmed = str.trim();
    return (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
           (trimmed.startsWith('{') && trimmed.endsWith('}'));
  }

  /**
   * Compare array-like strings
   * @param {string} actual - Actual array string
   * @param {string} expected - Expected array string
   * @returns {boolean}
   */
  _compareArrays(actual, expected) {
    try {
      // Try to parse as JSON
      const actualParsed = JSON.parse(actual.replace(/'/g, '"'));
      const expectedParsed = JSON.parse(expected.replace(/'/g, '"'));
      return JSON.stringify(actualParsed) === JSON.stringify(expectedParsed);
    } catch {
      // If parsing fails, compare as strings
      return actual.trim() === expected.trim();
    }
  }

  /**
   * Calculate score based on test results
   * @param {Array} results - Array of test results
   * @returns {Object} Score information
   */
  calculateScore(results) {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;

    return {
      total,
      passed,
      failed,
      score,
      percentage: score,
    };
  }

  /**
   * Generate detailed test report
   * @param {Array} results - Array of test results
   * @returns {Object} Detailed report
   */
  generateReport(results) {
    const scoreInfo = this.calculateScore(results);

    const passedTests = results.filter(r => r.passed);
    const failedTests = results.filter(r => !r.passed);

    const report = {
      ...scoreInfo,
      summary: {
        allPassed: scoreInfo.passed === scoreInfo.total,
        somePassed: scoreInfo.passed > 0 && scoreInfo.passed < scoreInfo.total,
        allFailed: scoreInfo.passed === 0,
      },
      passedTests: passedTests.map(t => ({
        input: t.input,
        expectedOutput: t.expectedOutput,
        executionTime: t.executionTime,
      })),
      failedTests: failedTests.map(t => ({
        input: t.input,
        expectedOutput: t.expectedOutput,
        actualOutput: t.actualOutput,
        error: t.error,
        executionTime: t.executionTime,
      })),
      executionStats: {
        totalTime: results.reduce((sum, r) => sum + (r.executionTime || 0), 0),
        averageTime: results.length > 0
          ? results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length
          : 0,
        maxTime: Math.max(...results.map(r => r.executionTime || 0)),
        minTime: Math.min(...results.map(r => r.executionTime || 0)),
      },
    };

    return report;
  }

  /**
   * Get feedback message based on score
   * @param {number} score - Test score (0-100)
   * @returns {string} Feedback message
   */
  getFeedback(score) {
    if (score === 100) {
      return '✅ Perfect! All test cases passed.';
    } else if (score >= 80) {
      return '✅ Great job! Most test cases passed. Review the failed cases.';
    } else if (score >= 60) {
      return '⚠️ Good progress. More than half of the test cases passed.';
    } else if (score >= 40) {
      return '⚠️ Keep working. Less than half of the test cases passed.';
    } else if (score > 0) {
      return '❌ Needs improvement. Most test cases failed.';
    } else {
      return '❌ No test cases passed. Review your solution.';
    }
  }

  /**
   * Validate test case format
   * @param {Object} testCase - Test case object
   * @returns {Object} { valid: boolean, error: string }
   */
  validateTestCase(testCase) {
    if (!testCase || typeof testCase !== 'object') {
      return { valid: false, error: 'Test case must be an object' };
    }

    if (!('input' in testCase)) {
      return { valid: false, error: 'Test case must have an input field' };
    }

    if (!('expectedOutput' in testCase)) {
      return { valid: false, error: 'Test case must have an expectedOutput field' };
    }

    return { valid: true, error: null };
  }
}

module.exports = new TestValidator();
