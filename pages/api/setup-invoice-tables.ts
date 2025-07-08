import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to execute SQL with fallbacks
async function executeSql(sql: string): Promise<{ success: boolean; error?: any }> {
  try {
    // Try direct SQL execution if available
    const { error } = await supabase.rpc('exec', { sql });
    if (!error) return { success: true };
    return { success: false, error };
  } catch (e1) {
    try {
      // Try alternative function name
      const { error } = await supabase.rpc('_exec', { sql });
      if (!error) return { success: true };
      return { success: false, error };
    } catch (e2) {
      try {
        // Try with query parameter
        const { error } = await supabase.rpc('exec', { query: sql });
        if (!error) return { success: true };
        return { success: false, error };
      } catch (e3) {
        return { success: false, error: e3 };
      }
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // First check if tables already exist
    const { error: checkError } = await supabase
      .from('invoices')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      return res.status(200).json({ 
        success: true, 
        message: 'Invoice tables already exist'
      });
    }

    // Create the tables using multiple SQL statements
    // We need to do this in steps since the Supabase client doesn't support multiple SQL statements

    // Step 1: Create invoices table
    const createInvoicesTableSQL = `
      CREATE TABLE IF NOT EXISTS invoices (
        id BIGSERIAL PRIMARY KEY,
        client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
        job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
        invoice_number TEXT NOT NULL,
        invoice_date DATE NOT NULL,
        due_date DATE NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Draft',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
      )
    `;

    const invoicesResult = await executeSql(createInvoicesTableSQL);
    if (!invoicesResult.success) {
      console.error('Error creating invoices table:', invoicesResult.error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create invoices table', 
        error: typeof invoicesResult.error === 'object' ? 
          ((invoicesResult.error as any).message || JSON.stringify(invoicesResult.error)) : 
          String(invoicesResult.error) 
      });
    }

    // Step 2: Create invoice_items table
    const createItemsTableSQL = `
      CREATE TABLE IF NOT EXISTS invoice_items (
        id BIGSERIAL PRIMARY KEY,
        invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        rate DECIMAL(10,2) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
      )
    `;

    const itemsResult = await executeSql(createItemsTableSQL);
    if (!itemsResult.success) {
      console.error('Error creating invoice_items table:', itemsResult.error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create invoice_items table', 
        error: typeof itemsResult.error === 'object' ? 
          ((itemsResult.error as any).message || JSON.stringify(itemsResult.error)) : 
          String(itemsResult.error) 
      });
    }

    // Step 3: Create indexes
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices(job_id);
      CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id)
    `;

    const indexesResult = await executeSql(createIndexesSQL);
    if (!indexesResult.success) {
      console.error('Error creating indexes:', indexesResult.error);
      // Not critical, continue
    }

    // Step 4: Enable RLS
    const enableRLSSQL = `
      ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
      ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY
    `;

    const rlsResult = await executeSql(enableRLSSQL);
    if (!rlsResult.success) {
      console.error('Error enabling RLS:', rlsResult.error);
      // Not critical, continue
    }

    // Step 5: Create policies
    const createPoliciesSQL = `
      CREATE POLICY "Enable read access for all users" ON invoices FOR SELECT USING (true);
      CREATE POLICY "Enable insert access for all users" ON invoices FOR INSERT WITH CHECK (true);
      CREATE POLICY "Enable update access for all users" ON invoices FOR UPDATE USING (true);
      CREATE POLICY "Enable delete access for all users" ON invoices FOR DELETE USING (true)
    `;

    const policiesResult = await executeSql(createPoliciesSQL);
    if (!policiesResult.success) {
      console.error('Error creating policies for invoices:', policiesResult.error);
      // Not critical, continue
    }

    const createItemPoliciesSQL = `
      CREATE POLICY "Enable read access for all users" ON invoice_items FOR SELECT USING (true);
      CREATE POLICY "Enable insert access for all users" ON invoice_items FOR INSERT WITH CHECK (true);
      CREATE POLICY "Enable update access for all users" ON invoice_items FOR UPDATE USING (true);
      CREATE POLICY "Enable delete access for all users" ON invoice_items FOR DELETE USING (true)
    `;

    const itemPoliciesResult = await executeSql(createItemPoliciesSQL);
    if (!itemPoliciesResult.success) {
      console.error('Error creating policies for invoice_items:', itemPoliciesResult.error);
      // Not critical, continue
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Invoice tables created successfully' 
    });
  } catch (error: any) {
    console.error('Error setting up invoice tables:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to set up invoice tables', 
      error: error.message 
    });
  }
} 