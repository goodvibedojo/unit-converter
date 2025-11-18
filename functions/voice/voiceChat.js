/**
 * Voice Chat Function
 *
 * Handle voice messages in interview sessions
 * Transcribes audio, generates AI response, and returns both text and audio
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { validateSessionId } = require('../utils/validators');
const { processVoiceMessage, isVoiceConfigured } = require('../utils/voiceService');

/**
 * Process voice message
 *
 * Client uploads audio file, function transcribes it, generates AI response,
 * converts response to speech, and returns everything
 */
exports.voiceChat = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { sessionId, audioData, fileName } = data;

    // Validate inputs
    if (!validateSessionId(sessionId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid session ID');
    }

    if (!audioData) {
      throw new functions.https.HttpsError('invalid-argument', 'Audio data is required');
    }

    if (!fileName) {
      throw new functions.https.HttpsError('invalid-argument', 'File name is required');
    }

    // Check if voice features are configured
    if (!isVoiceConfigured()) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Voice features are not configured. Please contact support.'
      );
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
        'Cannot use voice chat in inactive session'
      );
    }

    // Convert base64 audio data to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');

    console.log('Processing voice message for session:', sessionId);

    // Process voice message (transcribe + AI response + TTS)
    const result = await processVoiceMessage({
      audioBuffer,
      fileName,
      sessionId,
      userId,
    });

    // Update session with voice messages
    const userMessage = {
      role: 'user',
      content: result.userMessage,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      audioUrl: null, // Could upload user audio too if needed
      isVoice: true,
    };

    const aiMessage = {
      role: 'ai',
      content: result.aiResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      audioUrl: result.audioUrl,
      isVoice: true,
    };

    await sessionRef.update({
      chatHistory: admin.firestore.FieldValue.arrayUnion(userMessage, aiMessage),
    });

    return {
      success: true,
      transcription: result.userMessage,
      aiResponse: result.aiResponse,
      aiAudioUrl: result.audioUrl,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in voice chat:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      `Failed to process voice message: ${error.message}`
    );
  }
});
