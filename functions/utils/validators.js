/**
 * Input validation utilities
 * Provides validation functions for API requests
 */

/**
 * Validate required fields in request body
 *
 * @param {Object} body - Request body
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} { valid: boolean, errors: Array }
 */
const validateRequired = (body, requiredFields) => {
  const errors = [];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate difficulty level
 *
 * @param {string} difficulty
 * @returns {boolean}
 */
const validateDifficulty = (difficulty) => {
  const validDifficulties = ['easy', 'medium', 'hard'];
  return validDifficulties.includes(difficulty?.toLowerCase());
};

/**
 * Validate programming language
 *
 * @param {string} language
 * @returns {boolean}
 */
const validateLanguage = (language) => {
  const validLanguages = ['python', 'javascript', 'java', 'cpp'];
  return validLanguages.includes(language?.toLowerCase());
};

/**
 * Validate session ID format
 *
 * @param {string} sessionId
 * @returns {boolean}
 */
const validateSessionId = (sessionId) => {
  // Session ID should be a non-empty string
  return typeof sessionId === 'string' && sessionId.length > 0;
};

/**
 * Validate problem ID format
 *
 * @param {string} problemId
 * @returns {boolean}
 */
const validateProblemId = (problemId) => {
  // Problem ID should be a non-empty string
  return typeof problemId === 'string' && problemId.length > 0;
};

/**
 * Validate code input
 *
 * @param {string} code
 * @returns {Object} { valid: boolean, error: string }
 */
const validateCode = (code) => {
  if (typeof code !== 'string') {
    return { valid: false, error: 'Code must be a string' };
  }

  if (code.length === 0) {
    return { valid: false, error: 'Code cannot be empty' };
  }

  if (code.length > 50000) {
    return { valid: false, error: 'Code exceeds maximum length (50,000 characters)' };
  }

  return { valid: true };
};

/**
 * Validate email format
 *
 * @param {string} email
 * @returns {boolean}
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate subscription plan
 *
 * @param {string} plan
 * @returns {boolean}
 */
const validatePlan = (plan) => {
  const validPlans = ['monthly', 'annual'];
  return validPlans.includes(plan?.toLowerCase());
};

/**
 * Validate chat message
 *
 * @param {string} message
 * @returns {Object} { valid: boolean, error: string }
 */
const validateMessage = (message) => {
  if (typeof message !== 'string') {
    return { valid: false, error: 'Message must be a string' };
  }

  if (message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (message.length > 5000) {
    return { valid: false, error: 'Message exceeds maximum length (5,000 characters)' };
  }

  return { valid: true };
};

/**
 * Sanitize user input to prevent XSS
 *
 * @param {string} input
 * @returns {string}
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate pagination parameters
 *
 * @param {number} page
 * @param {number} limit
 * @returns {Object} { valid: boolean, error: string, sanitizedPage: number, sanitizedLimit: number }
 */
const validatePagination = (page, limit) => {
  const sanitizedPage = Math.max(1, parseInt(page) || 1);
  const sanitizedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

  return {
    valid: true,
    sanitizedPage,
    sanitizedLimit,
  };
};

/**
 * Validate test case structure
 *
 * @param {Object} testCase
 * @returns {Object} { valid: boolean, errors: Array }
 */
const validateTestCase = (testCase) => {
  const errors = [];

  if (!testCase.input) {
    errors.push('Test case must have input');
  }

  if (!testCase.expectedOutput) {
    errors.push('Test case must have expectedOutput');
  }

  if (typeof testCase.isHidden !== 'boolean') {
    errors.push('Test case isHidden must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateRequired,
  validateDifficulty,
  validateLanguage,
  validateSessionId,
  validateProblemId,
  validateCode,
  validateEmail,
  validatePlan,
  validateMessage,
  sanitizeInput,
  validatePagination,
  validateTestCase,
};
