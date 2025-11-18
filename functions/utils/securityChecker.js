/**
 * Security Checker
 * Scans code for potentially dangerous patterns before execution
 */

// Dangerous patterns for different languages
const DANGEROUS_PATTERNS = {
  python: [
    { pattern: /import\s+os/, message: 'OS module import is not allowed' },
    { pattern: /from\s+os\s+import/, message: 'OS module import is not allowed' },
    { pattern: /import\s+subprocess/, message: 'Subprocess module is not allowed' },
    { pattern: /import\s+socket/, message: 'Socket module is not allowed' },
    { pattern: /import\s+requests/, message: 'Network requests are not allowed' },
    { pattern: /import\s+urllib/, message: 'Network requests are not allowed' },
    { pattern: /__import__\s*\(/, message: 'Dynamic imports are not allowed' },
    { pattern: /eval\s*\(/, message: 'eval() is not allowed' },
    { pattern: /exec\s*\(/, message: 'exec() is not allowed' },
    { pattern: /compile\s*\(/, message: 'compile() is not allowed' },
    { pattern: /open\s*\(/, message: 'File operations are restricted' },
    { pattern: /input\s*\(/, message: 'Use stdin for input instead of input()' },
  ],
  javascript: [
    { pattern: /require\s*\(\s*['"]fs['"]/, message: 'File system access is not allowed' },
    { pattern: /require\s*\(\s*['"]child_process['"]/, message: 'Child process is not allowed' },
    { pattern: /require\s*\(\s*['"]net['"]/, message: 'Network access is not allowed' },
    { pattern: /require\s*\(\s*['"]http['"]/, message: 'HTTP requests are not allowed' },
    { pattern: /require\s*\(\s*['"]https['"]/, message: 'HTTPS requests are not allowed' },
    { pattern: /eval\s*\(/, message: 'eval() is not allowed' },
    { pattern: /Function\s*\(/, message: 'Function constructor is not allowed' },
    { pattern: /process\.exit/, message: 'process.exit() is not allowed' },
  ],
  java: [
    { pattern: /import\s+java\.io\.File/, message: 'File I/O is restricted' },
    { pattern: /import\s+java\.net/, message: 'Network access is not allowed' },
    { pattern: /import\s+java\.lang\.Runtime/, message: 'Runtime access is not allowed' },
    { pattern: /import\s+java\.lang\.ProcessBuilder/, message: 'Process creation is not allowed' },
    { pattern: /System\.exit/, message: 'System.exit() is not allowed' },
  ],
  cpp: [
    { pattern: /#include\s+<fstream>/, message: 'File I/O is restricted' },
    { pattern: /#include\s+<filesystem>/, message: 'Filesystem access is not allowed' },
    { pattern: /system\s*\(/, message: 'system() calls are not allowed' },
    { pattern: /popen\s*\(/, message: 'popen() is not allowed' },
    { pattern: /exec[lv][pe]*\s*\(/, message: 'exec family functions are not allowed' },
  ],
};

class SecurityChecker {
  /**
   * Check code for security issues
   * @param {string} code - Source code to check
   * @param {string} language - Programming language
   * @returns {Object} { safe: boolean, issues: Array }
   */
  checkCode(code, language) {
    const issues = [];
    const languagePatterns = DANGEROUS_PATTERNS[language.toLowerCase()];

    if (!languagePatterns) {
      // Unknown language, allow but log warning
      console.warn(`[Security] No security patterns defined for language: ${language}`);
      return { safe: true, issues: [] };
    }

    // Check each pattern
    for (const { pattern, message } of languagePatterns) {
      if (pattern.test(code)) {
        issues.push({
          severity: 'error',
          message,
          pattern: pattern.toString(),
        });
      }
    }

    // Check code size
    const maxCodeSize = 50000; // 50 KB
    if (code.length > maxCodeSize) {
      issues.push({
        severity: 'error',
        message: `Code size exceeds maximum allowed (${maxCodeSize} characters)`,
      });
    }

    // Check for excessive loops (heuristic)
    const loopCount = this._countLoops(code, language);
    if (loopCount > 20) {
      issues.push({
        severity: 'warning',
        message: `Code contains ${loopCount} loops. This may cause performance issues.`,
      });
    }

    const safe = issues.filter(i => i.severity === 'error').length === 0;

    if (!safe) {
      console.warn('[Security] Code failed security check:', {
        language,
        issueCount: issues.length,
        issues: issues.map(i => i.message),
      });
    }

    return { safe, issues };
  }

  /**
   * Count loops in code (heuristic)
   * @param {string} code - Source code
   * @param {string} language - Programming language
   * @returns {number} Estimated loop count
   */
  _countLoops(code, language) {
    let count = 0;

    if (language === 'python') {
      count += (code.match(/\bfor\s+\w+\s+in\s+/g) || []).length;
      count += (code.match(/\bwhile\s+/g) || []).length;
    } else if (language === 'javascript') {
      count += (code.match(/\bfor\s*\(/g) || []).length;
      count += (code.match(/\bwhile\s*\(/g) || []).length;
    } else if (language === 'java' || language === 'cpp' || language === 'c') {
      count += (code.match(/\bfor\s*\(/g) || []).length;
      count += (code.match(/\bwhile\s*\(/g) || []).length;
      count += (code.match(/\bdo\s*\{/g) || []).length;
    }

    return count;
  }

  /**
   * Sanitize code output (remove potential XSS or sensitive data)
   * @param {string} output - Code execution output
   * @returns {string} Sanitized output
   */
  sanitizeOutput(output) {
    if (!output) return '';

    // Limit output size
    const maxOutputSize = parseInt(process.env.MAX_OUTPUT_SIZE || '10240', 10);
    if (output.length > maxOutputSize) {
      return output.substring(0, maxOutputSize) + '\n... (output truncated)';
    }

    // Remove potential script tags (basic XSS prevention)
    let sanitized = output.replace(/<script[^>]*>.*?<\/script>/gi, '[script removed]');
    sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '[iframe removed]');

    return sanitized;
  }

  /**
   * Validate test case inputs
   * @param {Array} testCases - Array of test case objects
   * @returns {Object} { valid: boolean, issues: Array }
   */
  validateTestCases(testCases) {
    const issues = [];

    if (!Array.isArray(testCases)) {
      issues.push({ message: 'Test cases must be an array' });
      return { valid: false, issues };
    }

    if (testCases.length === 0) {
      issues.push({ message: 'At least one test case is required' });
      return { valid: false, issues };
    }

    if (testCases.length > 50) {
      issues.push({ message: 'Maximum 50 test cases allowed' });
      return { valid: false, issues };
    }

    testCases.forEach((testCase, index) => {
      if (!testCase.input && testCase.input !== '') {
        issues.push({ message: `Test case ${index + 1}: missing input field` });
      }
      if (!testCase.expectedOutput && testCase.expectedOutput !== '') {
        issues.push({ message: `Test case ${index + 1}: missing expectedOutput field` });
      }

      // Check input/output size
      const maxSize = 5000;
      if (testCase.input && testCase.input.length > maxSize) {
        issues.push({ message: `Test case ${index + 1}: input too large (max ${maxSize} chars)` });
      }
      if (testCase.expectedOutput && testCase.expectedOutput.length > maxSize) {
        issues.push({ message: `Test case ${index + 1}: expectedOutput too large (max ${maxSize} chars)` });
      }
    });

    return { valid: issues.length === 0, issues };
  }
}

module.exports = new SecurityChecker();
