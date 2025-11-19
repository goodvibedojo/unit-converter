/**
 * Transcribe Audio Function
 *
 * Standalone transcription service for audio files
 */

const functions = require('firebase-functions');
const { transcribeAudio, isVoiceConfigured } = require('../utils/voiceService');

/**
 * Transcribe audio to text
 *
 * Used for converting voice questions to text without full AI processing
 */
exports.transcribeAudio = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { audioData, fileName, language = 'en', prompt } = data;

    // Validate inputs
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
        'Transcription service is not configured. Please contact support.'
      );
    }

    // Convert base64 audio data to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');

    console.log('Transcribing audio:', fileName);

    // Transcribe
    const result = await transcribeAudio({
      audioBuffer,
      fileName,
      language,
      prompt,
    });

    return {
      success: true,
      text: result.text,
      language: result.language,
      duration: result.duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      `Transcription failed: ${error.message}`
    );
  }
});
