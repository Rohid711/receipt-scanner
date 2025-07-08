import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type PlanType = 'starter' | 'pro' | null;

interface PlanFeatures {
  [key: string]: {
    starter: boolean;
    pro: boolean;
    limit?: {
      starter: number;
      pro: number;
    };
  };
}

export const PLAN_FEATURES: PlanFeatures = {
  'receipt-scanner': {
    starter: true,
    pro: true,
    limit: {
      starter: 100,
      pro: Infinity
    }
  },
  'client-management': {
    starter: true,
    pro: true
  },
  'job-tracking': {
    starter: true,
    pro: true
  },
  'excel-export': {
    starter: true,
    pro: true
  },
  'basic-dashboard': {
    starter: true,
    pro: true
  },
  'unlimited-receipt-scanning': {
    starter: false,
    pro: true
  },
  'unlimited-payroll': {
    starter: false,
    pro: true
  },
  'team-management': {
    starter: false,
    pro: true
  },
  'equipment-tracking': {
    starter: false,
    pro: true
  },
  'invoicing': {
    starter: false,
    pro: true
  },
  'advanced-reports': {
    starter: false,
    pro: true
  },
  'priority-support': {
    starter: false,
    pro: true
  }
};

interface UsageData {
  currentUsage: number;
  limit: number;
  remaining: number;
  canUseFeature: boolean;
}

interface SubscriptionContextType {
  currentPlan: PlanType;
  hasFeatureAccess: (feature: string) => boolean;
  getFeatureLimit: (feature: string) => number;
  isFeatureLimited: (feature: string) => boolean;
  checkFeatureUsage: (feature: string) => Promise<UsageData>;
  incrementFeatureUsage: (feature: string) => Promise<UsageData | null>;
  featureUsage: Record<string, UsageData | null>;
  isLoadingUsage: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [featureUsage, setFeatureUsage] = useState<Record<string, UsageData | null>>({});
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  
  // In a real app, you would get this from your backend/database
  // For now, we'll use a default plan or get it from user's displayName as a workaround
  const currentPlan = (user?.displayName?.includes('pro') ? 'pro' : 'starter') as PlanType;

  // Load receipt scanner usage on component mount
  useEffect(() => {
    if (user) {
      checkFeatureUsage('receipt-scanner').catch(console.error);
    }
  }, [user]);

  const hasFeatureAccess = (feature: string): boolean => {
    if (!currentPlan || !PLAN_FEATURES[feature]) return false;
    return PLAN_FEATURES[feature][currentPlan];
  };

  const getFeatureLimit = (feature: string): number => {
    if (!currentPlan || !PLAN_FEATURES[feature]?.limit) return 0;
    return PLAN_FEATURES[feature].limit![currentPlan];
  };

  const isFeatureLimited = (feature: string): boolean => {
    if (!currentPlan || !PLAN_FEATURES[feature]) return true;
    const limit = PLAN_FEATURES[feature].limit?.[currentPlan];
    return limit !== undefined && limit !== Infinity;
  };

  const checkFeatureUsage = async (feature: string): Promise<UsageData> => {
    if (!user) {
      return { currentUsage: 0, limit: 0, remaining: 0, canUseFeature: false };
    }

    setIsLoadingUsage(true);
    try {
      const response = await fetch(`/api/${feature}-usage`);
      if (!response.ok) {
        throw new Error(`Failed to fetch usage data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setFeatureUsage(prev => ({ ...prev, [feature]: data.data }));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch usage data');
      }
    } catch (error) {
      console.error(`Error checking ${feature} usage:`, error);
      return { currentUsage: 0, limit: getFeatureLimit(feature), remaining: getFeatureLimit(feature), canUseFeature: true };
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const incrementFeatureUsage = async (feature: string): Promise<UsageData | null> => {
    if (!user) {
      return null;
    }

    setIsLoadingUsage(true);
    try {
      const response = await fetch(`/api/${feature}-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setFeatureUsage(prev => ({ ...prev, [feature]: data.data }));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update usage data');
      }
    } catch (error) {
      console.error(`Error incrementing ${feature} usage:`, error);
      return null;
    } finally {
      setIsLoadingUsage(false);
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      currentPlan,
      hasFeatureAccess,
      getFeatureLimit,
      isFeatureLimited,
      checkFeatureUsage,
      incrementFeatureUsage,
      featureUsage,
      isLoadingUsage
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
} 