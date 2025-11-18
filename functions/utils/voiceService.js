/**
 * Voice Service - Speech-to-Text and Text-to-Speech
 *
 * Integrates OpenAI Whisper API for transcription and OpenAI TTS for voice synthesis
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { logger } = require('./monitoring');
const FormData = require('form-data');
const axios = require('axios');

/**
 * Get OpenAI API configuration
 */
function getOpenAIConfig() {
  const apiKey = functions.config().openai?.apikey || process.env.OPENAI_API_KEY;

  return {
    apiKey,
    baseUrl: 'https://api.openai.com/v1',
  };
}

/**
 * Check if voice services are configured
 */
function isVoiceConfigured() {
  const { apiKey } = getOpenAIConfig();
  return !!apiKey;
}

/**
 * Transcribe audio to text using Whisper API
 *
 * @param {Object} params - Transcription parameters
 * @param {Buffer} params.audioBuffer - Audio file buffer
 * @param {string} params.fileName - Original file name (for format detection)
 * @param {string} params.language - Language code (optional, e.g., 'en', 'es')
 * @param {string} params.prompt - Context hint for better transcription (optional)
 * @returns {Promise<Object>} Transcription result
 */
async function transcribeAudio({
  audioBuffer,
  fileName,
  language = null,
  prompt = null,
}) {
  try {
    const { apiKey, baseUrl } = getOpenAIConfig();

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    logger.info('Starting audio transcription', {
      fileSize: audioBuffer.length,
      fileName,
      language,
      hasPrompt: !!prompt,
    });

    // Create form data
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: fileName,
      contentType: getAudioContentType(fileName),
    });
    formData.append('model', 'whisper-1');

    if (language) {
      formData.append('language', language);
    }

    if (prompt) {
      formData.append('prompt', prompt);
    }

    // Call Whisper API
    const response = await axios.post(
      `${baseUrl}/audio/transcriptions`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${apiKey}`,
        },
        maxContentLength: 25 * 1024 * 1024, // 25MB max
        maxBodyLength: 25 * 1024 * 1024,
      }
    );

    const transcription = response.data.text;

    logger.info('Transcription complete', {
      textLength: transcription.length,
      duration: response.data.duration,
    });

    return {
      text: transcription,
      language: response.data.language || language,
      duration: response.data.duration,
      success: true,
    };
  } catch (error) {
    logger.error('Transcription error', {
      error: error.message,
      response: error.response?.data,
    });

    // Handle specific errors
    if (error.response?.status === 400) {
      throw new Error('Invalid audio file format. Supported: mp3, mp4, mpeg, mpga, m4a, wav, webm');
    }

    if (error.response?.status === 413) {
      throw new Error('Audio file too large. Maximum size: 25MB');
    }

    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Synthesize text to speech using OpenAI TTS
 *
 * @param {Object} params - TTS parameters
 * @param {string} params.text - Text to synthesize
 * @param {string} params.voice - Voice to use (alloy, echo, fable, onyx, nova, shimmer)
 * @param {string} params.model - Model to use (tts-1, tts-1-hd)
 * @param {number} params.speed - Speed (0.25 to 4.0, default 1.0)
 * @returns {Promise<Buffer>} Audio buffer (MP3)
 */
async function textToSpeech({
  text,
  voice = 'alloy',
  model = 'tts-1',
  speed = 1.0,
}) {
  try {
    const { apiKey, baseUrl } = getOpenAIConfig();

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Validate voice
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    if (!validVoices.includes(voice)) {
      throw new Error(`Invalid voice. Must be one of: ${validVoices.join(', ')}`);
    }

    // Validate model
    const validModels = ['tts-1', 'tts-1-hd'];
    if (!validModels.includes(model)) {
      throw new Error(`Invalid model. Must be one of: ${validModels.join(', ')}`);
    }

    // Validate speed
    if (speed < 0.25 || speed > 4.0) {
      throw new Error('Speed must be between 0.25 and 4.0');
    }

    logger.info('Generating speech', {
      textLength: text.length,
      voice,
      model,
      speed,
    });

    // Call TTS API
    const response = await axios.post(
      `${baseUrl}/audio/speech`,
      {
        model,
        input: text,
        voice,
        speed,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    const audioBuffer = Buffer.from(response.data);

    logger.info('Speech generation complete', {
      audioSize: audioBuffer.length,
    });

    return {
      audioBuffer,
      format: 'mp3',
      size: audioBuffer.length,
      success: true,
    };
  } catch (error) {
    logger.error('TTS error', {
      error: error.message,
      response: error.response?.data,
    });

    // Handle specific errors
    if (error.response?.status === 400) {
      throw new Error('Invalid TTS request. Check text length and parameters.');
    }

    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    throw new Error(`Text-to-speech failed: ${error.message}`);
  }
}

/**
 * Upload audio file to Firebase Storage
 *
 * @param {Buffer} audioBuffer - Audio data
 * @param {string} sessionId - Session ID (for path organization)
 * @param {string} type - Audio type ('transcription' or 'tts')
 * @param {string} format - File format (e.g., 'mp3', 'wav')
 * @returns {Promise<string>} Public URL
 */
async function uploadAudio(audioBuffer, sessionId, type, format = 'mp3') {
  try {
    const bucket = admin.storage().bucket();
    const timestamp = Date.now();
    const fileName = `audio/${type}/${sessionId}/${timestamp}.${format}`;

    const file = bucket.file(fileName);

    await file.save(audioBuffer, {
      metadata: {
        contentType: `audio/${format}`,
        cacheControl: 'public, max-age=31536000', // 1 year
      },
    });

    // Make file publicly accessible
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    logger.info('Audio uploaded', {
      fileName,
      size: audioBuffer.length,
      publicUrl,
    });

    return publicUrl;
  } catch (error) {
    logger.error('Audio upload error', { error: error.message });
    throw new Error('Failed to upload audio file');
  }
}

/**
 * Process voice message for interview session
 *
 * Transcribes audio, processes message through AI, and generates speech response
 *
 * @param {Object} params - Voice message parameters
 * @param {Buffer} params.audioBuffer - Voice message audio
 * @param {string} params.fileName - Original file name
 * @param {string} params.sessionId - Session ID
 * @param {string} params.userId - User ID
 * @returns {Promise<Object>} Transcription, AI response, and audio URL
 */
async function processVoiceMessage({
  audioBuffer,
  fileName,
  sessionId,
  userId,
}) {
  try {
    logger.info('Processing voice message', {
      sessionId,
      userId,
      audioSize: audioBuffer.length,
    });

    // Step 1: Transcribe user's audio
    const transcription = await transcribeAudio({
      audioBuffer,
      fileName,
      language: 'en',
      prompt: 'Technical coding interview conversation',
    });

    const userMessage = transcription.text;

    logger.info('User message transcribed', {
      message: userMessage.substring(0, 100),
    });

    // Step 2: Generate AI response (using existing chatWithAI logic)
    const { generateAIResponse } = require('./openaiService');
    const db = admin.firestore();

    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    const sessionData = sessionDoc.data();

    const problemDoc = await db.collection('problems').doc(sessionData.problemId).get();
    const problemData = problemDoc.data();

    const aiResponseText = await generateAIResponse({
      userMessage,
      code: sessionData.currentCode || '',
      problemTitle: problemData.title,
      problemDescription: problemData.description,
      chatHistory: sessionData.chatHistory || [],
      phase: 'coding',
    });

    logger.info('AI response generated', {
      responseLength: aiResponseText.length,
    });

    // Step 3: Convert AI response to speech
    const ttsResult = await textToSpeech({
      text: aiResponseText,
      voice: 'nova', // Female voice, good for teaching
      model: 'tts-1',
      speed: 1.0,
    });

    // Step 4: Upload AI audio to Storage
    const audioUrl = await uploadAudio(
      ttsResult.audioBuffer,
      sessionId,
      'tts',
      'mp3'
    );

    logger.info('Voice message processing complete', {
      transcriptionLength: userMessage.length,
      responseLength: aiResponseText.length,
      audioUrl,
    });

    return {
      userMessage,
      aiResponse: aiResponseText,
      audioUrl,
      success: true,
    };
  } catch (error) {
    logger.error('Voice message processing error', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get audio content type from file name
 */
function getAudioContentType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();

  const contentTypes = {
    'mp3': 'audio/mpeg',
    'mp4': 'audio/mp4',
    'mpeg': 'audio/mpeg',
    'mpga': 'audio/mpeg',
    'm4a': 'audio/mp4',
    'wav': 'audio/wav',
    'webm': 'audio/webm',
  };

  return contentTypes[ext] || 'audio/mpeg';
}

/**
 * Get estimated cost for voice operations
 */
function estimateCost({ operation, duration = 0, textLength = 0 }) {
  // Whisper: $0.006 / minute
  // TTS: $0.015 / 1000 characters (tts-1), $0.030 / 1000 characters (tts-1-hd)

  if (operation === 'transcription') {
    const minutes = duration / 60;
    return minutes * 0.006;
  }

  if (operation === 'tts') {
    const chars = textLength;
    return (chars / 1000) * 0.015;
  }

  return 0;
}

/**
 * Available TTS voices with descriptions
 */
const AVAILABLE_VOICES = {
  alloy: 'Neutral, balanced voice',
  echo: 'Male, clear and authoritative',
  fable: 'British accent, storytelling quality',
  onyx: 'Deep male voice, professional',
  nova: 'Female, friendly and approachable (recommended for teaching)',
  shimmer: 'Female, warm and energetic',
};

module.exports = {
  transcribeAudio,
  textToSpeech,
  uploadAudio,
  processVoiceMessage,
  isVoiceConfigured,
  estimateCost,
  AVAILABLE_VOICES,
};
