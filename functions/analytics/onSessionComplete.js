// On Session Complete Analytics
// Engineer 5 - Analytics Function

const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Calculate and store session metrics when session is completed
 */
module.exports = functions.firestore
  .document('sessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Only process if session was just completed
    if (newData.completed && !oldData.completed) {
      const sessionId = context.params.sessionId;

      try {
        // Calculate session metrics
        const metrics = calculateSessionMetrics(newData);

        // Update session with metrics
        await change.after.ref.update({
          metrics: metrics,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update problem statistics
        if (newData.problemId) {
          await updateProblemStats(newData.problemId, metrics);
        }

        console.log(`Calculated metrics for session ${sessionId}`);
      } catch (error) {
        console.error('Error calculating session metrics:', error);
      }
    }
  });

/**
 * Calculate comprehensive session metrics
 */
function calculateSessionMetrics(session) {
  const startTime = session.startTime?.toMillis() || Date.now();
  const endTime = session.endTime?.toMillis() || Date.now();
  const duration = Math.floor((endTime - startTime) / 1000);

  // Code metrics
  const codeChanges = session.codeHistory?.length || 0;
  const linesOfCode = session.code ? session.code.split('\n').length : 0;

  // Test metrics
  const testsPassed = session.testResults?.passed || 0;
  const testsTotal = session.testResults?.total || 0;
  const testRunCount = session.testRunCount || 0;

  // AI interaction metrics
  const messageCount = session.chatHistory?.length || 0;
  const hintsRequested = session.chatHistory?.filter(
    msg => msg.role === 'user' && msg.content.toLowerCase().includes('hint')
  ).length || 0;

  // Calculate scores (simplified - in production would use AI analysis)
  const testPassRate = testsTotal > 0 ? (testsPassed / testsTotal) * 100 : 0;

  const codeQualityScore = Math.min(100, Math.max(0,
    50 + // Base score
    (linesOfCode > 0 && linesOfCode < 100 ? 20 : 0) + // Concise code
    (codeChanges > 3 ? 10 : 0) + // Iterative development
    (testPassRate > 80 ? 20 : 0) // High test pass rate
  ));

  const problemSolvingScore = Math.min(100, Math.max(0,
    (testPassRate * 0.6) + // 60% weight on tests passing
    (duration < 3600 ? 30 : duration < 7200 ? 20 : 10) + // Speed bonus
    (hintsRequested === 0 ? 10 : 5) // Independence bonus
  ));

  const communicationScore = Math.min(100, Math.max(0,
    40 + // Base score
    (messageCount > 3 ? 30 : messageCount * 10) + // Engagement
    (hintsRequested > 0 && hintsRequested < 4 ? 30 : 0) // Asking good questions
  ));

  const overallScore = Math.round(
    (codeQualityScore * 0.3) +
    (problemSolvingScore * 0.5) +
    (communicationScore * 0.2)
  );

  return {
    // Time metrics
    duration,
    timeToFirstCode: session.timeToFirstCode || 0,
    timeToFirstTest: session.timeToFirstTest || 0,

    // Code metrics
    totalCodeChanges: codeChanges,
    linesOfCode,
    testRunCount,

    // Test results
    testsPassed,
    testsTotal,
    testPassRate: Math.round(testPassRate),

    // AI interaction
    messageCount,
    hintsRequested,

    // Scores
    codeQualityScore: Math.round(codeQualityScore),
    problemSolvingScore: Math.round(problemSolvingScore),
    communicationScore: Math.round(communicationScore),
    overallScore
  };
}

/**
 * Update problem statistics
 */
async function updateProblemStats(problemId, sessionMetrics) {
  const problemRef = admin.firestore().collection('problems').doc(problemId);

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const problemDoc = await transaction.get(problemRef);

      if (!problemDoc.exists) {
        console.error(`Problem ${problemId} not found`);
        return;
      }

      const problemData = problemDoc.data();
      const stats = problemData.stats || {
        totalAttempts: 0,
        totalSolved: 0,
        averageTime: 0,
        successRate: 0,
        totalTime: 0
      };

      stats.totalAttempts++;

      if (sessionMetrics.testsPassed === sessionMetrics.testsTotal) {
        stats.totalSolved++;
      }

      stats.totalTime = (stats.totalTime || 0) + sessionMetrics.duration;
      stats.averageTime = Math.round(stats.totalTime / stats.totalAttempts);
      stats.successRate = Math.round((stats.totalSolved / stats.totalAttempts) * 100);

      transaction.update(problemRef, {
        stats,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`Updated stats for problem ${problemId}`);
  } catch (error) {
    console.error('Error updating problem stats:', error);
  }
}
