/**
 * Mock AI Service for Development
 *
 * Provides realistic AI responses without calling OpenAI API
 * Used in development/testing to save costs and improve speed
 */

/**
 * Interview phase states
 */
const PHASES = {
  START: 'start',
  INTRO: 'intro',
  CLARIFICATION: 'clarification',
  CODING: 'coding',
  HINTS: 'hints',
  TESTING: 'testing',
  COMPLEXITY: 'complexity',
  FEEDBACK: 'feedback',
};

/**
 * Generate mock AI response based on context
 *
 * @param {Object} params
 * @param {string} params.userMessage - User's message
 * @param {string} params.code - Current code
 * @param {string} params.problemTitle - Problem title
 * @param {string} params.phase - Current interview phase
 * @param {Array} params.chatHistory - Previous messages
 * @returns {string} AI response
 */
const generateMockResponse = ({
  userMessage,
  code = '',
  problemTitle = 'Two Sum',
  phase = PHASES.START,
  chatHistory = [],
}) => {
  const lowerMessage = userMessage.toLowerCase();

  // Phase-specific responses
  if (phase === PHASES.START || chatHistory.length === 0) {
    return getIntroResponse(problemTitle);
  }

  // Detect user intent
  if (isGreeting(lowerMessage)) {
    return getGreetingResponse();
  }

  if (isClarificationQuestion(lowerMessage)) {
    return getClarificationResponse(lowerMessage, problemTitle);
  }

  if (isAskingForHint(lowerMessage)) {
    return getHintResponse(problemTitle, code);
  }

  if (isAskingAboutComplexity(lowerMessage)) {
    return getComplexityResponse(problemTitle);
  }

  if (isAskingForFeedback(lowerMessage)) {
    return getFeedbackResponse(code, problemTitle);
  }

  if (isStuck(lowerMessage)) {
    return getEncouragementResponse();
  }

  // Default conversational response
  return getDefaultResponse(lowerMessage);
};

/**
 * Check if message is a greeting
 */
const isGreeting = (message) => {
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon'];
  return greetings.some((greeting) => message.includes(greeting));
};

/**
 * Check if message is a clarification question
 */
const isClarificationQuestion = (message) => {
  const clarificationWords = [
    'can you explain',
    'what does',
    'what is',
    'how do',
    'clarify',
    'understand',
    'mean',
    'example',
  ];
  return clarificationWords.some((word) => message.includes(word));
};

/**
 * Check if user is asking for hint
 */
const isAskingForHint = (message) => {
  const hintWords = ['hint', 'help', 'stuck', 'don\'t know how'];
  return hintWords.some((word) => message.includes(word));
};

/**
 * Check if user is asking about complexity
 */
const isAskingAboutComplexity = (message) => {
  const complexityWords = ['time complexity', 'space complexity', 'big o', 'runtime', 'efficiency'];
  return complexityWords.some((word) => message.includes(word));
};

/**
 * Check if user is asking for feedback
 */
const isAskingForFeedback = (message) => {
  const feedbackWords = ['feedback', 'how did i do', 'review', 'what do you think'];
  return feedbackWords.some((word) => message.includes(word));
};

/**
 * Check if user is stuck
 */
const isStuck = (message) => {
  const stuckWords = ['stuck', 'confused', 'lost', 'not sure'];
  return stuckWords.some((word) => message.includes(word));
};

/**
 * Generate introduction response
 */
const getIntroResponse = (problemTitle) => {
  return `Hi! I'm your AI interviewer. Today we'll be working on the "${problemTitle}" problem.

Let me give you a brief overview: This is a classic coding problem that tests your understanding of data structures and algorithms.

Before we dive in, do you have any clarifying questions about the problem statement? Feel free to ask about edge cases, constraints, or anything that's unclear.

When you're ready, you can start coding. I'll be here to help if you get stuck!`;
};

/**
 * Generate greeting response
 */
const getGreetingResponse = () => {
  const responses = [
    'Hello! Ready to tackle this problem? Let me know if you have any questions!',
    'Hi there! How are you doing with the problem so far?',
    'Hey! Feel free to ask me anything about the problem or your approach.',
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

/**
 * Generate clarification response
 */
const getClarificationResponse = (message, problemTitle) => {
  if (message.includes('input') || message.includes('output')) {
    return `Great question! For the ${problemTitle} problem:
- The input will be an array of integers and a target value
- The output should be the indices of two numbers that add up to the target
- You can assume there's exactly one solution
- The same element cannot be used twice

Does that help clarify things?`;
  }

  if (message.includes('edge case')) {
    return `Good thinking about edge cases! Here are some to consider:
- What if the array is empty? (We can assume it won't be)
- What if there are duplicate numbers? (That's allowed)
- What if multiple pairs sum to the target? (Return any one valid pair)
- What about negative numbers? (They're allowed in the input)`;
  }

  return `That's a good clarification question! In a real interview, asking questions shows you're thinking critically about the problem. For this specific problem, you can assume standard constraints - no null inputs, and there's always exactly one valid solution.`;
};

/**
 * Generate hint response
 */
const getHintResponse = (problemTitle, code) => {
  if (code.length < 50) {
    return `I see you're just getting started. Here's a hint: Think about what data structure would allow you to quickly check if you've seen a number before.

The brute force approach would be to check every pair of numbers, but that would be O(n²). Can you think of a way to do it in O(n) time?

Start by considering: for each number, what would you need to add to it to get the target?`;
  }

  return `You're making progress! Here's a hint: A hash map (or dictionary) can help you keep track of numbers you've already seen. As you iterate through the array, for each number, you can check if its complement (target - current number) exists in the hash map.

Try this approach:
1. Create an empty hash map
2. For each number and its index
3. Calculate the complement (target - number)
4. Check if complement exists in the hash map
5. If yes, return the indices
6. If no, add the current number to the hash map

Give it a try!`;
};

/**
 * Generate complexity analysis response
 */
const getComplexityResponse = (problemTitle) => {
  return `Great question about complexity! Let's analyze the optimal solution:

**Time Complexity: O(n)**
- We iterate through the array once
- Hash map lookups are O(1) on average
- So overall: O(n)

**Space Complexity: O(n)**
- In the worst case, we might store all n elements in the hash map
- So space complexity is O(n)

This is much better than the brute force O(n²) approach!

Can you explain why we need O(n) space? What are we storing?`;
};

/**
 * Generate feedback response
 */
const getFeedbackResponse = (code, problemTitle) => {
  if (code.length < 100) {
    return `I can see you've started working on the solution. Before I give detailed feedback, I'd like to see you make more progress. Try to implement the core logic first, then we can discuss your approach!`;
  }

  const hasHashMap = code.includes('{}') || code.includes('dict') || code.includes('Map');
  const hasLoop = code.includes('for') || code.includes('while');

  if (hasHashMap && hasLoop) {
    return `Nice work! I can see you're using a hash map approach, which is the optimal solution. Here's my feedback:

**Strengths:**
✓ You're using the right data structure (hash map)
✓ Your approach has good time complexity

**Suggestions for improvement:**
- Make sure to handle edge cases
- Consider adding comments to explain your logic
- Test with a few examples to ensure correctness

Would you like to walk me through your solution?`;
  }

  return `I can see your solution is taking shape. A few thoughts:

**What's working:**
- You have the basic structure in place
- Your logic flow is on the right track

**Areas to improve:**
- Consider using a hash map for O(n) time complexity
- Make sure you're returning the correct format (indices, not values)
- Think about edge cases

Keep going! You're on the right path.`;
};

/**
 * Generate encouragement response
 */
const getEncouragementResponse = () => {
  const responses = [
    `Don't worry, it's completely normal to feel stuck! Let's break this down step by step. What specific part is confusing you?`,
    `Take a deep breath! This is a solvable problem. Would you like me to give you a hint, or would you prefer to think about it a bit more?`,
    `Being stuck is part of the process! In real interviews, it's okay to ask for help. Would you like me to guide you through the approach?`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

/**
 * Generate default conversational response
 */
const getDefaultResponse = (message) => {
  return `I understand. ${message.includes('?') ? 'That\'s a good question!' : ''} In a technical interview, it's important to think out loud and communicate your thought process.

What approach are you considering for this problem? Feel free to share your ideas, even if you're not sure they're correct. We can work through them together!`;
};

/**
 * Generate final feedback for completed session
 *
 * @param {Object} params
 * @param {string} params.code - Final code
 * @param {Object} params.testResults - Test results
 * @param {number} params.duration - Session duration in minutes
 * @returns {Object} Structured feedback
 */
const generateFinalFeedback = ({ code, testResults, duration }) => {
  const passRate = testResults.passed / testResults.total;
  const score = Math.round(passRate * 100);

  let overall = '';
  let strengths = [];
  let improvements = [];

  if (passRate === 1) {
    overall = 'Excellent work! You solved the problem correctly and all test cases passed.';
    strengths = [
      'All test cases passed',
      'Correct implementation',
      'Good problem-solving approach',
    ];
  } else if (passRate >= 0.7) {
    overall = 'Good effort! Most test cases passed, but there are some edge cases to handle.';
    strengths = [
      'Core logic is correct',
      'Good understanding of the problem',
    ];
    improvements = [
      'Review failed test cases for edge cases',
      'Consider boundary conditions',
    ];
  } else {
    overall = 'You\'re on the right track, but the solution needs more work.';
    strengths = [
      'Good attempt at the problem',
    ];
    improvements = [
      'Review the algorithm approach',
      'Test with simple examples first',
      'Consider using a different data structure',
    ];
  }

  // Time-based feedback
  if (duration < 15) {
    strengths.push('Efficient time management');
  } else if (duration > 45) {
    improvements.push('Try to optimize your problem-solving speed');
  }

  // Code quality feedback
  if (code.includes('//') || code.includes('#')) {
    strengths.push('Good code documentation');
  }

  return {
    score,
    overall,
    strengths,
    improvements,
    complexity: {
      time: 'O(n)',
      space: 'O(n)',
    },
  };
};

module.exports = {
  generateMockResponse,
  generateFinalFeedback,
  PHASES,
};
