/**
 * Firebase Cloud Functions for AI Mock Interview Platform
 *
 * This file exports all cloud functions for the platform.
 * Functions are organized by feature area.
 */

import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1',
  timeoutSeconds: 60
});

// Import interview-related functions
import {
  chatWithAI,
  generateHint,
  generateFeedback,
  initializeInterview
} from './interviews/aiInterviewer.js';

// Export functions
export {
  chatWithAI,
  generateHint,
  generateFeedback,
  initializeInterview
};

// Health check endpoint
export const healthCheck = onRequest((req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
