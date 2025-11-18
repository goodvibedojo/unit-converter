// SessionCard Component
// Engineer 5 - History Feature

/**
 * Individual session card displaying session summary
 */
const SessionCard = ({ session, onViewDetails }) => {
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Calculate status
  const getStatus = () => {
    if (!session.completed) return { text: 'In Progress', color: 'yellow' };
    if (session.testResults && session.testResults.passed === session.testResults.total) {
      return { text: 'Completed', color: 'green' };
    }
    if (session.testResults && session.testResults.passed > 0) {
      return { text: 'Partial', color: 'blue' };
    }
    return { text: 'Failed', color: 'red' };
  };

  const status = getStatus();
  const statusColors = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800'
  };

  // Difficulty colors
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };

  const sessionIdDisplay = session.id ? session.id.slice(0, 8) : 'Unknown';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {session.problemTitle || `Session ${sessionIdDisplay}`}
          </h3>
          <p className="text-sm text-gray-500">
            {formatDate(session.startTime)}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status.color]}`}>
            {status.text}
          </span>
          {session.difficulty && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[session.difficulty]}`}>
              {session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Duration */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatDuration(session.duration)}
          </div>
          <div className="text-xs text-gray-500">Duration</div>
        </div>

        {/* Test Results */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {session.testResults
              ? `${session.testResults.passed}/${session.testResults.total}`
              : 'N/A'}
          </div>
          <div className="text-xs text-gray-500">Tests Passed</div>
        </div>

        {/* Score */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {session.metrics?.overallScore || session.testResults?.score || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">Score</div>
        </div>
      </div>

      {/* Metrics */}
      {session.metrics && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Code Quality:</span>
              <span className="ml-1 font-semibold">{session.metrics.codeQualityScore}</span>
            </div>
            <div>
              <span className="text-gray-600">Problem Solving:</span>
              <span className="ml-1 font-semibold">{session.metrics.problemSolvingScore}</span>
            </div>
            <div>
              <span className="text-gray-600">Communication:</span>
              <span className="ml-1 font-semibold">{session.metrics.communicationScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            {session.language || 'python'}
          </span>
          <span>
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {session.chatHistory?.length || 0} messages
          </span>
        </div>
        <button
          onClick={() => onViewDetails(session)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default SessionCard;
