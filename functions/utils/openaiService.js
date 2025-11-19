/**
 * OpenAI API Integration
 *
 * Production AI service using OpenAI GPT-4 for interview conversations
 */

const functions = require('firebase-functions');
const { logger } = require('./monitoring');

// Lazy load OpenAI to reduce cold start time
let openai = null;

/**
 * Get OpenAI client (lazy initialization)
 */
function getOpenAIClient() {
  if (!openai) {
    const { Configuration, OpenAIApi } = require('openai');

    const apiKey = functions.config().openai?.apikey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const configuration = new Configuration({
      apiKey,
    });

    openai = new OpenAIApi(configuration);

    logger.info('OpenAI client initialized');
  }

  return openai;
}

/**
 * System prompt for AI interviewer
 */
const INTERVIEWER_SYSTEM_PROMPT = `You are an experienced technical interviewer conducting a coding interview.

Your role:
- Help candidates understand the problem without giving away the solution
- Provide hints when asked, but encourage independent thinking
- Offer encouragement and constructive feedback
- Analyze code for correctness, efficiency, and best practices
- Discuss time and space complexity when relevant
- Be professional, supportive, and patient

Guidelines:
- Don't write complete solutions unless explicitly asked for the answer
- Start with clarifying questions about the problem
- Give progressively more specific hints
- Praise good approaches and gently redirect poor ones
- Use analogies and examples to explain concepts
- Keep responses concise (2-3 sentences usually)
- Be encouraging but honest about mistakes

Remember: Your goal is to help the candidate learn and succeed, not to stump them.`;

/**
 * Generate AI response using OpenAI GPT-4
 *
 * @param {Object} params - Request parameters
 * @param {string} params.userMessage - User's message
 * @param {string} params.code - Current code
 * @param {string} params.problemTitle - Problem title
 * @param {string} params.problemDescription - Problem description
 * @param {Array} params.chatHistory - Previous conversation
 * @param {string} params.phase - Interview phase (start, coding, testing, complete)
 * @returns {Promise<string>} AI response
 */
async function generateAIResponse({
  userMessage,
  code = '',
  problemTitle = '',
  problemDescription = '',
  chatHistory = [],
  phase = 'coding',
}) {
  try {
    const client = getOpenAIClient();

    // Build context for GPT-4
    const context = buildContext({
      problemTitle,
      problemDescription,
      code,
      phase,
    });

    // Build conversation history
    const messages = [
      { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
      { role: 'system', content: context },
    ];

    // Add chat history (last 10 messages to stay within token limits)
    const recentHistory = chatHistory.slice(-10);
    recentHistory.forEach((msg) => {
      messages.push({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content,
      });
    });

    // Add current message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    logger.debug('Sending request to OpenAI', {
      messageCount: messages.length,
      phase,
      codeLength: code.length,
    });

    // Call OpenAI API
    const response = await client.createChatCompletion({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0.3,
      presence_penalty: 0.3,
    });

    const aiResponse = response.data.choices[0].message.content.trim();

    logger.info('OpenAI response generated', {
      responseLength: aiResponse.length,
      tokensUsed: response.data.usage.total_tokens,
    });

    return aiResponse;
  } catch (error) {
    logger.error('OpenAI API error', {
      error: error.message,
      code: error.response?.status,
    });

    // Handle specific errors
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    if (error.response?.status === 401) {
      throw new Error('OpenAI API authentication failed. Please contact support.');
    }

    throw new Error('Failed to generate AI response. Please try again.');
  }
}

/**
 * Build context string for OpenAI
 */
function buildContext({ problemTitle, problemDescription, code, phase }) {
  let context = `Current Interview Context:\n`;
  context += `Problem: ${problemTitle}\n`;
  context += `Description: ${problemDescription}\n`;
  context += `Interview Phase: ${phase}\n`;

  if (code && code.trim().length > 0) {
    context += `\nCandidate's Current Code:\n\`\`\`\n${code}\n\`\`\`\n`;
  } else {
    context += `\nCandidate hasn't written any code yet.\n`;
  }

  return context;
}

/**
 * Generate interview feedback using GPT-4
 *
 * @param {Object} params - Feedback parameters
 * @param {string} params.code - Final code
 * @param {string} params.problemTitle - Problem title
 * @param {string} params.problemDescription - Problem description
 * @param {Object} params.testResults - Test results
 * @param {Array} params.chatHistory - Conversation history
 * @param {number} params.durationMinutes - Interview duration
 * @returns {Promise<Object>} Structured feedback
 */
async function generateFeedback({
  code,
  problemTitle,
  problemDescription,
  testResults,
  chatHistory = [],
  durationMinutes = 0,
}) {
  try {
    const client = getOpenAIClient();

    const feedbackPrompt = `Analyze this coding interview performance and provide structured feedback.

Problem: ${problemTitle}
${problemDescription}

Final Code:
\`\`\`
${code}
\`\`\`

Test Results: ${testResults.passed}/${testResults.total} tests passed
Duration: ${durationMinutes} minutes
Questions Asked: ${chatHistory.length}

Provide feedback in this exact JSON format:
{
  "score": <number 0-100>,
  "overall": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "complexity": {
    "time": "<Big O time complexity>",
    "space": "<Big O space complexity>"
  }
}

Be constructive, specific, and encouraging. Focus on both what went well and areas for growth.`;

    const response = await client.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert technical interviewer providing feedback.' },
        { role: 'user', content: feedbackPrompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const feedbackText = response.data.choices[0].message.content.trim();

    logger.info('OpenAI feedback generated', {
      tokensUsed: response.data.usage.total_tokens,
    });

    // Parse JSON response
    try {
      const feedback = JSON.parse(feedbackText);
      return feedback;
    } catch (parseError) {
      logger.error('Failed to parse feedback JSON', { feedbackText });

      // Return fallback feedback
      return {
        score: testResults.passed === testResults.total ? 85 : 60,
        overall: 'Good effort on the problem. Review the feedback for areas to improve.',
        strengths: [
          'Attempted to solve the problem',
          'Engaged with the interviewer',
          'Used appropriate coding practices',
        ],
        improvements: [
          'Consider edge cases more carefully',
          'Optimize time complexity',
          'Add more comments for clarity',
        ],
        complexity: {
          time: 'O(n)',
          space: 'O(1)',
        },
      };
    }
  } catch (error) {
    logger.error('OpenAI feedback generation error', {
      error: error.message,
    });

    // Return fallback feedback
    return {
      score: testResults.passed === testResults.total ? 80 : 55,
      overall: 'Unable to generate detailed feedback at this time. Great job attempting the problem!',
      strengths: [
        'Completed the interview session',
        'Engaged with the problem',
        'Wrote functional code',
      ],
      improvements: [
        'Consider time and space complexity',
        'Handle edge cases',
        'Practice more problems',
      ],
      complexity: {
        time: 'O(n)',
        space: 'O(1)',
      },
    };
  }
}

/**
 * Generate hint for problem
 *
 * @param {Object} params - Hint parameters
 * @param {string} params.problemDescription - Problem description
 * @param {string} params.code - Current code
 * @param {number} params.hintLevel - Hint level (1-3, increasing specificity)
 * @returns {Promise<string>} Hint text
 */
async function generateHint({ problemDescription, code = '', hintLevel = 1 }) {
  try {
    const client = getOpenAIClient();

    const hintPrompts = {
      1: 'Provide a high-level hint about the approach to solve this problem. Be vague and encouraging.',
      2: 'Provide a more specific hint about the data structure or algorithm to use.',
      3: 'Provide a detailed hint that almost gives away the solution, but still requires the candidate to implement it.',
    };

    const prompt = `${hintPrompts[hintLevel]}

Problem: ${problemDescription}

${code ? `Current Code:\n\`\`\`\n${code}\n\`\`\`\n` : ''}

Provide a helpful hint in 2-3 sentences.`;

    const response = await client.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful coding interview assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const hint = response.data.choices[0].message.content.trim();

    logger.info('Hint generated', { hintLevel, tokensUsed: response.data.usage.total_tokens });

    return hint;
  } catch (error) {
    logger.error('Hint generation error', { error: error.message });
    throw new Error('Failed to generate hint');
  }
}

/**
 * Check if OpenAI is configured
 */
function isOpenAIConfigured() {
  try {
    const apiKey = functions.config().openai?.apikey || process.env.OPENAI_API_KEY;
    return !!apiKey;
  } catch (error) {
    return false;
  }
}

/**
 * Get token usage estimate
 */
function estimateTokens(text) {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

module.exports = {
  generateAIResponse,
  generateFeedback,
  generateHint,
  isOpenAIConfigured,
  estimateTokens,
  INTERVIEWER_SYSTEM_PROMPT,
};
