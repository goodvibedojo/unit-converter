// Analytics Helper Functions
// Engineer 5 - Utility functions for analytics calculations

/**
 * Calculate session duration in seconds
 * @param {Date|string} startTime
 * @param {Date|string} endTime
 * @returns {number} Duration in seconds
 */
export const calculateSessionDuration = (startTime, endTime) => {
  const start = startTime instanceof Date ? startTime : new Date(startTime);
  const end = endTime instanceof Date ? endTime : new Date(endTime);
  return Math.floor((end - start) / 1000);
};

/**
 * Calculate success rate
 * @param {number} passed
 * @param {number} total
 * @returns {number} Success rate percentage (0-100)
 */
export const calculateSuccessRate = (passed, total) => {
  if (total === 0) return 0;
  return Math.round((passed / total) * 100);
};

/**
 * Calculate average from array of numbers
 * @param {number[]} numbers
 * @returns {number} Average value
 */
export const calculateAverage = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / numbers.length) * 100) / 100; // Round to 2 decimals
};

/**
 * Calculate streak days
 * @param {Date[]} activityDates - Array of dates when user was active
 * @returns {number} Number of consecutive days
 */
export const calculateStreakDays = (activityDates) => {
  if (!activityDates || activityDates.length === 0) return 0;

  // Sort dates in descending order
  const sortedDates = activityDates
    .map(d => new Date(d))
    .sort((a, b) => b - a);

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if most recent activity was today or yesterday
  const mostRecent = new Date(sortedDates[0]);
  mostRecent.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today - mostRecent) / (1000 * 60 * 60 * 24));

  if (daysDiff > 1) return 0; // Streak broken
  if (daysDiff === 1) streak = 1; // Start counting from yesterday

  // Count consecutive days
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    current.setHours(0, 0, 0, 0);

    const next = new Date(sortedDates[i + 1]);
    next.setHours(0, 0, 0, 0);

    const diff = Math.floor((current - next) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Group sessions by difficulty
 * @param {Array} sessions
 * @returns {Object} Grouped stats
 */
export const groupSessionsByDifficulty = (sessions) => {
  const stats = {
    easy: { attempted: 0, solved: 0 },
    medium: { attempted: 0, solved: 0 },
    hard: { attempted: 0, solved: 0 }
  };

  sessions.forEach(session => {
    const difficulty = session.difficulty || 'medium';
    stats[difficulty].attempted++;

    if (session.completed && session.testsPassed === session.testsTotal) {
      stats[difficulty].solved++;
    }
  });

  return stats;
};

/**
 * Group sessions by category
 * @param {Array} sessions
 * @returns {Object} Category stats
 */
export const groupSessionsByCategory = (sessions) => {
  const categoryStats = {};

  sessions.forEach(session => {
    const categories = session.category || ['uncategorized'];

    categories.forEach(cat => {
      if (!categoryStats[cat]) {
        categoryStats[cat] = {
          attempted: 0,
          solved: 0,
          totalScore: 0,
          avgScore: 0
        };
      }

      categoryStats[cat].attempted++;

      if (session.completed && session.testsPassed === session.testsTotal) {
        categoryStats[cat].solved++;
      }

      if (session.overallScore) {
        categoryStats[cat].totalScore += session.overallScore;
      }
    });
  });

  // Calculate average scores
  Object.keys(categoryStats).forEach(cat => {
    const stat = categoryStats[cat];
    stat.avgScore = stat.attempted > 0
      ? Math.round((stat.totalScore / stat.attempted) * 100) / 100
      : 0;
  });

  return categoryStats;
};

/**
 * Calculate user stats from sessions
 * @param {Array} sessions
 * @returns {Object} Comprehensive user stats
 */
export const calculateUserStats = (sessions) => {
  if (!sessions || sessions.length === 0) {
    return {
      totalSessions: 0,
      completedSessions: 0,
      problemsSolved: 0,
      averageScore: 0,
      averageSessionDuration: 0,
      successRate: 0,
      totalCodingTime: 0,
      problemsByDifficulty: {
        easy: { attempted: 0, solved: 0 },
        medium: { attempted: 0, solved: 0 },
        hard: { attempted: 0, solved: 0 }
      },
      categoriesStats: {}
    };
  }

  const completedSessions = sessions.filter(s => s.completed);
  const solvedSessions = sessions.filter(
    s => s.completed && s.testsPassed === s.testsTotal
  );

  const scores = sessions
    .filter(s => s.overallScore !== undefined)
    .map(s => s.overallScore);

  const durations = sessions
    .filter(s => s.duration !== undefined)
    .map(s => s.duration);

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    problemsSolved: solvedSessions.length,
    averageScore: calculateAverage(scores),
    averageSessionDuration: calculateAverage(durations) / 60, // Convert to minutes
    successRate: calculateSuccessRate(solvedSessions.length, completedSessions.length),
    totalCodingTime: durations.reduce((acc, val) => acc + val, 0) / 60, // Minutes
    problemsByDifficulty: groupSessionsByDifficulty(sessions),
    categoriesStats: groupSessionsByCategory(sessions)
  };
};

/**
 * Format duration for display
 * @param {number} seconds
 * @returns {string} Formatted duration (e.g., "45m 30s")
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Format score for display
 * @param {number} score
 * @returns {string} Formatted score with color class
 */
export const formatScore = (score) => {
  if (score === undefined || score === null) return { text: 'N/A', class: 'text-gray-400' };

  const rounded = Math.round(score);
  let colorClass = 'text-gray-600';

  if (rounded >= 90) colorClass = 'text-green-600';
  else if (rounded >= 70) colorClass = 'text-blue-600';
  else if (rounded >= 50) colorClass = 'text-yellow-600';
  else colorClass = 'text-red-600';

  return { text: `${rounded}/100`, class: colorClass };
};

/**
 * Get difficulty badge color
 * @param {string} difficulty
 * @returns {string} Tailwind color class
 */
export const getDifficultyColor = (difficulty) => {
  const colors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };
  return colors[difficulty] || 'bg-gray-100 text-gray-800';
};

/**
 * Calculate trial progress
 * @param {number} sessionsUsed
 * @param {number} totalSessions
 * @returns {Object} Progress info
 */
export const calculateTrialProgress = (sessionsUsed, totalSessions = 3) => {
  const remaining = Math.max(0, totalSessions - sessionsUsed);
  const percentage = (sessionsUsed / totalSessions) * 100;

  return {
    used: sessionsUsed,
    remaining,
    total: totalSessions,
    percentage: Math.round(percentage),
    isExpired: remaining === 0
  };
};

/**
 * Format date for display
 * @param {Date|string} date
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';

  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
