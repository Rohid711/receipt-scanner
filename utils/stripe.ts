import { loadStripe } from '@stripe/stripe-js';
import { auth } from './firebase';
import { getIdToken } from 'firebase/auth';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export const getStripeJs = async () => {
  const stripe = await stripePromise;
  return stripe;
};

export const createCheckoutSession = async (priceId: string) => {
  try {
    // Add validation to ensure priceId is provided
    if (!priceId) {
      console.error('Error: No priceId provided to createCheckoutSession');
      throw new Error('Missing price ID for subscription');
    }

    console.log('Creating checkout session with priceId:', priceId);

    // Try to get user email from Firebase auth if available
    let email = null;
    let token = null;
    try {
      const currentUser = auth.currentUser;
      if (currentUser?.email) {
        email = currentUser.email;
        token = await getIdToken(currentUser);
      }
    } catch (err) {
      console.log('Could not get user session, continuing without authentication');
    }

    // Ensure priceId is passed correctly in the request body
    const requestBody = { 
      priceId,
      email
    };
    
    console.log('Sending request body:', requestBody);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if we have a token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Checkout session error:', errorData);
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

    const session = await response.json();
    console.log('Received session:', session);
    return session;
  } catch (error) {
    console.error('Error in createCheckoutSession:', error);
    throw error;
  }
};

export const createPortalSession = async () => {
  // Check if user is authenticated before making the request
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to access the customer portal');
  }
  
  try {
    // Get the Firebase ID token for authentication
    const token = await getIdToken(currentUser);
    
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Portal session error:', errorData);
      throw new Error(errorData.message || 'Failed to create portal session');
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error in createPortalSession:', error);
    throw error;
  }
}; 