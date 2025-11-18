// Interview State Machine - Controls AI interviewer behavior across interview phases

/**
 * Interview Phases:
 * 1. INTRO - AI introduces problem
 * 2. CLARIFICATION - Candidate asks questions
 * 3. CODING - Candidate writes code
 * 4. STUCK - Candidate appears stuck (no progress for 3+ min)
 * 5. TESTING - Running test cases
 * 6. DEBUGGING - Tests failing, need to debug
 * 7. COMPLEXITY - Discuss time/space complexity
 * 8. OPTIMIZATION - Discuss improvements
 * 9. FEEDBACK - Final feedback and wrap-up
 */

export const InterviewPhase = {
  INTRO: 'INTRO',
  CLARIFICATION: 'CLARIFICATION',
  CODING: 'CODING',
  STUCK: 'STUCK',
  TESTING: 'TESTING',
  DEBUGGING: 'DEBUGGING',
  COMPLEXITY: 'COMPLEXITY',
  OPTIMIZATION: 'OPTIMIZATION',
  FEEDBACK: 'FEEDBACK'
};

export class InterviewStateMachine {
  constructor() {
    this.currentPhase = InterviewPhase.INTRO;
    this.phaseStartTime = Date.now();
    this.codeChangeCount = 0;
    this.lastCodeSnapshot = '';
    this.testRunCount = 0;
    this.passedTests = 0;
    this.totalTests = 0;
  }

  /**
   * Get the current phase
   */
  getCurrentPhase() {
    return this.currentPhase;
  }

  /**
   * Transition to a new phase
   */
  transitionTo(newPhase) {
    console.log(`Interview phase transition: ${this.currentPhase} → ${newPhase}`);
    this.currentPhase = newPhase;
    this.phaseStartTime = Date.now();
  }

  /**
   * Update state based on user actions and decide if phase transition is needed
   */
  updateState(context) {
    const {
      userMessage,
      code,
      testResults,
      timeSinceLastCodeChange
    } = context;

    // Auto-detect phase transitions

    // User asking clarifying questions
    if (this.currentPhase === InterviewPhase.INTRO && userMessage) {
      if (this.isAskingQuestion(userMessage)) {
        this.transitionTo(InterviewPhase.CLARIFICATION);
      }
    }

    // User started coding
    if (code && code !== this.lastCodeSnapshot && code.length > 50) {
      if ([InterviewPhase.INTRO, InterviewPhase.CLARIFICATION].includes(this.currentPhase)) {
        this.transitionTo(InterviewPhase.CODING);
      }
      this.lastCodeSnapshot = code;
      this.codeChangeCount++;
    }

    // User appears stuck (no code changes for 3+ minutes during coding)
    if (this.currentPhase === InterviewPhase.CODING && timeSinceLastCodeChange > 180000) {
      this.transitionTo(InterviewPhase.STUCK);
    }

    // User ran tests
    if (testResults) {
      this.testRunCount++;
      this.passedTests = testResults.passed;
      this.totalTests = testResults.total;

      if (testResults.passed === testResults.total) {
        // All tests passed - move to complexity discussion
        this.transitionTo(InterviewPhase.COMPLEXITY);
      } else {
        // Some tests failed - debugging phase
        this.transitionTo(InterviewPhase.DEBUGGING);
      }
    }

    // Completed complexity discussion - move to optimization
    if (this.currentPhase === InterviewPhase.COMPLEXITY && this.isDiscussingOptimization(userMessage)) {
      this.transitionTo(InterviewPhase.OPTIMIZATION);
    }
  }

  /**
   * Helper: Detect if user is asking a question
   */
  isAskingQuestion(message) {
    const questionIndicators = [
      '?',
      'what if',
      'can i',
      'should i',
      'is it',
      'do i need',
      'clarif',
      'question'
    ];
    const lowerMessage = message.toLowerCase();
    return questionIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Helper: Detect if discussing optimization
   */
  isDiscussingOptimization(message) {
    if (!message) return false;
    const optimizationKeywords = [
      'optimize',
      'better',
      'improve',
      'faster',
      'efficient'
    ];
    const lowerMessage = message.toLowerCase();
    return optimizationKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Get phase-specific system instructions for AI
   */
  getPhaseInstructions() {
    const instructions = {
      [InterviewPhase.INTRO]: `You are in the INTRODUCTION phase.
- Introduce the problem clearly and professionally
- Wait for the candidate to ask clarifying questions or start coding
- Be encouraging and set a positive tone`,

      [InterviewPhase.CLARIFICATION]: `You are in the CLARIFICATION phase.
- Answer the candidate's questions clearly
- Don't give away the solution
- Help them understand constraints, input/output format, and edge cases
- Encourage them to start coding once they're ready`,

      [InterviewPhase.CODING]: `You are in the CODING phase.
- The candidate is actively writing code
- Observe their progress without interrupting
- Only provide guidance if they explicitly ask
- Be encouraging about their approach`,

      [InterviewPhase.STUCK]: `You are in the STUCK phase - the candidate hasn't made progress recently.
- Offer a subtle hint without giving away the solution
- Ask guiding questions like "Have you considered using a hash map?"
- Suggest breaking down the problem into smaller steps
- Be supportive and encouraging`,

      [InterviewPhase.TESTING]: `You are in the TESTING phase.
- The candidate is running tests
- Comment on their testing approach
- Encourage them to test edge cases`,

      [InterviewPhase.DEBUGGING]: `You are in the DEBUGGING phase - tests are failing.
- Help them understand why tests might be failing
- Ask questions to guide them: "What happens when the input is empty?"
- Don't fix the bug for them - guide them to find it
- Be patient and supportive`,

      [InterviewPhase.COMPLEXITY]: `You are in the COMPLEXITY ANALYSIS phase.
- Ask the candidate to analyze time and space complexity
- Verify their analysis
- Discuss if there are more optimal approaches
- Probe their understanding: "Why is it O(n)?"`,

      [InterviewPhase.OPTIMIZATION]: `You are in the OPTIMIZATION phase.
- Discuss potential optimizations
- Ask about edge cases they might have missed
- Explore alternative approaches
- Prepare to wrap up the interview`,

      [InterviewPhase.FEEDBACK]: `You are in the FEEDBACK phase.
- Provide constructive feedback on their performance
- Highlight strengths and areas for improvement
- Be specific and actionable
- End on a positive note`
    };

    return instructions[this.currentPhase] || '';
  }

  /**
   * Manually transition to feedback phase (when interview ends)
   */
  endInterview() {
    this.transitionTo(InterviewPhase.FEEDBACK);
  }

  /**
   * Get statistics about the interview session
   */
  getSessionStats() {
    return {
      currentPhase: this.currentPhase,
      totalDuration: Date.now() - this.phaseStartTime,
      codeChangeCount: this.codeChangeCount,
      testRunCount: this.testRunCount,
      passedTests: this.passedTests,
      totalTests: this.totalTests
    };
  }

  /**
   * Reset the state machine for a new interview
   */
  reset() {
    this.currentPhase = InterviewPhase.INTRO;
    this.phaseStartTime = Date.now();
    this.codeChangeCount = 0;
    this.lastCodeSnapshot = '';
    this.testRunCount = 0;
    this.passedTests = 0;
    this.totalTests = 0;
  }
}

export default new InterviewStateMachine();
