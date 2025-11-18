// AdminPanel Component
// Engineer 5 - Admin Dashboard for Data Management

import { useState } from 'react';
import {
  seedAllProblems,
  seedProblemsByDifficulty,
  checkExistingProblems,
  clearAllProblems,
  displayProblemStats,
  validateProblems
} from '../../utils/seedDatabase';
import { getProblemStats } from '../../utils/extendedProblemBank';

const AdminPanel = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [existingCount, setExistingCount] = useState(null);

  const stats = getProblemStats();

  const handleCheckExisting = async () => {
    setLoading(true);
    setMessage('');
    try {
      const count = await checkExistingProblems();
      setExistingCount(count);
      setMessage(`Found ${count} existing problems in database`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedAll = async () => {
    if (!window.confirm('This will seed all problems to Firestore. Continue?')) {
      return;
    }

    setLoading(true);
    setMessage('Seeding problems...');
    try {
      const result = await seedAllProblems();
      setMessage(`✅ Successfully seeded ${result.success} problems!`);
      handleCheckExisting();
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedByDifficulty = async (difficulty) => {
    if (!window.confirm(`Seed all ${difficulty} problems?`)) {
      return;
    }

    setLoading(true);
    setMessage(`Seeding ${difficulty} problems...`);
    try {
      const result = await seedProblemsByDifficulty(difficulty);
      setMessage(`✅ Successfully seeded ${result.success} ${difficulty} problems!`);
      handleCheckExisting();
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL problems from Firestore! Are you sure?')) {
      return;
    }

    if (!window.confirm('This action cannot be undone. Continue?')) {
      return;
    }

    setLoading(true);
    setMessage('Clearing all problems...');
    try {
      await clearAllProblems();
      setMessage('✅ All problems cleared from database');
      setExistingCount(0);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = () => {
    const errors = validateProblems();
    if (errors.length === 0) {
      setMessage('✅ All problems validated successfully!');
    } else {
      setMessage(`❌ Found ${errors.length} validation errors. Check console for details.`);
      console.error('Validation errors:', errors);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Admin Panel</h1>
            </div>
            <div className="flex items-center">
              <a href="/dashboard" className="text-blue-600 hover:text-blue-700">
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Admin Access Only</strong> - These operations will modify the production database. Use with caution!
              </p>
            </div>
          </div>
        </div>

        {/* Problem Statistics */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Problem Bank Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total Problems</p>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Easy</p>
              <p className="text-3xl font-bold text-green-900">{stats.byDifficulty.easy}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600 font-medium">Medium</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.byDifficulty.medium}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">Hard</p>
              <p className="text-3xl font-bold text-red-900">{stats.byDifficulty.hard}</p>
            </div>
          </div>

          {existingCount !== null && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>{existingCount}</strong> problems currently in Firestore
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Database Operations</h2>

          <div className="space-y-4">
            {/* Check Existing */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">Check Database</h3>
                <p className="text-sm text-gray-600">Check how many problems are in Firestore</p>
              </div>
              <button
                onClick={handleCheckExisting}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Check
              </button>
            </div>

            {/* Validate */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">Validate Problems</h3>
                <p className="text-sm text-gray-600">Validate all problems have required fields</p>
              </div>
              <button
                onClick={handleValidate}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Validate
              </button>
            </div>

            {/* Seed All */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">Seed All Problems</h3>
                <p className="text-sm text-gray-600">Import all {stats.total} problems to Firestore</p>
              </div>
              <button
                onClick={handleSeedAll}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Seed All
              </button>
            </div>

            {/* Seed by Difficulty */}
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">Seed by Difficulty</h3>
                <p className="text-sm text-gray-600">Import problems for a specific difficulty level</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleSeedByDifficulty('easy')}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  Easy
                </button>
                <button
                  onClick={() => handleSeedByDifficulty('medium')}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  Medium
                </button>
                <button
                  onClick={() => handleSeedByDifficulty('hard')}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  Hard
                </button>
              </div>
            </div>

            {/* Clear All */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-red-900">⚠️ Clear All Problems</h3>
                <p className="text-sm text-red-700">Delete ALL problems from Firestore (DANGER!)</p>
              </div>
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.startsWith('✅') ? 'bg-green-50 text-green-800' :
            message.startsWith('❌') ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-lg font-medium">Processing...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
