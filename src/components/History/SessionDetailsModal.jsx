// SessionDetailsModal Component
// Engineer 5 - History Feature

import { useState } from 'react';

/**
 * Modal displaying detailed session information with tabbed interface
 */
const SessionDetailsModal = ({ session, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!session) return null;

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'code', label: 'Code', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
    { id: 'tests', label: 'Tests', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'chat', label: 'Chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { id: 'metrics', label: 'Metrics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {session.problemTitle || 'Session Details'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(session.startTime)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium mb-1">Duration</div>
                  <div className="text-2xl font-bold text-blue-900">{formatDuration(session.duration)}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium mb-1">Tests Passed</div>
                  <div className="text-2xl font-bold text-green-900">
                    {session.testResults ? `${session.testResults.passed}/${session.testResults.total}` : 'N/A'}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-600 font-medium mb-1">Overall Score</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {session.metrics?.overallScore || session.testResults?.score || 'N/A'}
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-sm text-yellow-600 font-medium mb-1">Language</div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {(session.language || 'python').toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Session Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Session Information</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-600">Session ID</dt>
                    <dd className="font-mono text-gray-900">{session.id ? session.id.slice(0, 16) : 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Problem ID</dt>
                    <dd className="font-mono text-gray-900">{session.problemId || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Difficulty</dt>
                    <dd className="font-semibold text-gray-900 capitalize">{session.difficulty || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Status</dt>
                    <dd className="font-semibold text-gray-900">{session.completed ? 'Completed' : 'In Progress'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Code Changes</dt>
                    <dd className="font-semibold text-gray-900">{session.codeChangeCount || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Test Runs</dt>
                    <dd className="font-semibold text-gray-900">{session.testRunCount || 0}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Final Code</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono">
                  {session.finalCode || session.code || '// No code available'}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Test Results</h3>
              {session.testResults ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall</span>
                      <span className="text-lg font-bold text-gray-900">
                        {session.testResults.passed}/{session.testResults.total} passed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          session.testResults.passed === session.testResults.total
                            ? 'bg-green-500'
                            : session.testResults.passed > 0
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${(session.testResults.passed / session.testResults.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {session.testResults.results && session.testResults.results.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Test Case {index + 1}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                      {!result.passed && result.error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                          {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No test results available</p>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Chat History</h3>
              {session.chatHistory && session.chatHistory.length > 0 ? (
                <div className="space-y-4">
                  {session.chatHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="text-xs opacity-75 mb-1">
                          {message.role === 'user' ? 'You' : 'AI Interviewer'}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No chat history available</p>
              )}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Performance Metrics</h3>
              {session.metrics ? (
                <div className="space-y-6">
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600 font-medium mb-2">Code Quality</div>
                      <div className="text-3xl font-bold text-blue-900">{session.metrics.codeQualityScore}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 font-medium mb-2">Problem Solving</div>
                      <div className="text-3xl font-bold text-green-900">{session.metrics.problemSolvingScore}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-purple-600 font-medium mb-2">Communication</div>
                      <div className="text-3xl font-bold text-purple-900">{session.metrics.communicationScore}</div>
                    </div>
                  </div>

                  {/* Detailed Metrics */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Detailed Breakdown</h4>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-gray-600">Lines of Code</dt>
                        <dd className="font-semibold text-gray-900">{session.metrics.linesOfCode || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Code Changes</dt>
                        <dd className="font-semibold text-gray-900">{session.metrics.totalCodeChanges || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Test Runs</dt>
                        <dd className="font-semibold text-gray-900">{session.metrics.testRunCount || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Messages</dt>
                        <dd className="font-semibold text-gray-900">{session.metrics.messageCount || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Hints Requested</dt>
                        <dd className="font-semibold text-gray-900">{session.metrics.hintsRequested || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Test Pass Rate</dt>
                        <dd className="font-semibold text-gray-900">{session.metrics.testPassRate || 0}%</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No performance metrics available</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailsModal;
