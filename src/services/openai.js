// OpenAI Service for AI Interviewer
// Enhanced with state machine, prompt templates, and intelligent mock responses
// Note: In production, API calls should go through Firebase Functions to keep API keys secure

import { InterviewStateMachine, InterviewPhase } from './interviewStateMachine.js';
import {
  BASE_SYSTEM_PROMPT,
  PHASE_PROMPTS,
  PromptBuilder,
  RESPONSE_STYLES
} from './promptTemplates.js';
import MockAIEngine from './mockAIEngine.js';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'sk-placeholder';
const USE_MOCK_AI = import.meta.env.VITE_USE_MOCK_AI !== 'false'; // Default to true for development

// Legacy export for backward compatibility
export const INTERVIEWER_SYSTEM_PROMPT = BASE_SYSTEM_PROMPT;

class OpenAIService {
  constructor() {
    this.apiKey = OPENAI_API_KEY;
    this.model = 'gpt-4'; // Can fallback to 'gpt-3.5-turbo' for cost savings
    this.conversationHistory = [];
    this.stateMachine = new InterviewStateMachine();
    this.mockEngine = MockAIEngine;
    this.currentProblem = null;
    this.sessionStartTime = null;
    this.lastCodeSnapshot = '';
    this.lastCodeChangeTime = Date.now();
  }

  // Initialize a new interview session
  initializeInterview(problem) {
    // Reset state
    this.stateMachine.reset();
    this.mockEngine.reset();
    this.currentProblem = problem;
    this.sessionStartTime = Date.now();
    this.lastCodeSnapshot = '';
    this.lastCodeChangeTime = Date.now();

    // Build comprehensive problem description
    const problemDescription = this.formatProblemDescription(problem);

    // Initialize conversation with system prompts
    this.conversationHistory = [
      {
        role: 'system',
        content: BASE_SYSTEM_PROMPT
      },
      {
        role: 'system',
        content: PHASE_PROMPTS[InterviewPhase.INTRO]
      },
      {
        role: 'system',
        content: `Problem to discuss:\n\n${problemDescription}`
      }
    ];

    // Generate intro message
    const introMessage = `Hello! I'm excited to work through this problem with you today. Let me introduce the challenge:

**${problem.title}** (${problem.difficulty})

${problem.description}

**Constraints:**
${problem.constraints}

**Example:**
${problem.examples[0] ? `Input: ${problem.examples[0].input}\nOutput: ${problem.examples[0].output}` : ''}

Take your time to read through this. Do you have any clarifying questions before you begin?`;

    this.conversationHistory.push({
      role: 'assistant',
      content: introMessage
    });

    return introMessage;
  }

  /**
   * Format problem object into a detailed description
   */
  formatProblemDescription(problem) {
    return `Title: ${problem.title}
Difficulty: ${problem.difficulty}
Category: ${problem.category.join(', ')}

Description:
${problem.description}

Constraints:
${problem.constraints}

Examples:
${problem.examples.map((ex, i) => `Example ${i + 1}:
  Input: ${ex.input}
  Output: ${ex.output}
  ${ex.explanation ? `Explanation: ${ex.explanation}` : ''}`).join('\n\n')}`;
  }

  // Send a message to the AI interviewer
  async sendMessage(userMessage, codeContext = null, testResults = null) {
    // Update code tracking
    if (codeContext && codeContext !== this.lastCodeSnapshot) {
      this.lastCodeSnapshot = codeContext;
      this.lastCodeChangeTime = Date.now();
    }

    // Calculate time since last code change
    const timeSinceLastCodeChange = Date.now() - this.lastCodeChangeTime;

    // Update state machine with context
    this.stateMachine.updateState({
      userMessage,
      code: codeContext,
      testResults,
      timeSinceLastCodeChange
    });

    // Get current phase
    const currentPhase = this.stateMachine.getCurrentPhase();

    // Build user message with code context if provided
    const fullMessage = codeContext
      ? `${userMessage}\n\nCurrent code:\n\`\`\`\n${codeContext}\n\`\`\``
      : userMessage;

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: fullMessage
    });

    try {
      let response;

      if (USE_MOCK_AI) {
        // Use intelligent mock AI
        response = this.mockEngine.generateResponse({
          phase: currentPhase,
          userMessage,
          code: codeContext,
          problem: this.currentProblem,
          conversationHistory: this.conversationHistory
        });
      } else {
        // Call real OpenAI API
        response = await this.callOpenAI();
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response
      });

      return response;
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      return "I apologize, but I'm having trouble processing that right now. Could you please rephrase or continue with your solution?";
    }
  }

  /**
   * Generate a hint when user is stuck
   */
  async generateHint(code = null) {
    const timeSinceLastChange = Date.now() - this.lastCodeChangeTime;

    if (USE_MOCK_AI) {
      // Use mock engine
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
      return this.mockEngine.generateHint(this.currentProblem, code, timeSinceLastChange);
    } else {
      // Use real OpenAI with hint-specific prompt
      const hintPrompt = PromptBuilder.buildHintPrompt(
        this.currentProblem,
        code,
        timeSinceLastChange
      );

      this.conversationHistory.push({
        role: 'user',
        content: hintPrompt
      });

      const hint = await this.callOpenAI();

      this.conversationHistory.push({
        role: 'assistant',
        content: hint
      });

      return hint;
    }
  }

  /**
   * Generate comprehensive feedback for completed interview
   */
  async generateFeedback(sessionData) {
    const {
      code,
      testResults,
      chatHistory = this.conversationHistory,
      duration = Date.now() - this.sessionStartTime
    } = sessionData;

    // Transition to feedback phase
    this.stateMachine.endInterview();

    if (USE_MOCK_AI) {
      // Use mock engine with intelligent scoring
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate analysis delay
      return this.mockEngine.generateFeedback({
        code,
        testResults,
        duration,
        problem: this.currentProblem
      });
    } else {
      // Use real OpenAI for comprehensive feedback
      const feedbackPrompt = PromptBuilder.buildFeedbackPrompt({
        problem: this.currentProblem,
        code,
        chatHistory,
        testResults,
        duration
      });

      const response = await this.callOpenAIWithCustomPrompt(feedbackPrompt);

      // Parse structured feedback from response
      // For now, return in expected format
      // TODO: Implement proper parsing of AI response
      return {
        score: 85,
        strengths: [
          'Clear problem understanding',
          'Good communication',
          'Working solution implemented'
        ],
        improvements: [
          'Could optimize time complexity',
          'Consider more edge cases'
        ],
        overallFeedback: response
      };
    }
  }

  /**
   * Real OpenAI API call (for production use)
   * In production, this should go through Firebase Functions to keep API key secure
   */
  async callOpenAI() {
    // Get current phase instructions
    const currentPhase = this.stateMachine.getCurrentPhase();
    const phaseInstructions = this.stateMachine.getPhaseInstructions();

    // Build messages with phase-specific context
    const messages = [
      ...this.conversationHistory,
      {
        role: 'system',
        content: phaseInstructions
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call OpenAI with a custom prompt (for specific tasks like feedback generation)
   */
  async callOpenAIWithCustomPrompt(customPrompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: BASE_SYSTEM_PROMPT },
          { role: 'user', content: customPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Get current interview phase
   */
  getCurrentPhase() {
    return this.stateMachine.getCurrentPhase();
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    return {
      ...this.stateMachine.getSessionStats(),
      sessionDuration: Date.now() - this.sessionStartTime,
      messageCount: this.conversationHistory.length
    };
  }

  /**
   * Manually update test results (triggers phase transitions)
   */
  updateTestResults(testResults) {
    this.stateMachine.updateState({
      testResults,
      code: this.lastCodeSnapshot
    });
  }

  /**
   * Set response style (supportive, professional, challenging)
   */
  setResponseStyle(style) {
    // This could be used to adjust temperature and prompts
    // For future implementation with real OpenAI calls
    this.responseStyle = style;
  }

  // Reset conversation
  reset() {
    this.conversationHistory = [];
    this.stateMachine.reset();
    this.mockEngine.reset();
    this.currentProblem = null;
    this.sessionStartTime = null;
    this.lastCodeSnapshot = '';
    this.lastCodeChangeTime = Date.now();
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }
}

export default new OpenAIService();
export { OpenAIService, InterviewPhase };
