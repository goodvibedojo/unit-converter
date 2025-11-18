import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getAllCategories, getAllCompanies } from '../../utils/problemBank';
import useSubscription from '../../hooks/useSubscription';
import useAnalytics from '../../hooks/useAnalytics';
import TrialBanner from '../Subscription/TrialBanner';
import StatsCard from '../Analytics/StatsCard';
import PerformanceChart from '../Analytics/PerformanceChart';
import DifficultyBreakdown from '../Analytics/DifficultyBreakdown';
import CategoryRadar from '../Analytics/CategoryRadar';

export default function Dashboard() {
  const { currentUser, userProfile, logout } = useAuth();
  const { canStartInterview } = useSubscription();
  const { trackPageView } = useAnalytics();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track page view
  useEffect(() => {
    trackPageView('dashboard', 'Dashboard');
  }, [trackPageView]);

  useEffect(() => {
    fetchUserSessions();
  }, [currentUser]);

  async function fetchUserSessions() {
    if (!currentUser) return;

    try {
      const sessionsRef = collection(db, 'sessions');
      const q = query(
        sessionsRef,
        where('userId', '==', currentUser.uid),
        orderBy('startTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessionsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleStartInterview = () => {
    if (canStartInterview()) {
      navigate('/interview');
    } else {
      alert('Please subscribe to continue practicing interviews!');
      navigate('/pricing');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const stats = userProfile?.stats || {
    totalSessions: 0,
    completedSessions: 0,
    problemsSolved: 0,
    averageScore: 0,
    successRate: 0,
    totalCodingTime: 0,
    averageSessionDuration: 0,
    streakDays: 0,
    problemsByDifficulty: {
      easy: { attempted: 0, solved: 0 },
      medium: { attempted: 0, solved: 0 },
      hard: { attempted: 0, solved: 0 }
    },
    categoriesStats: {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">AI Mock Interview</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                History
              </Link>
              <Link
                to="/pricing"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Pricing
              </Link>
              <Link
                to="/subscription"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Subscription
              </Link>

              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{userProfile?.displayName}</span>
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-10">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    {userProfile?.email}
                  </div>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Trial Banner */}
      <TrialBanner />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            color="blue"
          />
          <StatsCard
            title="Problems Solved"
            value={stats.problemsSolved}
            subtitle={`${stats.successRate}% success rate`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="green"
          />
          <StatsCard
            title="Average Score"
            value={`${Math.round(stats.averageScore)}/100`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color="purple"
          />
          <StatsCard
            title="Coding Time"
            value={`${Math.round(stats.totalCodingTime)}h`}
            subtitle={`${stats.streakDays} day streak`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="yellow"
          />
        </div>

        {/* Start Interview CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to Practice?</h2>
              <p className="text-blue-100">
                Start a new AI-powered mock interview session
              </p>
            </div>
            <button
              onClick={handleStartInterview}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold shadow-md"
            >
              Start Interview
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PerformanceChart sessions={sessions} />
          <DifficultyBreakdown problemsByDifficulty={stats.problemsByDifficulty} />
        </div>

        <div className="mb-8">
          <CategoryRadar categoriesStats={stats.categoriesStats} />
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No sessions yet. Start your first interview!</p>
              </div>
            ) : (
              sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Problem: {session.problemId}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {session.startTime?.toDate().toLocaleDateString()} •{' '}
                        {session.language}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {session.testResults && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {session.testResults.passed}/{session.testResults.total} passed
                        </span>
                      )}
                      <Link
                        to={`/session/${session.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {sessions.length > 5 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <Link
                to="/history"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all sessions →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
