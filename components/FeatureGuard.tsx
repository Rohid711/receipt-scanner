import { ReactNode } from 'react';
import { useSubscription } from '../utils/SubscriptionContext';
import Link from 'next/link';

interface FeatureGuardProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function FeatureGuard({ feature, children, fallback }: FeatureGuardProps) {
  const { hasFeatureAccess, currentPlan } = useSubscription();

  if (!hasFeatureAccess(feature)) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
          This feature is not available in your current plan ({currentPlan || 'no plan'}).
        </p>
        <Link
          href="/pricing"
          className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary"
        >
          Upgrade your plan
        </Link>
      </div>
    );
  }

  return <>{children}</>;
} 