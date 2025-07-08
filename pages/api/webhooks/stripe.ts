import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// Disable body parsing, need the raw body for Stripe webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature']!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.error('Error verifying webhook signature:', err);
      return res.status(400).json({ message: 'Webhook signature verification failed' });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.userId;

        if (!userId) {
          throw new Error('No user ID in session metadata');
        }

        // Update user's profile with Stripe customer ID and subscription info
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
            // Set the plan based on the price ID
            plan: session.metadata?.priceId === process.env.STRIPE_PRO_PRICE_ID ? 'pro' : 'starter',
          })
          .eq('id', userId);

        if (updateError) {
          throw updateError;
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get the user profile with this subscription ID
        const { data: profiles, error: fetchError } = await supabase
          .from('profiles')
          .select()
          .eq('stripe_subscription_id', subscription.id);

        if (fetchError || !profiles?.length) {
          throw new Error('Failed to find user profile for subscription');
        }

        // Update subscription status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            // Update plan if price has changed
            plan: subscription.items.data[0].price.id === process.env.STRIPE_PRO_PRICE_ID ? 'pro' : 'starter',
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          throw updateError;
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Update user's profile when subscription is cancelled
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            plan: null,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          throw updateError;
        }
        break;
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ message: 'Webhook handler failed' });
  }
} 