import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin if it hasn't been initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

const STARTER_PRICE_ID = process.env.STRIPE_STARTER_PRICE_ID!;
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Processing checkout request...');
    
    // Check for priceId in request body
    const { priceId, email } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ 
        message: 'Missing priceId in request body',
        details: 'The request must include a valid price ID.'
      });
    }
    
    console.log('Received price ID:', priceId);
    
    // Validate price ID
    if (priceId !== STARTER_PRICE_ID && priceId !== PRO_PRICE_ID) {
      console.log('Invalid price ID:', { received: priceId, expected: [STARTER_PRICE_ID, PRO_PRICE_ID] });
      return res.status(400).json({ 
        message: 'Invalid price ID',
        details: 'The provided price ID is not recognized.'
      });
    }

    // Try to get user from Firebase auth but don't require it
    let userEmail = email;
    let userId = null;
    
    try {
      // Get the authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token
        const token = authHeader.split(' ')[1];
        
        // Verify the Firebase token
        const decodedToken = await getAuth().verifyIdToken(token);
        userId = decodedToken.uid;
        userEmail = decodedToken.email || email;
        console.log('Found authenticated user:', userId);
      }
    } catch (err) {
      console.log('No authenticated user found, continuing as guest checkout');
    }
    
    if (!userEmail) {
      return res.status(400).json({
        message: 'Missing email',
        details: 'An email address is required for checkout'
      });
    }

    console.log('Creating Stripe checkout session...');

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      metadata: userId ? { userId } : undefined,
    });

    console.log('Checkout session created:', { sessionId: checkoutSession.id });

    return res.status(200).json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'There was a problem processing your request. Please try again later.'
    });
  }
} 