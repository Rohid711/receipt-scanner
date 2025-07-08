import { NextPage } from 'next';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { useSubscription } from '../utils/SubscriptionContext';
import { createCheckoutSession, getStripeJs } from '../utils/stripe';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  id: 'starter' | 'pro';
  name: string;
  price: number;
  description: string;
  features: PlanFeature[];
  buttonText: string;
  isPopular?: boolean;
  stripePriceId: string;
}

const plans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 10,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!,
    description: 'Perfect for small businesses just getting started',
    features: [
      { name: 'Receipt Scanner (100/month)', included: true },
      { name: 'Client Management', included: true },
      { name: 'Job Tracking', included: true },
      { name: 'Excel Export', included: true },
      { name: 'Basic Dashboard', included: true },
      { name: 'Unlimited Receipt Scanning', included: false },
      { name: 'Unlimited Payroll', included: false },
      { name: 'Team Management', included: false },
      { name: 'Equipment Tracking', included: false },
      { name: 'Invoicing', included: false },
      { name: 'Advanced Reports', included: false },
      { name: 'Priority Support', included: false },
    ],
    buttonText: 'Start Free Trial',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 30,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
    description: 'For growing businesses that need more power',
    features: [
      { name: 'Unlimited Receipt Scanning', included: true },
      { name: 'Client Management', included: true },
      { name: 'Job Tracking', included: true },
      { name: 'Excel Export', included: true },
      { name: 'Basic Dashboard', included: true },
      { name: 'Unlimited Payroll', included: true },
      { name: 'Team Management', included: true },
      { name: 'Equipment Tracking', included: true },
      { name: 'Invoicing', included: true },
      { name: 'Advanced Reports', included: true },
      { name: 'Priority Support', included: true },
    ],
    buttonText: 'Get Started',
    isPopular: true,
  },
];

const PricingPage: NextPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { currentPlan } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  const handlePlanSelect = async (plan: PricingPlan) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      console.log('Starting checkout process for plan:', plan.id);
      console.log('User authenticated:', !!user);

      // Log the plan details to verify stripePriceId is available
      console.log('Selected plan details:', {
        id: plan.id,
        name: plan.name,
        stripePriceId: plan.stripePriceId
      });

      // Verify stripePriceId is not undefined or empty
      if (!plan.stripePriceId) {
        console.error('Error: stripePriceId is missing in the plan object');
        throw new Error('Missing price information. Please try again later.');
      }

      // Create Stripe checkout session
      const response = await createCheckoutSession(plan.stripePriceId);
      
      if (!response || !response.sessionId) {
        throw new Error('No session ID received from server');
      }

      const { sessionId } = response;
      console.log('Received session ID from server:', sessionId);

      // Redirect to Stripe Checkout
      const stripe = await getStripeJs();
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      console.log('Redirecting to Stripe checkout...');
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw stripeError;
      }
    } catch (err) {
      console.error('Error handling subscription:', err);
      setError(err instanceof Error ? `Subscription error: ${err.message}` : 'Failed to process subscription. Please try again.');
      
      // Add a refresh button if it's an authentication error
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        setSuccessMessage('Try refreshing the page and logging in again before selecting a plan.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  return (
    <div className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose the plan that's right for your business
            </p>
            {error && (
              <p className="mt-4 text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {successMessage && (
              <p className="mt-4 text-green-600 dark:text-green-400">
                {successMessage}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-card transition-shadow duration-300 overflow-hidden ${
                  plan.isPopular ? 'ring-2 ring-primary' : ''
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 mt-4 mr-4">
                    <span className="bg-primary text-white text-sm font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {currentPlan === plan.id && (
                  <div className="absolute top-0 left-0 mt-4 ml-4">
                    <span className="bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline mb-8">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">/month</span>
                  </div>

                  <button
                    onClick={() => handlePlanSelect(plan)}
                    disabled={isLoading || currentPlan === plan.id}
                    className={`w-full text-center py-3 px-6 rounded-lg font-medium transition-colors duration-200 mb-8 ${
                      isLoading
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                        : currentPlan === plan.id
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 cursor-not-allowed'
                        : plan.isPopular
                        ? 'bg-primary text-white hover:bg-primary-dark'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isLoading
                      ? 'Processing...'
                      : currentPlan === plan.id
                      ? 'Current Plan'
                      : plan.buttonText}
                  </button>

                  <div className="space-y-4">
                    {plan.features.map((feature) => (
                      <div
                        key={feature.name}
                        className="flex items-center text-gray-700 dark:text-gray-300"
                      >
                        {feature.included ? (
                          <FaCheck className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        ) : (
                          <FaTimes className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                        )}
                        <span>{feature.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-400">
              All plans include a 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage; 