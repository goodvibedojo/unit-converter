// Mock AI Engine - Intelligent rule-based responses for development/testing
// This simulates OpenAI responses without API calls, useful for:
// 1. Development without API key
// 2. Testing different conversation flows
// 3. A/B testing prompt strategies
// 4. Cost savings during development

import { InterviewPhase } from './interviewStateMachine.js';
import { FOLLOW_UP_QUESTIONS } from './promptTemplates.js';

/**
 * Response patterns for different user intents
 */
const INTENT_PATTERNS = {
  GREETING: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
  READY: ['ready', "let's start", 'begin', "i'm ready", 'start'],
  QUESTION_ASKING: ['?', 'what if', 'can i', 'should i', 'is it', 'do i need', 'clarif', 'question'],
  HINT_REQUEST: ['hint', 'stuck', 'help', "don't know", 'not sure', 'confused'],
  COMPLEXITY: ['complexity', 'time', 'space', 'big o', 'o(n)', 'efficient'],
  DONE: ['done', 'finished', 'complete', 'solved', 'submit'],
  THINKING_ALOUD: ["i think", "maybe", "let me", "i could", "what about"],
  UNCERTAINTY: ["not sure", "don't know", "confused", "stuck", "help"]
};

/**
 * Detect user's intent from their message
 */
function detectIntent(message) {
  const lowerMessage = message.toLowerCase();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (patterns.some(pattern => lowerMessage.includes(pattern))) {
      return intent;
    }
  }

  return 'GENERAL';
}

/**
 * Mock responses organized by phase and intent
 */
const MOCK_RESPONSES = {
  [InterviewPhase.INTRO]: {
    GREETING: [
      "Hello! Great to meet you. I'm excited to work through this problem with you today.",
      "Hi there! Ready to tackle this coding challenge? I'm here to help guide you through it."
    ],
    READY: [
      "Excellent! Let's dive in. Take your time to read through the problem, and feel free to ask any clarifying questions.",
      "Great! I'll give you a moment to understand the problem. Let me know if anything is unclear."
    ],
    QUESTION_ASKING: [
      "That's a great question to ask! Let me clarify that for you.",
      "Good thinking - clarifying questions show strong problem-solving skills. Here's the answer:"
    ],
    GENERAL: [
      "Take your time to understand the problem. Feel free to ask any clarifying questions before you start coding.",
      "I'm here to help. What questions do you have about the problem?"
    ]
  },

  [InterviewPhase.CLARIFICATION]: {
    QUESTION_ASKING: [
      "Excellent question! Here's what I can tell you: {context}",
      "Great clarification! That shows you're thinking about edge cases.",
      "Good question. To clarify: the input will always be valid, and you can assume the constraints mentioned."
    ],
    READY: [
      "Sounds like you have a good understanding! Go ahead and start coding whenever you're ready.",
      "Great! Feel free to start implementing your solution. I'm here if you need anything."
    ],
    THINKING_ALOUD: [
      "I like your thought process. Go ahead and explore that approach!",
      "That's a reasonable direction. Why don't you try implementing it and see how it goes?"
    ],
    GENERAL: [
      "Do you have any other questions about the problem constraints or expected behavior?",
      "Feel free to ask anything else before you start coding."
    ]
  },

  [InterviewPhase.CODING]: {
    THINKING_ALOUD: [
      "Good thinking! Keep going with that approach.",
      "I like where you're headed. Continue working through it.",
      "That sounds promising. Implement it and see how it works out."
    ],
    HINT_REQUEST: [
      "Let me give you a hint: think about what data structure allows fast lookups. Have you considered using a hash map?",
      "Here's a nudge: can you solve this in a single pass through the array?",
      "Consider this: what information do you need to store as you iterate through the data?"
    ],
    QUESTION_ASKING: [
      "Good question. Yes, you can assume that for this problem.",
      "That's a valid approach. Try it out and see if it passes the tests!"
    ],
    COMPLEXITY: [
      "Good thinking about efficiency! What do you think the time complexity of your current approach would be?",
      "That's an important consideration. How many times will your main loop execute?"
    ],
    GENERAL: [
      "You're making good progress. Keep going!",
      "I'm watching your solution develop. Let me know if you need guidance."
    ]
  },

  [InterviewPhase.STUCK]: {
    HINT_REQUEST: [
      "I can see you're stuck. Let me help: have you thought about using a hash map to store values you've seen?",
      "Here's a hint: try breaking the problem down. What's the first step? Can you iterate through the input?",
      "Let's think about this together. What if you maintained some state as you process each element?"
    ],
    THINKING_ALOUD: [
      "You're on the right track! That data structure could definitely work here.",
      "Good instinct. Try implementing that idea and see where it leads."
    ],
    GENERAL: [
      "Take a step back. Can you describe the problem in your own words?",
      "Sometimes it helps to work through a small example on paper. Try that with the first test case.",
      "What's the brute force solution? Let's start there and optimize later."
    ]
  },

  [InterviewPhase.TESTING]: {
    DONE: [
      "Great! Let's see how your solution performs. Run the tests and we'll review the results together.",
      "Excellent. Go ahead and test your code. Make sure to try some edge cases too!"
    ],
    GENERAL: [
      "Good idea to test! Make sure you're checking edge cases like empty input or very large values.",
      "Testing is crucial. Try running your code with the provided test cases."
    ]
  },

  [InterviewPhase.DEBUGGING]: {
    UNCERTAINTY: [
      "No worries - debugging is a normal part of coding. Let's think through this. What's different about the failing test case?",
      "Let's debug this together. Can you trace through your code with the failing input? What do you expect vs. what's happening?"
    ],
    THINKING_ALOUD: [
      "Good debugging strategy. Walk me through what you're checking.",
      "I like that approach to debugging. What did you find?"
    ],
    GENERAL: [
      "Let's figure out why that test is failing. What's the input for the failing case?",
      "Good debugging! Have you tried printing intermediate values to see where it goes wrong?"
    ]
  },

  [InterviewPhase.COMPLEXITY]: {
    COMPLEXITY: [
      "Good analysis! You're right that it's O(n) time. What about space complexity?",
      "Let me verify that. How many times does your main loop execute? And are there any nested loops?",
      "Correct! Now, can you think of any way to optimize this further, or is this the best we can do?"
    ],
    GENERAL: [
      "Now that your solution works, let's discuss complexity. What do you think the time and space complexity are?",
      "Good work! Can you analyze the efficiency of your solution?"
    ]
  },

  [InterviewPhase.OPTIMIZATION]: {
    GENERAL: [
      "Are there any edge cases you haven't considered yet?",
      "What tradeoffs does your solution make between time and space?",
      "In a production environment, what might be the bottleneck with this approach?"
    ],
    THINKING_ALOUD: [
      "Interesting thought! How would that improve the solution?",
      "That could work. What would be the complexity tradeoff?"
    ]
  },

  [InterviewPhase.FEEDBACK]: {
    GENERAL: [
      "Overall, you did well! Let me give you some specific feedback on your performance.",
      "Great job working through this problem. Here's my assessment of your interview..."
    ]
  }
};

/**
 * Code analysis helpers
 */
function analyzeCode(code) {
  if (!code) return { hasCode: false, length: 0, hasLoops: false, hasFunctions: false };

  return {
    hasCode: code.trim().length > 0,
    length: code.length,
    hasLoops: /for |while /.test(code),
    hasFunctions: /def |function /.test(code),
    hasComments: /#|\/\//.test(code),
    complexity: estimateComplexity(code)
  };
}

function estimateComplexity(code) {
  // Simple heuristic
  const nestedLoops = (code.match(/for.*for|while.*while/g) || []).length;
  const singleLoops = (code.match(/for |while /g) || []).length;

  if (nestedLoops > 0) return 'O(n²) or higher';
  if (singleLoops > 0) return 'O(n)';
  return 'O(1)';
}

/**
 * Main Mock AI Engine
 */
export class MockAIEngine {
  constructor() {
    this.responseHistory = [];
  }

  /**
   * Generate a contextual response based on phase, intent, and code
   */
  generateResponse(context) {
    const {
      phase,
      userMessage,
      code,
      problem,
      conversationHistory = []
    } = context;

    // Detect user intent
    const intent = userMessage ? detectIntent(userMessage) : 'GENERAL';

    // Get phase-specific responses
    const phaseResponses = MOCK_RESPONSES[phase] || MOCK_RESPONSES[InterviewPhase.INTRO];
    const intentResponses = phaseResponses[intent] || phaseResponses['GENERAL'];

    // Pick a random response from available options
    let response = intentResponses[Math.floor(Math.random() * intentResponses.length)];

    // Add context-specific details
    response = this.enrichResponse(response, context, intent);

    // Track response
    this.responseHistory.push({ phase, intent, response, timestamp: Date.now() });

    return response;
  }

  /**
   * Enrich response with context-specific information
   */
  enrichResponse(response, context, intent) {
    const { code, problem, phase } = context;
    const codeAnalysis = analyzeCode(code);

    // Add code-specific feedback in CODING phase
    if (phase === InterviewPhase.CODING && codeAnalysis.hasCode) {
      if (codeAnalysis.hasLoops) {
        response += " I see you're using iteration - that's a good approach for this problem.";
      }
      if (codeAnalysis.length > 200) {
        response += " You're making solid progress on the implementation.";
      }
    }

    // Add problem-specific hints when stuck
    if (phase === InterviewPhase.STUCK && problem?.hints) {
      const hint = problem.hints[0]; // Use first hint
      response += ` Here's something to think about: ${hint}`;
    }

    // Add encouragement based on conversation length
    if (context.conversationHistory?.length > 10) {
      response += " You're doing great - keep up the thoughtful approach!";
    }

    return response;
  }

  /**
   * Generate a hint based on problem and code state
   */
  generateHint(problem, code, stuckDuration) {
    const hints = problem.hints || [];
    const minutesStuck = Math.floor(stuckDuration / 60000);

    // Progressive hints - give more specific hints the longer they're stuck
    let hintIndex = 0;
    if (minutesStuck > 5) hintIndex = Math.min(hints.length - 1, 2);
    else if (minutesStuck > 3) hintIndex = Math.min(hints.length - 1, 1);

    const hint = hints[hintIndex] || "Think about what data structure would help you solve this efficiently.";

    const responses = [
      `I can see you've been working on this for ${minutesStuck} minutes. ${hint}`,
      `Let me give you a hint: ${hint}. Does that help?`,
      `Here's something to consider: ${hint}. Try exploring that direction.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate feedback based on session data
   */
  generateFeedback(sessionData) {
    const { code, testResults, duration, problem } = sessionData;
    const codeAnalysis = analyzeCode(code);
    const durationMinutes = Math.floor(duration / 60000);

    // Calculate score based on multiple factors
    let score = 0;

    // Test results (40 points)
    if (testResults) {
      score += (testResults.passed / testResults.total) * 40;
    }

    // Code quality (30 points)
    if (codeAnalysis.hasCode) score += 10;
    if (codeAnalysis.hasFunctions) score += 10;
    if (codeAnalysis.hasComments) score += 5;
    if (codeAnalysis.length > 100) score += 5;

    // Time efficiency (30 points)
    const expectedTime = problem.difficulty === 'easy' ? 20 : problem.difficulty === 'medium' ? 35 : 50;
    if (durationMinutes <= expectedTime) score += 30;
    else if (durationMinutes <= expectedTime * 1.5) score += 20;
    else score += 10;

    score = Math.min(100, Math.round(score));

    // Generate strengths and improvements
    const strengths = [];
    const improvements = [];

    if (testResults?.passed === testResults?.total) {
      strengths.push('Successfully implemented a working solution that passes all test cases');
    } else {
      improvements.push('Work on handling edge cases - some test cases failed');
    }

    if (durationMinutes <= expectedTime) {
      strengths.push(`Solved the problem efficiently in ${durationMinutes} minutes`);
    } else {
      improvements.push('Practice solving similar problems to improve speed');
    }

    if (codeAnalysis.hasComments) {
      strengths.push('Good code documentation with comments');
    }

    strengths.push('Clear communication and thoughtful approach to problem-solving');

    if (codeAnalysis.complexity === 'O(n²) or higher') {
      improvements.push('Consider optimizing your solution - the current time complexity could be improved');
    }

    if (!codeAnalysis.hasFunctions && code.length > 100) {
      improvements.push('Consider breaking your code into smaller, reusable functions');
    }

    const overallFeedback = `You demonstrated ${score >= 80 ? 'strong' : score >= 60 ? 'good' : 'solid'} problem-solving skills in this interview. ${
      testResults?.passed === testResults?.total
        ? 'Your solution correctly handles all test cases, which shows good attention to detail.'
        : 'While your approach was sound, some edge cases need more attention.'
    } ${
      durationMinutes <= expectedTime
        ? 'Your time management was excellent.'
        : 'With more practice, you can improve your speed on similar problems.'
    } Overall, this was a ${score >= 80 ? 'very strong' : score >= 60 ? 'good' : 'respectable'} performance. Keep practicing and you'll continue to improve!`;

    return {
      score,
      strengths: strengths.slice(0, 4),
      improvements: improvements.slice(0, 3),
      overallFeedback
    };
  }

  /**
   * Reset the engine
   */
  reset() {
    this.responseHistory = [];
  }
}

export default new MockAIEngine();
