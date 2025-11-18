// PerformanceChart Component
// Engineer 5 - Analytics Visualization

import { useMemo } from 'react';

/**
 * Simple performance chart showing score trends
 * In production, would use a charting library like Recharts or Chart.js
 */
const PerformanceChart = ({ sessions }) => {
  const chartData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    // Take last 10 sessions
    return sessions
      .slice(-10)
      .map((session, index) => ({
        index: index + 1,
        score: session.metrics?.overallScore || 0,
        date: session.endTime?.toDate?.() || new Date()
      }));
  }, [sessions]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Trend
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          <p>No session data available</p>
        </div>
      </div>
    );
  }

  const maxScore = 100;
  const minScore = 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Performance Trend
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Your score progression over the last {chartData.length} sessions
      </p>

      {/* Simple SVG chart */}
      <div className="relative h-48">
        <svg className="w-full h-full" viewBox="0 0 400 160">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={160 - (y * 160) / 100}
              x2="400"
              y2={160 - (y * 160) / 100}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}

          {/* Line chart */}
          {chartData.length > 1 && (
            <polyline
              fill="none"
              stroke="#4F46E5"
              strokeWidth="2"
              points={chartData
                .map((point, index) => {
                  const x = (index / (chartData.length - 1)) * 380 + 10;
                  const y = 160 - ((point.score / maxScore) * 140 + 10);
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          )}

          {/* Data points */}
          {chartData.map((point, index) => {
            const x = (index / (chartData.length - 1 || 1)) * 380 + 10;
            const y = 160 - ((point.score / maxScore) * 140 + 10);

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#4F46E5"
                  className="hover:r-6 transition-all cursor-pointer"
                />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {point.score}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></div>
          <span>Overall Score</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
