export default function ProblemDisplay({ problem }) {
  if (!problem) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p>No problem selected</p>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100'
  };

  return (
    <div className="h-full overflow-y-auto bg-white p-6">
      {/* Problem Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{problem.title}</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
              difficultyColors[problem.difficulty]
            }`}
          >
            {problem.difficulty}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {problem.category?.map((cat) => (
            <span
              key={cat}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
            >
              {cat}
            </span>
          ))}
          {problem.companyTags?.map((company) => (
            <span
              key={company}
              className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md"
            >
              {company}
            </span>
          ))}
        </div>
      </div>

      {/* Problem Description */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {problem.description}
        </div>
      </div>

      {/* Examples */}
      {problem.examples && problem.examples.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Examples</h2>
          <div className="space-y-4">
            {problem.examples.map((example, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="font-semibold text-sm text-gray-600 mb-2">
                  Example {index + 1}:
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Input:</span>{' '}
                    <code className="bg-white px-2 py-0.5 rounded text-blue-600">
                      {example.input}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Output:</span>{' '}
                    <code className="bg-white px-2 py-0.5 rounded text-blue-600">
                      {example.output}
                    </code>
                  </div>
                  {example.explanation && (
                    <div>
                      <span className="font-medium">Explanation:</span>{' '}
                      <span className="text-gray-700">{example.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraints */}
      {problem.constraints && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Constraints</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {problem.constraints}
            </pre>
          </div>
        </div>
      )}

      {/* Hints (collapsed by default) */}
      {problem.hints && problem.hints.length > 0 && (
        <details className="mb-6">
          <summary className="text-lg font-semibold text-gray-900 mb-3 cursor-pointer hover:text-blue-600">
            Hints ({problem.hints.length})
          </summary>
          <div className="space-y-2 mt-3">
            {problem.hints.map((hint, index) => (
              <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-3 text-sm">
                <span className="font-medium text-blue-900">Hint {index + 1}:</span>{' '}
                <span className="text-gray-700">{hint}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
