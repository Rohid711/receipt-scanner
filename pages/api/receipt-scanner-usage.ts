import { NextApiRequest, NextApiResponse } from 'next';
import { PLAN_FEATURES } from '../../utils/SubscriptionContext';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, collection, doc, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { db } from '../../utils/firebase';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get user from Firebase auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized. Please sign in.',
        canUseFeature: false
      });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the Firebase token
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid authentication token',
        canUseFeature: false
      });
    }

    const userId = decodedToken.uid;

    // Get user profile to check subscription plan
    const profileRef = doc(db, 'profiles', userId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      console.error('User profile not found');
      return res.status(404).json({ 
        success: false, 
        message: 'User profile not found',
        canUseFeature: false
      });
    }

    const userPlan = profileSnap.data()?.plan || 'starter';
    
    // Get the limit based on the user's plan
    const receiptScannerLimits = PLAN_FEATURES['receipt-scanner'].limit;
    const userLimit = receiptScannerLimits ? receiptScannerLimits[userPlan as 'starter' | 'pro'] : 0;

    // Check if it's a GET request to check usage
    if (req.method === 'GET') {
      const currentMonth = getCurrentMonth();
      const usageRef = doc(db, 'receipt_scanner_usage', `${userId}_${currentMonth}`);
      const usageSnap = await getDoc(usageRef);

      const currentUsage = usageSnap.exists() ? usageSnap.data()?.count || 0 : 0;
      const canUseFeature = currentUsage < userLimit;

      return res.status(200).json({
        success: true,
        data: {
          currentUsage,
          limit: userLimit,
          remaining: Math.max(0, userLimit - currentUsage),
          canUseFeature
        }
      });
    }
    
    // Check if it's a POST request to increment usage
    else if (req.method === 'POST') {
      // First, get current usage for this month
      const currentMonth = getCurrentMonth();
      const usageRef = doc(db, 'receipt_scanner_usage', `${userId}_${currentMonth}`);
      const usageSnap = await getDoc(usageRef);

      const currentUsage = usageSnap.exists() ? usageSnap.data()?.count || 0 : 0;

      // Check if user has reached their limit
      if (currentUsage >= userLimit) {
        return res.status(403).json({
          success: false,
          message: 'You have reached your monthly limit. Please upgrade your plan or wait until next month.',
          canUseFeature: false,
          data: {
            currentUsage,
            limit: userLimit,
            remaining: 0
          }
        });
      }

      // Increment usage count
      await setDoc(usageRef, { 
        user_id: userId, 
        month: currentMonth,
        count: currentUsage + 1
      }, { merge: true });

      // Return updated usage data
      return res.status(200).json({
        success: true,
        data: {
          currentUsage: currentUsage + 1,
          limit: userLimit,
          remaining: userLimit - (currentUsage + 1),
          canUseFeature: true
        }
      });
    }
    
    // Handle other HTTP methods
    else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in receipt-scanner-usage API:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: String(error),
      canUseFeature: false
    });
  }
}

// Helper function to get current month in YYYY-MM format
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
} 