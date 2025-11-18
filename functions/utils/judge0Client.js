/**
 * Judge0 API Client
 * Handles code execution via Judge0 API with retry logic and error handling
 */

const axios = require('axios');

// Language ID mapping for Judge0
const LANGUAGE_MAP = {
  'python': 71,      // Python 3.8.1
  'javascript': 63,  // JavaScript (Node.js 12.14.0)
  'java': 62,        // Java (OpenJDK 13.0.1)
  'cpp': 54,         // C++ (GCC 9.2.0)
  'c': 50,           // C (GCC 9.2.0)
  'typescript': 74,  // TypeScript (3.7.4)
};

class Judge0Client {
  constructor() {
    this.apiUrl = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
    this.apiKey = process.env.JUDGE0_RAPIDAPI_KEY;
    this.apiHost = process.env.JUDGE0_RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com';

    // Execution limits
    this.maxTime = parseInt(process.env.MAX_EXECUTION_TIME || '10000', 10) / 1000; // Convert to seconds
    this.maxMemory = parseInt(process.env.MAX_MEMORY_MB || '256', 10) * 1024; // Convert to KB
    this.maxOutputSize = parseInt(process.env.MAX_OUTPUT_SIZE || '10240', 10);

    // API client configuration
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': this.apiHost,
      },
      timeout: 60000, // 60 second timeout
    });
  }

  /**
   * Get language ID from language name
   * @param {string} language - Language name (e.g., 'python', 'javascript')
   * @returns {number} Judge0 language ID
   */
  getLanguageId(language) {
    const langId = LANGUAGE_MAP[language.toLowerCase()];
    if (!langId) {
      throw new Error(`Unsupported language: ${language}`);
    }
    return langId;
  }

  /**
   * Submit code for execution
   * @param {Object} options - Execution options
   * @param {string} options.code - Source code to execute
   * @param {string} options.language - Programming language
   * @param {string} options.stdin - Standard input (optional)
   * @returns {Promise<string>} Submission token
   */
  async submitCode({ code, language, stdin = '' }) {
    try {
      const languageId = this.getLanguageId(language);

      const submission = {
        source_code: code,
        language_id: languageId,
        stdin: stdin,
        cpu_time_limit: this.maxTime,
        memory_limit: this.maxMemory,
        enable_network: false, // Security: disable network access
      };

      console.log('[Judge0] Submitting code:', {
        language,
        languageId,
        codeLength: code.length,
        hasStdin: !!stdin,
      });

      const response = await this.client.post('/submissions', submission, {
        params: {
          base64_encoded: 'false',
          wait: 'false', // Async submission
        },
      });

      const token = response.data.token;
      console.log('[Judge0] Submission created:', token);
      return token;
    } catch (error) {
      console.error('[Judge0] Submission error:', error.response?.data || error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Get submission result
   * @param {string} token - Submission token
   * @returns {Promise<Object>} Execution result
   */
  async getSubmission(token) {
    try {
      const response = await this.client.get(`/submissions/${token}`, {
        params: {
          base64_encoded: 'false',
          fields: '*',
        },
      });

      return response.data;
    } catch (error) {
      console.error('[Judge0] Get submission error:', error.response?.data || error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Execute code and wait for result with polling
   * @param {Object} options - Execution options
   * @param {string} options.code - Source code
   * @param {string} options.language - Programming language
   * @param {string} options.stdin - Standard input (optional)
   * @returns {Promise<Object>} Formatted execution result
   */
  async executeCode({ code, language, stdin = '' }) {
    const startTime = Date.now();

    try {
      // Submit code
      const token = await this.submitCode({ code, language, stdin });

      // Poll for result
      const result = await this._pollResult(token);

      const executionTime = Date.now() - startTime;
      console.log('[Judge0] Execution completed:', {
        token,
        status: result.status.description,
        time: result.time,
        memory: result.memory,
        totalTime: executionTime,
      });

      // Format and return result
      return this._formatResult(result, executionTime);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('[Judge0] Execution failed:', error.message);

      return {
        success: false,
        output: '',
        error: error.message,
        executionTime,
        status: 'error',
      };
    }
  }

  /**
   * Poll for submission result
   * @param {string} token - Submission token
   * @param {number} maxAttempts - Maximum polling attempts
   * @param {number} interval - Polling interval in ms
   * @returns {Promise<Object>} Submission result
   */
  async _pollResult(token, maxAttempts = 20, interval = 500) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await this.getSubmission(token);

      const statusId = result.status.id;

      // Status IDs:
      // 1: In Queue
      // 2: Processing
      // 3: Accepted
      // 4: Wrong Answer
      // 5: Time Limit Exceeded
      // 6: Compilation Error
      // 7-14: Various runtime errors

      if (statusId > 2) {
        // Execution completed (success or error)
        return result;
      }

      // Still processing, wait and retry
      console.log(`[Judge0] Polling attempt ${attempt}/${maxAttempts}, status: ${result.status.description}`);
      await this._sleep(interval);
    }

    throw new Error('Execution timeout: Result not available after maximum polling attempts');
  }

  /**
   * Format Judge0 result into standardized format
   * @param {Object} result - Judge0 submission result
   * @param {number} totalTime - Total execution time including API latency
   * @returns {Object} Formatted result
   */
  _formatResult(result, totalTime) {
    const statusId = result.status.id;
    const statusDescription = result.status.description;

    // Successful execution
    if (statusId === 3) {
      return {
        success: true,
        output: (result.stdout || '').trim(),
        error: '',
        executionTime: totalTime,
        cpuTime: result.time ? parseFloat(result.time) * 1000 : 0,
        memory: result.memory || 0,
        status: 'accepted',
        statusDescription,
      };
    }

    // Compilation error
    if (statusId === 6) {
      return {
        success: false,
        output: '',
        error: result.compile_output || 'Compilation error',
        executionTime: totalTime,
        status: 'compilation_error',
        statusDescription,
      };
    }

    // Runtime error
    if (result.stderr) {
      return {
        success: false,
        output: result.stdout || '',
        error: result.stderr.trim(),
        executionTime: totalTime,
        cpuTime: result.time ? parseFloat(result.time) * 1000 : 0,
        memory: result.memory || 0,
        status: 'runtime_error',
        statusDescription,
      };
    }

    // Time limit exceeded
    if (statusId === 5) {
      return {
        success: false,
        output: result.stdout || '',
        error: 'Time Limit Exceeded',
        executionTime: totalTime,
        status: 'timeout',
        statusDescription,
      };
    }

    // Other errors
    return {
      success: false,
      output: result.stdout || '',
      error: result.message || statusDescription,
      executionTime: totalTime,
      status: 'error',
      statusDescription,
    };
  }

  /**
   * Handle API errors
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  _handleError(error) {
    if (error.response) {
      // API responded with error
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        return new Error('Judge0 API authentication failed. Check API key.');
      }
      if (status === 429) {
        return new Error('Judge0 API rate limit exceeded. Please try again later.');
      }
      if (status === 503) {
        return new Error('Judge0 service unavailable. Please try again later.');
      }

      return new Error(data.message || `Judge0 API error: ${status}`);
    }

    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout. Please try again.');
    }

    return error;
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new Judge0Client();
