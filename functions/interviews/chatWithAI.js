/**
 * Cloud Function: chatWithAI
 *
 * Type: HTTP Callable
 * Purpose: Handle chat messages with AI interviewer
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { validateSessionId, validateMessage } = require('../utils/validators');
const { generateMockResponse } = require('../utils/mockAI');

exports.chatWithAI = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { sessionId, message } = data;

    // Validate inputs
    if (!validateSessionId(sessionId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid session ID');
    }

    const messageValidation = validateMessage(message);
    if (!messageValidation.valid) {
      throw new functions.https.HttpsError('invalid-argument', messageValidation.error);
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

    // Check if session is still active
    if (sessionData.status !== 'active') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cannot chat in inactive session'
      );
    }

    // Get problem details for context
    const problemRef = db.collection('problems').doc(sessionData.problemId);
    const problemDoc = await problemRef.get();
    const problemData = problemDoc.exists ? problemDoc.data() : null;

    // Add user message to chat history
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      audioUrl: null,
    };

    // Generate AI response
    // In production, this would call OpenAI API
    // For now, using mock AI service
    const useMockAI = process.env.USE_MOCK_AI !== 'false'; // Default to true

    let aiResponse;
    if (useMockAI) {
      aiResponse = generateMockResponse({
        userMessage: message,
        code: sessionData.code,
        problemTitle: problemData?.title || 'Unknown Problem',
        phase: 'coding',
        chatHistory: sessionData.chatHistory || [],
      });
    } else {
      // TODO: Integrate OpenAI API
      // const OpenAI = require('openai');
      // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // aiResponse = await callOpenAI(...)
      aiResponse = 'OpenAI integration coming soon!';
    }

    const aiMessage = {
      role: 'ai',
      content: aiResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      audioUrl: null,
    };

    // Update session with new messages
    await sessionRef.update({
      chatHistory: admin.firestore.FieldValue.arrayUnion(userMessage, aiMessage),
    });

    console.log('AI chat for session:', sessionId);

    return {
      success: true,
      aiResponse,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in AI chat:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to process AI chat');
  }
});
