// ProgressTimeline Component
// Engineer 5 - Analytics Visualization

import { formatDate, formatDuration, getDifficultyColor } from '../../utils/analyticsHelpers';

/**
 * Timeline showing recent session activity
 */
const ProgressTimeline = ({ sessions }) => {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  // Sort by most recent first
  const recentSessions = [...sessions]
    .sort((a, b) => {
      const dateA = a.endTime?.toMillis?.() || 0;
      const dateB = b.endTime?.toMillis?.() || 0;
      return dateB - dateA;
    })
    .slice(0, 10);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Your last {recentSessions.length} interview sessions
      </p>

      <div className="space-y-4">
        {recentSessions.map((session, index) => {
          const isCompleted = session.completed;
          const isPassed = session.testResults?.passed === session.testResults?.total;
          const score = session.metrics?.overallScore || 0;

          return (
            <div
              key={session.id || index}
              className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-0"
            >
              {/* Timeline dot */}
              <div className={`absolute left-0 -ml-2 w-4 h-4 rounded-full border-2 border-white ${
                isCompleted && isPassed
                  ? 'bg-green-500'
                  : isCompleted
                  ? 'bg-yellow-500'
                  : 'bg-gray-400'
              }`}></div>

              {/* Session info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {session.problemTitle || 'Unknown Problem'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(session.endTime?.toDate?.() || new Date())}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(session.difficulty)}`}>
                    {session.difficulty || 'medium'}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs">Score</p>
                    <p className={`font-semibold ${
                      score >= 80 ? 'text-green-600' :
                      score >= 60 ? 'text-blue-600' :
                      score >= 40 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {score}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Duration</p>
                    <p className="font-semibold text-gray-900">
                      {formatDuration(session.duration || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Tests</p>
                    <p className="font-semibold text-gray-900">
                      {session.testResults?.passed || 0}/{session.testResults?.total || 0}
                    </p>
                  </div>
                </div>

                {/* Status badge */}
                {isCompleted && (
                  <div className="mt-3 flex items-center gap-2">
                    {isPassed ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Incomplete
                      </span>
                    )}
                    {session.language && (
                      <span className="text-xs text-gray-500">
                        {session.language}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTimeline;
