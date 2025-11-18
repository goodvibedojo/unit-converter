// TrialBanner Component
// Engineer 5 - Trial Status Banner

import { Link } from 'react-router-dom';
import useSubscription from '../../hooks/useSubscription';

const TrialBanner = () => {
  const { subscription, getRemainingTrialSessions, isTrialExpired } = useSubscription();

  // Don't show banner if user has active subscription
  if (!subscription || subscription.status === 'active') {
    return null;
  }

  // Don't show if not on trial
  if (subscription.status !== 'trial') {
    return null;
  }

  const remainingSessions = getRemainingTrialSessions();
  const isExpired = isTrialExpired();

  // Trial expired
  if (isExpired) {
    return (
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center flex-1">
              <span className="flex p-2 rounded-lg bg-red-800">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </span>
              <p className="ml-3 font-medium">
                Your free trial has ended. Subscribe to continue practicing!
              </p>
            </div>
            <div className="mt-2 flex-shrink-0 w-full sm:mt-0 sm:w-auto">
              <Link
                to="/pricing"
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Trial active
  const warningThreshold = 1; // Show warning when 1 session left
  const isWarning = remainingSessions <= warningThreshold;

  return (
    <div className={isWarning ? 'bg-yellow-500' : 'bg-blue-600'}>
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center flex-1">
            <span className={`flex p-2 rounded-lg ${isWarning ? 'bg-yellow-600' : 'bg-blue-800'}`}>
              {isWarning ? (
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </span>
            <p className="ml-3 font-medium text-white">
              {isWarning ? (
                <>Last free session remaining! Subscribe for unlimited access.</>
              ) : (
                <>
                  Free Trial: <strong>{remainingSessions}</strong> session
                  {remainingSessions !== 1 ? 's' : ''} remaining
                </>
              )}
            </p>
          </div>
          <div className="mt-2 flex-shrink-0 w-full sm:mt-0 sm:w-auto space-x-2">
            <Link
              to="/pricing"
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                isWarning
                  ? 'text-yellow-600 bg-white hover:bg-yellow-50'
                  : 'text-blue-600 bg-white hover:bg-blue-50'
              }`}
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;
