/**
 * Cloud Function: endSession
 *
 * Type: HTTP Callable
 * Purpose: End interview session and generate AI feedback
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { validateSessionId } = require('../utils/validators');
const { generateFinalFeedback } = require('../utils/mockAI');
const { generateFeedback: generateOpenAIFeedback, isOpenAIConfigured } = require('../utils/openaiService');

exports.endSession = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { sessionId, testResults } = data;

    // Validate inputs
    if (!validateSessionId(sessionId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid session ID');
    }

    const db = admin.firestore();
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionDoc.data();

    // Verify ownership
    if (sessionData.userId !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You do not have permission to access this session'
      );
    }

    // Check if session is already ended
    if (sessionData.status !== 'active') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Session is already ended'
      );
    }

    // Calculate session duration
    const startTime = sessionData.startTime.toDate();
    const endTime = new Date();
    const duration = Math.floor((endTime - startTime) / 1000 / 60); // minutes

    // Generate AI feedback
    // Use OpenAI if configured, otherwise fall back to mock
    const finalTestResults = testResults || sessionData.testResults;
    const useMockAI = process.env.USE_MOCK_AI !== 'false' || !isOpenAIConfigured();

    // Get problem details for feedback context
    const problemRef = db.collection('problems').doc(sessionData.problemId);
    const problemDoc = await problemRef.get();
    const problemData = problemDoc.exists ? problemDoc.data() : {};

    let feedback;
    if (useMockAI) {
      console.log('Using mock AI for feedback');
      feedback = generateFinalFeedback({
        code: sessionData.currentCode || sessionData.code || '',
        testResults: finalTestResults,
        duration,
      });
    } else {
      console.log('Using OpenAI GPT-4 for feedback');
      feedback = await generateOpenAIFeedback({
        code: sessionData.currentCode || sessionData.code || '',
        problemTitle: problemData.title || 'Unknown Problem',
        problemDescription: problemData.description || '',
        testResults: finalTestResults,
        chatHistory: sessionData.chatHistory || [],
        durationMinutes: duration,
      });
    }

    // Update session
    const updateData = {
      status: 'completed',
      endTime: admin.firestore.FieldValue.serverTimestamp(),
      duration,
      testResults: finalTestResults,
      aiScore: feedback.score,
      aiFeedback: feedback,
    };

    await sessionRef.update(updateData);

    // Update user stats
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    const totalSessions = (userData.stats?.totalSessions || 0) + 1;
    const currentAverage = userData.stats?.averageScore || 0;
    const newAverage = ((currentAverage * (totalSessions - 1)) + feedback.score) / totalSessions;

    const userUpdateData = {
      'stats.averageScore': newAverage,
      'stats.totalTimeSpent': admin.firestore.FieldValue.increment(duration),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Update problems solved if all tests passed
    if (finalTestResults.passed === finalTestResults.total) {
      userUpdateData['stats.problemsSolved'] = admin.firestore.FieldValue.increment(1);
    }

    // Update streak
    const lastSessionDate = userData.stats?.lastSessionDate?.toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (lastSessionDate) {
      const lastDate = new Date(lastSessionDate);
      lastDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        userUpdateData['stats.currentStreak'] = admin.firestore.FieldValue.increment(1);
      } else if (daysDiff > 1) {
        // Streak broken
        userUpdateData['stats.currentStreak'] = 1;
      }
      // If daysDiff === 0, same day, don't update streak
    } else {
      // First session
      userUpdateData['stats.currentStreak'] = 1;
    }

    userUpdateData['stats.lastSessionDate'] = admin.firestore.FieldValue.serverTimestamp();

    await userRef.update(userUpdateData);

    console.log('Session ended:', sessionId);

    return {
      success: true,
      sessionId,
      feedback,
      stats: {
        averageScore: Math.round(newAverage),
        totalSessions,
        problemsSolved: userData.stats?.problemsSolved || 0,
      },
    };
  } catch (error) {
    console.error('Error ending session:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to end session');
  }
});
