import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('clients')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection error', 
        error: error.message,
        details: error
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Database connection successful',
      data
    });
  } catch (error) {
    console.error('Error testing database:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: String(error) 
    });
  }
} 