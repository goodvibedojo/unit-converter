// OpenAI Service for AI Interviewer
// Note: In production, API calls should go through Firebase Functions to keep API keys secure

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'sk-placeholder';

// System prompt for the AI interviewer
export const INTERVIEWER_SYSTEM_PROMPT = `You are an experienced FAANG (Facebook/Meta, Amazon, Apple, Netflix, Google) technical interviewer conducting a coding interview.

Your responsibilities:
1. Present coding problems clearly and professionally
2. Answer clarifying questions about the problem
3. Provide hints when the candidate is stuck (but don't give away the solution)
4. Ask about time and space complexity
5. Suggest optimizations and edge cases
6. Give constructive feedback
7. Maintain a professional yet encouraging tone

Interview flow:
- Start by introducing the problem
- Allow the candidate to ask clarifying questions
- Monitor their progress as they code
- Provide hints strategically (after they've been stuck for a while)
- Once they have a working solution, discuss complexity
- Suggest improvements or edge cases they might have missed
- End with constructive feedback

Be realistic but encouraging. Simulate an actual FAANG interview experience.`;

class OpenAIService {
  constructor() {
    this.apiKey = OPENAI_API_KEY;
    this.model = 'gpt-4'; // Can fallback to 'gpt-3.5-turbo' for cost savings
    this.conversationHistory = [];
  }

  // Initialize a new interview session
  initializeInterview(problemDescription) {
    this.conversationHistory = [
      {
        role: 'system',
        content: INTERVIEWER_SYSTEM_PROMPT
      },
      {
        role: 'system',
        content: `Problem to discuss: ${problemDescription}`
      },
      {
        role: 'assistant',
        content: `Hello! I'm ready to begin the interview. Let me present the problem to you.

${problemDescription}

Take a moment to read through this. Do you have any clarifying questions before you begin?`
      }
    ];

    return this.conversationHistory[this.conversationHistory.length - 1].content;
  }

  // Send a message to the AI interviewer
  async sendMessage(userMessage, codeContext = null) {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: codeContext
        ? `${userMessage}\n\nCurrent code:\n\`\`\`python\n${codeContext}\n\`\`\``
        : userMessage
    });

    try {
      // TODO: In production, this should call a Firebase Function to keep API key secure
      // For now, using placeholder response
      const response = await this.mockOpenAICall();

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

  // Mock OpenAI call for development (placeholder)
  async mockOpenAICall() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lastUserMessage = this.conversationHistory[this.conversationHistory.length - 1].content.toLowerCase();

    // Simple rule-based responses for demo
    if (lastUserMessage.includes('clarif') || lastUserMessage.includes('question')) {
      return "Great question! Feel free to ask anything about the problem constraints, expected input/output format, or edge cases you should consider.";
    } else if (lastUserMessage.includes('hint') || lastUserMessage.includes('stuck')) {
      return "Let me give you a hint: Think about what data structure would allow you to look up values efficiently. Have you considered using a hash map or dictionary?";
    } else if (lastUserMessage.includes('complexity') || lastUserMessage.includes('time')) {
      return "Good thinking! What do you think the time and space complexity of your solution is? Can you walk me through your analysis?";
    } else if (lastUserMessage.includes('done') || lastUserMessage.includes('finished')) {
      return "Great! Let me review your solution. The approach looks good. Can you explain your thought process? Also, are there any edge cases we should test?";
    } else {
      return "I see. Keep working through the problem. Remember to think about edge cases and try to optimize your solution. Let me know if you need a hint!";
    }
  }

  // Real OpenAI API call (for production use via Firebase Functions)
  async callOpenAI(messages) {
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

  // Generate feedback for completed interview
  async generateFeedback(code, problemId, chatHistory) {
    // TODO: Implement comprehensive feedback generation
    return {
      score: 85,
      strengths: [
        'Clear problem understanding',
        'Good communication',
        'Working solution implemented'
      ],
      improvements: [
        'Could optimize time complexity',
        'Consider more edge cases',
        'Add input validation'
      ],
      overallFeedback: 'Strong performance! You demonstrated good problem-solving skills and clear communication. Focus on optimization and edge case handling for improvement.'
    };
  }

  // Reset conversation
  reset() {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }
}

export default new OpenAIService();
