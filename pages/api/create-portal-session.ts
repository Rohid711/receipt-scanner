import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { auth } from '../../utils/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the Firebase token
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get user's Stripe customer ID from Firestore
    const db = getFirestore();
    const profileRef = doc(db, 'profiles', decodedToken.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists() || !profileSnap.data().stripe_customer_id) {
      return res.status(400).json({ message: 'No Stripe customer found' });
    }

    const stripeCustomerId = profileSnap.data().stripe_customer_id;

    // Create Stripe portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 