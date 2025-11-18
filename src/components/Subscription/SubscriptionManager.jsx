// SubscriptionManager Component
// Engineer 5 - Subscription Management Panel

import { useState } from 'react';
import useSubscription from '../../hooks/useSubscription';
import { formatPrice, getPlan } from '../../services/stripe';

const SubscriptionManager = () => {
  const {
    subscription,
    loading,
    manageSubscription,
    getStatusText,
    getDaysUntilRenewal
  } = useSubscription();

  const [actionLoading, setActionLoading] = useState(false);

  const handleManageSubscription = async () => {
    setActionLoading(true);
    try {
      await manageSubscription();
    } catch (error) {
      console.error('Error managing subscription:', error);
      alert('Failed to open subscription management. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No subscription information available.</p>
      </div>
    );
  }

  const currentPlan = subscription.plan ? getPlan(subscription.plan) : null;
  const daysUntilRenewal = getDaysUntilRenewal();

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">Subscription</h2>
      </div>

      <div className="p-6">
        {/* Trial Status */}
        {subscription.status === 'trial' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Free Trial</h3>
                <p className="text-blue-700 text-sm">
                  {subscription.trialSessionsTotal - subscription.trialSessionsUsed} of{' '}
                  {subscription.trialSessionsTotal} sessions remaining
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {subscription.trialSessionsTotal - subscription.trialSessionsUsed}
                </div>
                <div className="text-xs text-blue-600">left</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (subscription.trialSessionsUsed / subscription.trialSessionsTotal) * 100
                    }%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Active Subscription */}
        {subscription.status === 'active' && currentPlan && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {currentPlan.name}
                </h3>
                <p className="text-gray-600">
                  {formatPrice(currentPlan.price)} / {currentPlan.interval}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>

            {/* Renewal Info */}
            {daysUntilRenewal !== null && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  {subscription.cancelAtPeriodEnd ? (
                    <>
                      <span className="text-red-600 font-semibold">Expires in:</span>{' '}
                      {daysUntilRenewal} days
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">Renews in:</span> {daysUntilRenewal} days
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Inactive/Canceled Status */}
        {(subscription.status === 'inactive' || subscription.status === 'canceled') && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-1">
              {subscription.status === 'canceled' ? 'Subscription Canceled' : 'No Active Subscription'}
            </h3>
            <p className="text-gray-600 text-sm">
              Subscribe to get unlimited access to all features.
            </p>
          </div>
        )}

        {/* Past Due Status */}
        {subscription.status === 'past_due' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-1">Payment Past Due</h3>
            <p className="text-red-700 text-sm">
              Please update your payment method to continue your subscription.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {subscription.status === 'active' && (
            <button
              onClick={handleManageSubscription}
              disabled={actionLoading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Loading...' : 'Manage Subscription'}
            </button>
          )}

          {(subscription.status === 'trial' ||
            subscription.status === 'inactive' ||
            subscription.status === 'canceled') && (
            <a
              href="/pricing"
              className="block w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-indigo-700 transition-colors"
            >
              View Plans
            </a>
          )}

          {subscription.status === 'past_due' && (
            <button
              onClick={handleManageSubscription}
              disabled={actionLoading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400"
            >
              {actionLoading ? 'Loading...' : 'Update Payment Method'}
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Need help? Contact{' '}
            <a href="mailto:support@aimockinterview.com" className="text-indigo-600 hover:underline">
              support@aimockinterview.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;
