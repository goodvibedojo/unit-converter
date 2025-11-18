/**
 * AI Interviewer Cloud Functions
 *
 * These functions handle all OpenAI API calls securely on the server side.
 * API keys are stored in Firebase environment config and never exposed to the client.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { OpenAI } from 'openai';
import { defineSecret } from 'firebase-functions/params';

// Define secret for OpenAI API key
const openaiApiKey = defineSecret('OPENAI_API_KEY');

// Initialize OpenAI client (lazy initialization)
let openaiClient = null;

function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = openaiApiKey.value();
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'OpenAI API key not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * System prompts for different interview phases
 */
const PHASE_PROMPTS = {
  INTRO: `You are introducing a coding problem to the candidate. Be clear, professional, and encouraging.`,
  CLARIFICATION: `The candidate is asking clarifying questions. Answer clearly without revealing the solution.`,
  CODING: `The candidate is coding. Observe without interrupting unless they ask for help.`,
  STUCK: `The candidate appears stuck. Provide encouraging hints without giving away the solution.`,
  TESTING: `The candidate is testing their code. Comment on their testing approach.`,
  DEBUGGING: `Tests are failing. Guide them toward finding the bug themselves.`,
  COMPLEXITY: `Discuss time and space complexity. Verify their analysis and explore optimizations.`,
  OPTIMIZATION: `Explore alternative approaches and edge cases.`,
  FEEDBACK: `Provide comprehensive, constructive feedback on their performance.`
};

/**
 * Initialize Interview Session
 *
 * @param {Object} data - { problem: Object }
 * @returns {Object} - { introMessage: string, sessionId: string }
 */
export const initializeInterview = onCall(
  { secrets: [openaiApiKey] },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { problem } = request.data;

    if (!problem || !problem.title) {
      throw new HttpsError('invalid-argument', 'Problem object is required');
    }

    try {
      const client = getOpenAIClient();

      // Generate introductory message using OpenAI
      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an experienced FAANG technical interviewer. Introduce the following coding problem professionally and encouragingly.

Problem: ${problem.title}
Difficulty: ${problem.difficulty}
Description: ${problem.description}

Introduce the problem, present it clearly, and invite the candidate to ask clarifying questions.`
          },
          {
            role: 'user',
            content: 'Please introduce this problem to me.'
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const introMessage = completion.choices[0].message.content;

      return {
        introMessage,
        usage: {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
          estimatedCost: calculateCost(completion.usage, 'gpt-4')
        }
      };
    } catch (error) {
      console.error('Error initializing interview:', error);
      throw new HttpsError('internal', 'Failed to initialize interview');
    }
  }
);

/**
 * Chat with AI Interviewer
 *
 * @param {Object} data - {
 *   userMessage: string,
 *   conversationHistory: Array,
 *   currentPhase: string,
 *   codeContext: string (optional),
 *   problemContext: Object
 * }
 * @returns {Object} - { response: string, usage: Object }
 */
export const chatWithAI = onCall(
  { secrets: [openaiApiKey], timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const {
      userMessage,
      conversationHistory = [],
      currentPhase = 'CODING',
      codeContext,
      problemContext
    } = request.data;

    if (!userMessage) {
      throw new HttpsError('invalid-argument', 'User message is required');
    }

    try {
      const client = getOpenAIClient();

      // Build messages array
      const messages = [
        {
          role: 'system',
          content: `You are an experienced FAANG technical interviewer conducting a coding interview.

Current Problem: ${problemContext?.title || 'Coding Challenge'}
Interview Phase: ${currentPhase}

${PHASE_PROMPTS[currentPhase] || PHASE_PROMPTS.CODING}

Be professional, encouraging, and realistic. Simulate an actual FAANG interview experience.`
        },
        // Include relevant conversation history (last 10 messages to save tokens)
        ...conversationHistory.slice(-10),
        {
          role: 'user',
          content: codeContext
            ? `${userMessage}\n\nCurrent code:\n\`\`\`\n${codeContext}\n\`\`\``
            : userMessage
        }
      ];

      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0].message.content;

      return {
        response,
        usage: {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
          estimatedCost: calculateCost(completion.usage, 'gpt-4')
        }
      };
    } catch (error) {
      console.error('Error in chatWithAI:', error);
      throw new HttpsError('internal', 'Failed to process message');
    }
  }
);

/**
 * Generate Hint for Stuck Candidate
 *
 * @param {Object} data - {
 *   problem: Object,
 *   currentCode: string,
 *   stuckDuration: number (milliseconds),
 *   conversationHistory: Array
 * }
 * @returns {Object} - { hint: string, usage: Object }
 */
export const generateHint = onCall(
  { secrets: [openaiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const {
      problem,
      currentCode = '',
      stuckDuration = 0,
      conversationHistory = []
    } = request.data;

    if (!problem) {
      throw new HttpsError('invalid-argument', 'Problem is required');
    }

    try {
      const client = getOpenAIClient();
      const stuckMinutes = Math.floor(stuckDuration / 60000);

      const hintPrompt = `The candidate has been stuck for ${stuckMinutes} minutes on the "${problem.title}" problem.

Problem Description:
${problem.description}

Current Code:
\`\`\`
${currentCode || '(no code written yet)'}
\`\`\`

Available Hints:
${problem.hints?.map((h, i) => `${i + 1}. ${h}`).join('\n') || 'No predefined hints'}

Provide an encouraging hint that:
1. Doesn't give away the solution
2. Guides them toward a productive approach
3. Is appropriate for how long they've been stuck (${stuckMinutes} minutes)
4. References their current code if applicable

Make it feel natural, like a real interviewer would say. Keep it under 100 words.`;

      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an experienced FAANG technical interviewer providing helpful hints to stuck candidates.'
          },
          {
            role: 'user',
            content: hintPrompt
          }
        ],
        temperature: 0.8, // Slightly higher for more varied hints
        max_tokens: 200
      });

      const hint = completion.choices[0].message.content;

      return {
        hint,
        usage: {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
          estimatedCost: calculateCost(completion.usage, 'gpt-4')
        }
      };
    } catch (error) {
      console.error('Error generating hint:', error);
      throw new HttpsError('internal', 'Failed to generate hint');
    }
  }
);

/**
 * Generate Comprehensive Interview Feedback
 *
 * @param {Object} data - {
 *   problem: Object,
 *   code: string,
 *   testResults: Object,
 *   conversationHistory: Array,
 *   duration: number (milliseconds)
 * }
 * @returns {Object} - {
 *   score: number,
 *   strengths: string[],
 *   improvements: string[],
 *   overallFeedback: string,
 *   usage: Object
 * }
 */
export const generateFeedback = onCall(
  { secrets: [openaiApiKey], timeoutSeconds: 90 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const {
      problem,
      code,
      testResults = { passed: 0, total: 0 },
      conversationHistory = [],
      duration = 0
    } = request.data;

    if (!problem || !code) {
      throw new HttpsError('invalid-argument', 'Problem and code are required');
    }

    try {
      const client = getOpenAIClient();
      const durationMinutes = Math.floor(duration / 60000);

      const feedbackPrompt = `Generate comprehensive interview feedback for this coding session:

**Problem**: ${problem.title} (${problem.difficulty})
**Duration**: ${durationMinutes} minutes
**Test Results**: ${testResults.passed}/${testResults.total} passed

**Final Code**:
\`\`\`
${code}
\`\`\`

**Conversation Summary**: ${conversationHistory.length} messages exchanged

Analyze the candidate's performance across:
1. **Problem Understanding**: Did they ask good clarifying questions?
2. **Approach**: Was their solution strategy sound?
3. **Implementation**: Code quality, readability, correctness
4. **Testing**: Did they test thoroughly?
5. **Communication**: How well did they explain their thinking?
6. **Complexity Analysis**: Understanding of time/space tradeoffs

Provide your response in this exact JSON format:
{
  "score": <number 0-100>,
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "improvements": [
    "<actionable improvement 1>",
    "<actionable improvement 2>"
  ],
  "overallFeedback": "<2-3 paragraph detailed feedback>",
  "technicalAssessment": {
    "timeComplexity": "<their solution's time complexity>",
    "spaceComplexity": "<their solution's space complexity>",
    "correctness": "<assessment of correctness>",
    "codeQuality": "<assessment of code quality>"
  }
}

Be honest but encouraging. Make feedback specific and actionable.`;

      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an experienced FAANG technical interviewer providing comprehensive feedback. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: feedbackPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const feedbackText = completion.choices[0].message.content;
      let feedback;

      try {
        feedback = JSON.parse(feedbackText);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        console.error('Failed to parse feedback JSON:', parseError);
        feedback = {
          score: 75,
          strengths: ['Attempted the problem', 'Wrote working code', 'Communicated throughout'],
          improvements: ['Focus on edge cases', 'Consider time complexity'],
          overallFeedback: feedbackText
        };
      }

      return {
        ...feedback,
        usage: {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
          estimatedCost: calculateCost(completion.usage, 'gpt-4')
        }
      };
    } catch (error) {
      console.error('Error generating feedback:', error);
      throw new HttpsError('internal', 'Failed to generate feedback');
    }
  }
);

/**
 * Calculate estimated cost for OpenAI API usage
 *
 * Pricing (as of 2024):
 * GPT-4: $0.03/1K prompt tokens, $0.06/1K completion tokens
 * GPT-3.5-Turbo: $0.0005/1K prompt tokens, $0.0015/1K completion tokens
 */
function calculateCost(usage, model = 'gpt-4') {
  const pricing = {
    'gpt-4': { prompt: 0.03, completion: 0.06 },
    'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 }
  };

  const rates = pricing[model] || pricing['gpt-4'];
  const promptCost = (usage.prompt_tokens / 1000) * rates.prompt;
  const completionCost = (usage.completion_tokens / 1000) * rates.completion;

  return {
    promptCost: promptCost.toFixed(6),
    completionCost: completionCost.toFixed(6),
    totalCost: (promptCost + completionCost).toFixed(6),
    currency: 'USD'
  };
}
