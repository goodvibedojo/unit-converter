import { useState } from 'react';

export default function TestCasePanel({ testCases, testResults, onRunTests, isRunning }) {
  const [selectedTab, setSelectedTab] = useState('test-cases');

  return (
    <div className="flex flex-col h-full bg-white border-t border-gray-200">
      {/* Tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedTab('test-cases')}
            className={`px-3 py-1 text-sm font-medium rounded ${
              selectedTab === 'test-cases'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Test Cases
          </button>
          <button
            onClick={() => setSelectedTab('results')}
            className={`px-3 py-1 text-sm font-medium rounded ${
              selectedTab === 'results'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Results
            {testResults && (
              <span className="ml-2 px-2 py-0.5 bg-white rounded text-xs">
                {testResults.passed}/{testResults.total}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onRunTests}
          disabled={isRunning}
          className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running...' : 'Run Tests'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedTab === 'test-cases' && (
          <div className="space-y-3">
            {testCases && testCases.length > 0 ? (
              testCases.map((testCase, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 ${
                    testCase.isHidden
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">
                      Test Case {index + 1}
                    </span>
                    {testCase.isHidden && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  {!testCase.isHidden && (
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="font-medium text-gray-700">Input:</span>
                        <code className="ml-2 bg-white px-2 py-0.5 rounded text-xs">
                          {testCase.input}
                        </code>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Expected:</span>
                        <code className="ml-2 bg-white px-2 py-0.5 rounded text-xs">
                          {testCase.expectedOutput}
                        </code>
                      </div>
                    </div>
                  )}
                  {testCase.isHidden && (
                    <div className="text-xs text-gray-500">
                      This test case will be revealed after submission
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No test cases available
              </div>
            )}
          </div>
        )}

        {selectedTab === 'results' && (
          <div className="space-y-3">
            {testResults && testResults.results ? (
              <>
                {/* Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {testResults.passed}/{testResults.total}
                      </div>
                      <div className="text-sm text-gray-600">Tests Passed</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(testResults.score)}%
                      </div>
                      <div className="text-sm text-gray-600">Score</div>
                    </div>
                  </div>
                </div>

                {/* Individual Results */}
                {testResults.results.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${
                      result.passed
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">
                        Test Case {index + 1}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          result.passed
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {result.passed ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </div>

                    {!result.isHidden && (
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium text-gray-700">Input:</span>
                          <code className="ml-2 bg-white px-2 py-0.5 rounded text-xs">
                            {result.input}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Expected:</span>
                          <code className="ml-2 bg-white px-2 py-0.5 rounded text-xs">
                            {result.expectedOutput}
                          </code>
                        </div>
                        {!result.passed && result.actualOutput && (
                          <div>
                            <span className="font-medium text-red-700">Actual:</span>
                            <code className="ml-2 bg-white px-2 py-0.5 rounded text-xs text-red-600">
                              {result.actualOutput}
                            </code>
                          </div>
                        )}
                        {result.executionTime && (
                          <div className="text-xs text-gray-500 mt-1">
                            Execution time: {Math.round(result.executionTime)}ms
                          </div>
                        )}
                      </div>
                    )}

                    {result.error && (
                      <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded">
                        {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">▶️</div>
                <div>Run tests to see results</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
