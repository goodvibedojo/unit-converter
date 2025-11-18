/**
 * Cloud Function: startSession
 *
 * Type: HTTP Callable
 * Purpose: Initialize a new interview session
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { validateDifficulty, validateLanguage } = require('../utils/validators');

exports.startSession = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to start a session'
      );
    }

    const userId = context.auth.uid;
    const { difficulty = 'easy', language = 'python', category } = data;

    // Validate inputs
    if (!validateDifficulty(difficulty)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid difficulty. Must be: easy, medium, or hard'
      );
    }

    if (!validateLanguage(language)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid language. Must be: python, javascript, java, or cpp'
      );
    }

    const db = admin.firestore();

    // Check user subscription status
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found');
    }

    const userData = userDoc.data();
    const subscriptionStatus = userData.subscriptionStatus || 'trial';
    const trialSessionsUsed = userData.trialSessionsUsed || 0;
    const trialSessionsTotal = userData.trialSessionsTotal || 3;

    // Check if user has access
    if (subscriptionStatus === 'trial' && trialSessionsUsed >= trialSessionsTotal) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Trial sessions exhausted. Please subscribe to continue.'
      );
    }

    if (subscriptionStatus === 'inactive') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Active subscription required. Please subscribe to continue.'
      );
    }

    // Get a random problem based on difficulty and category
    let problemQuery = db.collection('problems').where('difficulty', '==', difficulty);

    if (category) {
      problemQuery = problemQuery.where('category', 'array-contains', category);
    }

    const problemsSnapshot = await problemQuery.get();

    if (problemsSnapshot.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'No problems found matching the criteria'
      );
    }

    // Select random problem
    const problems = problemsSnapshot.docs;
    const randomProblem = problems[Math.floor(Math.random() * problems.length)];
    const problemData = randomProblem.data();
    const problemId = randomProblem.id;

    // Create new session
    const sessionRef = db.collection('sessions').doc();
    const sessionId = sessionRef.id;

    const session = {
      id: sessionId,
      userId,
      problemId,
      language,
      startTime: admin.firestore.FieldValue.serverTimestamp(),
      endTime: null,
      duration: null,
      status: 'active',
      code: problemData.starterCode[language] || '',
      codeHistory: [],
      chatHistory: [
        {
          role: 'ai',
          content: `Hi! I'm your AI interviewer. Today we'll be working on the "${problemData.title}" problem. This is a ${difficulty} level problem. Take a moment to read through the problem description, and let me know when you're ready to start or if you have any clarifying questions!`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          audioUrl: null,
        },
      ],
      testResults: {
        passed: 0,
        total: problemData.testCases?.length || 0,
        details: [],
      },
      aiScore: null,
      aiFeedback: null,
      metadata: {
        ipAddress: context.rawRequest?.ip || 'unknown',
        userAgent: context.rawRequest?.headers['user-agent'] || 'unknown',
      },
    };

    await sessionRef.set(session);

    // Update user stats
    const updateData = {
      'stats.totalSessions': admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Increment trial sessions if on trial
    if (subscriptionStatus === 'trial') {
      updateData.trialSessionsUsed = admin.firestore.FieldValue.increment(1);
    }

    await userRef.update(updateData);

    console.log('Session started:', sessionId, 'for user:', userId);

    // Return session data and problem (without hidden test cases)
    const publicProblem = {
      id: problemId,
      title: problemData.title,
      difficulty: problemData.difficulty,
      category: problemData.category,
      description: problemData.description,
      constraints: problemData.constraints,
      examples: problemData.examples,
      hints: problemData.hints,
      starterCode: problemData.starterCode,
      testCases: problemData.testCases?.filter((tc) => !tc.isHidden) || [],
    };

    return {
      success: true,
      session: {
        id: sessionId,
        problemId,
        language,
        code: session.code,
      },
      problem: publicProblem,
      trialInfo:
        subscriptionStatus === 'trial'
          ? {
              sessionsUsed: trialSessionsUsed + 1,
              sessionsTotal: trialSessionsTotal,
              sessionsRemaining: trialSessionsTotal - (trialSessionsUsed + 1),
            }
          : null,
    };
  } catch (error) {
    console.error('Error starting session:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to start interview session');
  }
});
