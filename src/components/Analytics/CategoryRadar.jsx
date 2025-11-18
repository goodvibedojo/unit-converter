// CategoryRadar Component
// Engineer 5 - Analytics Visualization

import { useMemo } from 'react';

/**
 * Radar chart showing performance by category
 * Simplified version - production would use a proper charting library
 */
const CategoryRadar = ({ categoriesStats }) => {
  const chartData = useMemo(() => {
    if (!categoriesStats) return [];

    // Get top 6 categories by attempt count
    return Object.entries(categoriesStats)
      .sort((a, b) => b[1].attempted - a[1].attempted)
      .slice(0, 6)
      .map(([category, stats]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
        score: stats.avgScore || 0,
        successRate: stats.attempted > 0 ? (stats.solved / stats.attempted) * 100 : 0
      }));
  }, [categoriesStats]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Category Performance
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No category data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Category Performance
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Your performance across different problem categories
      </p>

      {/* Category bars */}
      <div className="space-y-4">
        {chartData.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {item.category}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(item.successRate)}% success
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  item.successRate >= 75
                    ? 'bg-green-500'
                    : item.successRate >= 50
                    ? 'bg-blue-500'
                    : item.successRate >= 25
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${item.successRate}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Insights</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {chartData[0] && chartData[0].successRate >= 75 && (
            <li>✓ Strong performance in {chartData[0].category}</li>
          )}
          {chartData[chartData.length - 1] && chartData[chartData.length - 1].successRate < 50 && (
            <li>⚠ Focus on improving {chartData[chartData.length - 1].category}</li>
          )}
          {chartData.length >= 6 && (
            <li>📊 Showing top 6 categories by practice volume</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CategoryRadar;
