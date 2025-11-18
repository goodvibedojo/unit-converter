/**
 * Conversation Manager
 *
 * Handles conversation history compression and optimization
 * to reduce token usage while maintaining context.
 */

export class ConversationManager {
  constructor(maxTokens = 4000) {
    this.maxTokens = maxTokens;
    this.conversationHistory = [];
  }

  /**
   * Add a message to the conversation
   */
  addMessage(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: Date.now(),
      tokens: this.estimateTokens(content)
    });
  }

  /**
   * Get optimized conversation history for API call
   * Compresses history to fit within token limits
   */
  getOptimizedHistory(systemPrompts = []) {
    const systemTokens = systemPrompts.reduce(
      (sum, prompt) => sum + this.estimateTokens(prompt.content),
      0
    );

    const availableTokens = this.maxTokens - systemTokens - 500; // Reserve 500 for response

    return this.compressHistory(availableTokens);
  }

  /**
   * Compress conversation history using multiple strategies
   */
  compressHistory(maxTokens) {
    // Strategy 1: Keep recent messages (most relevant)
    let compressed = this.keepRecentMessages(maxTokens);

    // If still too large, use more aggressive compression
    if (this.getTotalTokens(compressed) > maxTokens) {
      compressed = this.summarizeOlderMessages(compressed, maxTokens);
    }

    return compressed;
  }

  /**
   * Keep most recent messages that fit within token limit
   */
  keepRecentMessages(maxTokens) {
    const result = [];
    let totalTokens = 0;

    // Iterate from most recent to oldest
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      const message = this.conversationHistory[i];
      const newTotal = totalTokens + message.tokens;

      if (newTotal > maxTokens) {
        break;
      }

      result.unshift(message);
      totalTokens = newTotal;
    }

    return result;
  }

  /**
   * Summarize older messages to save tokens
   * Keep recent ~10 messages verbatim, summarize the rest
   */
  summarizeOlderMessages(messages, maxTokens) {
    if (messages.length <= 10) {
      return messages;
    }

    // Keep last 10 messages
    const recentMessages = messages.slice(-10);
    const olderMessages = messages.slice(0, -10);

    // Create summary of older messages
    const summary = this.createSummary(olderMessages);
    const summaryMessage = {
      role: 'system',
      content: `[Earlier conversation summary: ${summary}]`,
      timestamp: olderMessages[0].timestamp,
      tokens: this.estimateTokens(summary)
    };

    return [summaryMessage, ...recentMessages];
  }

  /**
   * Create a brief summary of messages
   */
  createSummary(messages) {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    const topics = this.extractTopics(userMessages);
    const keyPoints = this.extractKeyPoints(assistantMessages);

    return `The candidate asked ${userMessages.length} questions about: ${topics.join(', ')}. Key discussion points: ${keyPoints.join(', ')}.`;
  }

  /**
   * Extract main topics from user messages
   */
  extractTopics(messages) {
    const topics = new Set();
    const keywords = [
      'clarification', 'edge case', 'constraint', 'complexity',
      'optimization', 'approach', 'algorithm', 'data structure',
      'test', 'debug', 'error', 'hint'
    ];

    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          topics.add(keyword);
        }
      });
    });

    return Array.from(topics).slice(0, 5);
  }

  /**
   * Extract key points from assistant messages
   */
  extractKeyPoints(messages) {
    const points = [];

    messages.forEach(msg => {
      const content = msg.content;

      // Extract sentences with hints
      if (content.includes('hint')) {
        points.push('provided hints');
      }

      // Extract complexity discussions
      if (content.includes('O(') || content.includes('complexity')) {
        points.push('discussed complexity');
      }

      // Extract encouragement
      if (content.includes('good') || content.includes('great') || content.includes('excellent')) {
        points.push('encouraged approach');
      }
    });

    return [...new Set(points)].slice(0, 3);
  }

  /**
   * Get total tokens in a message list
   */
  getTotalTokens(messages) {
    return messages.reduce((sum, msg) => sum + msg.tokens, 0);
  }

  /**
   * Estimate tokens in text (rough heuristic)
   * More accurate: use tiktoken library
   * Heuristic: ~4 characters per token on average
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get conversation summary
   */
  getSummary() {
    return {
      totalMessages: this.conversationHistory.length,
      totalTokens: this.getTotalTokens(this.conversationHistory),
      userMessages: this.conversationHistory.filter(m => m.role === 'user').length,
      assistantMessages: this.conversationHistory.filter(m => m.role === 'assistant').length,
      duration: this.conversationHistory.length > 0
        ? this.conversationHistory[this.conversationHistory.length - 1].timestamp - this.conversationHistory[0].timestamp
        : 0
    };
  }

  /**
   * Reset conversation
   */
  reset() {
    this.conversationHistory = [];
  }

  /**
   * Export conversation for storage
   */
  export() {
    return {
      history: this.conversationHistory,
      summary: this.getSummary()
    };
  }

  /**
   * Import conversation from storage
   */
  import(data) {
    if (data && data.history) {
      this.conversationHistory = data.history;
    }
  }
}

/**
 * Cost Calculator for OpenAI API usage
 */
export class CostCalculator {
  constructor() {
    // Pricing as of 2024 (per 1K tokens)
    this.pricing = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
    };

    this.usageHistory = [];
  }

  /**
   * Calculate cost for a single API call
   */
  calculateCost(inputTokens, outputTokens, model = 'gpt-4') {
    const rates = this.pricing[model] || this.pricing['gpt-4'];

    const inputCost = (inputTokens / 1000) * rates.input;
    const outputCost = (outputTokens / 1000) * rates.output;
    const totalCost = inputCost + outputCost;

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost: Number(inputCost.toFixed(6)),
      outputCost: Number(outputCost.toFixed(6)),
      totalCost: Number(totalCost.toFixed(6)),
      model,
      timestamp: Date.now()
    };
  }

  /**
   * Track API usage
   */
  trackUsage(usage) {
    this.usageHistory.push(usage);
  }

  /**
   * Get usage summary
   */
  getSummary() {
    const total = this.usageHistory.reduce((acc, usage) => ({
      totalCalls: acc.totalCalls + 1,
      totalTokens: acc.totalTokens + usage.totalTokens,
      totalCost: acc.totalCost + usage.totalCost
    }), { totalCalls: 0, totalTokens: 0, totalCost: 0 });

    return {
      ...total,
      totalCost: Number(total.totalCost.toFixed(6)),
      averageCostPerCall: total.totalCalls > 0
        ? Number((total.totalCost / total.totalCalls).toFixed(6))
        : 0,
      averageTokensPerCall: total.totalCalls > 0
        ? Math.round(total.totalTokens / total.totalCalls)
        : 0
    };
  }

  /**
   * Get usage by model
   */
  getUsageByModel() {
    const byModel = {};

    this.usageHistory.forEach(usage => {
      if (!byModel[usage.model]) {
        byModel[usage.model] = {
          calls: 0,
          tokens: 0,
          cost: 0
        };
      }

      byModel[usage.model].calls++;
      byModel[usage.model].tokens += usage.totalTokens;
      byModel[usage.model].cost += usage.totalCost;
    });

    // Format costs
    Object.keys(byModel).forEach(model => {
      byModel[model].cost = Number(byModel[model].cost.toFixed(6));
    });

    return byModel;
  }

  /**
   * Estimate cost for a session
   */
  estimateSessionCost(averageMessagesPerSession = 20, model = 'gpt-4') {
    const estimatedTokensPerMessage = 200; // input + output
    const totalTokens = averageMessagesPerSession * estimatedTokensPerMessage;

    const cost = this.calculateCost(
      totalTokens * 0.6, // 60% input
      totalTokens * 0.4, // 40% output
      model
    );

    return cost;
  }

  /**
   * Reset usage tracking
   */
  reset() {
    this.usageHistory = [];
  }
}

export default {
  ConversationManager,
  CostCalculator
};
