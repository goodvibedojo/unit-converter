// DifficultyBreakdown Component
// Engineer 5 - Analytics Visualization

/**
 * Visual breakdown of performance by difficulty level
 */
const DifficultyBreakdown = ({ problemsByDifficulty }) => {
  if (!problemsByDifficulty) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Difficulty Breakdown
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          <p>No difficulty data available</p>
        </div>
      </div>
    );
  }

  const difficulties = [
    {
      name: 'Easy',
      color: 'green',
      data: problemsByDifficulty.easy || { attempted: 0, solved: 0 }
    },
    {
      name: 'Medium',
      color: 'yellow',
      data: problemsByDifficulty.medium || { attempted: 0, solved: 0 }
    },
    {
      name: 'Hard',
      color: 'red',
      data: problemsByDifficulty.hard || { attempted: 0, solved: 0 }
    }
  ];

  const totalAttempted = difficulties.reduce((sum, d) => sum + d.data.attempted, 0);

  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  const lightColorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Difficulty Breakdown
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Your performance across problem difficulty levels
      </p>

      {totalAttempted === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <p>Start solving problems to see your breakdown</p>
        </div>
      ) : (
        <div className="space-y-6">
          {difficulties.map((diff) => {
            const successRate = diff.data.attempted > 0
              ? (diff.data.solved / diff.data.attempted) * 100
              : 0;

            return (
              <div key={diff.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full ${colorClasses[diff.color]} mr-2`}></span>
                    <span className="font-medium text-gray-900">{diff.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {diff.data.solved} / {diff.data.attempted} solved
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${colorClasses[diff.color]} transition-all duration-300`}
                    style={{ width: `${successRate}%` }}
                  ></div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs">
                  <span className={`px-2 py-1 rounded border ${lightColorClasses[diff.color]}`}>
                    {Math.round(successRate)}% success rate
                  </span>
                  <span className="text-gray-500">
                    {diff.data.attempted} attempted
                  </span>
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalAttempted}</p>
                <p className="text-xs text-gray-600">Total Attempted</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {difficulties.reduce((sum, d) => sum + d.data.solved, 0)}
                </p>
                <p className="text-xs text-gray-600">Total Solved</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalAttempted > 0
                    ? Math.round(
                        (difficulties.reduce((sum, d) => sum + d.data.solved, 0) / totalAttempted) * 100
                      )
                    : 0}%
                </p>
                <p className="text-xs text-gray-600">Overall Success</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DifficultyBreakdown;
