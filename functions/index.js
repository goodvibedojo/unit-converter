/**
 * Firebase Cloud Functions
 * AI Mock Interview Platform - Code Execution Service
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Export functions
const { executeCode } = require('./executeCode');
const { runTestCases } = require('./runTestCases');

exports.executeCode = executeCode;
exports.runTestCases = runTestCases;

// Health check function
const functions = require('firebase-functions');

exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ai-mock-interview-functions',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

console.log('✅ Firebase Functions initialized');
