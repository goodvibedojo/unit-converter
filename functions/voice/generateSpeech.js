/**
 * Generate Speech Function
 *
 * Convert text to speech using OpenAI TTS
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { textToSpeech, uploadAudio, isVoiceConfigured, AVAILABLE_VOICES } = require('../utils/voiceService');

/**
 * Generate speech from text
 *
 * Converts text to speech and returns audio URL
 */
exports.generateSpeech = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const {
      text,
      voice = 'nova',
      model = 'tts-1',
      speed = 1.0,
      sessionId = null,
    } = data;

    // Validate inputs
    if (!text || typeof text !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Text is required');
    }

    if (text.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Text cannot be empty');
    }

    if (text.length > 4096) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Text too long. Maximum 4096 characters.'
      );
    }

    // Validate voice
    const validVoices = Object.keys(AVAILABLE_VOICES);
    if (!validVoices.includes(voice)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid voice. Must be one of: ${validVoices.join(', ')}`
      );
    }

    // Check if voice features are configured
    if (!isVoiceConfigured()) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Text-to-speech service is not configured. Please contact support.'
      );
    }

    console.log('Generating speech:', {
      textLength: text.length,
      voice,
      model,
      userId,
    });

    // Generate speech
    const result = await textToSpeech({
      text,
      voice,
      model,
      speed,
    });

    // Upload to Firebase Storage
    const storageId = sessionId || `user-${userId}`;
    const audioUrl = await uploadAudio(
      result.audioBuffer,
      storageId,
      'tts',
      'mp3'
    );

    return {
      success: true,
      audioUrl,
      voice,
      model,
      duration: Math.ceil(text.length / 15), // Rough estimate: ~15 chars/sec
      audioSize: result.size,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error generating speech:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      `Speech generation failed: ${error.message}`
    );
  }
});

/**
 * Get available voices
 */
exports.getAvailableVoices = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    return {
      success: true,
      voices: AVAILABLE_VOICES,
      defaultVoice: 'nova',
      models: ['tts-1', 'tts-1-hd'],
    };
  } catch (error) {
    console.error('Error getting voices:', error);

    throw new functions.https.HttpsError('internal', 'Failed to get available voices');
  }
});
