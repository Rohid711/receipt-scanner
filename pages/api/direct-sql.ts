import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // First create a stored procedure to execute our SQL
    const createProcedureResult = await supabase
      .from('_functions')
      .select('name')
      .eq('name', 'create_invoice_tables')
      .maybeSingle();

    if (!createProcedureResult.data) {
      // Create the stored procedure if it doesn't exist
      const { error: procError } = await supabase.rpc('create_function', {
        name: 'create_invoice_tables',
        body: `
BEGIN
  -- Create invoices table
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
  );

  -- Create invoice_items table
  CREATE TABLE IF NOT EXISTS invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices(job_id);
  CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

  -- Enable RLS
  ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
  ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

  -- Create policies
  CREATE POLICY "Enable read access for all users" ON invoices FOR SELECT USING (true);
  CREATE POLICY "Enable insert access for all users" ON invoices FOR INSERT WITH CHECK (true);
  CREATE POLICY "Enable update access for all users" ON invoices FOR UPDATE USING (true);
  CREATE POLICY "Enable delete access for all users" ON invoices FOR DELETE USING (true);

  CREATE POLICY "Enable read access for all users" ON invoice_items FOR SELECT USING (true);
  CREATE POLICY "Enable insert access for all users" ON invoice_items FOR INSERT WITH CHECK (true);
  CREATE POLICY "Enable update access for all users" ON invoice_items FOR UPDATE USING (true);
  CREATE POLICY "Enable delete access for all users" ON invoice_items FOR DELETE USING (true);

  RETURN 'Tables created successfully';
END;
        `,
        returns: 'text'
      });

      if (procError) {
        console.error('Error creating procedure:', procError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create stored procedure',
          error: procError.message
        });
      }
    }

    // Execute the stored procedure
    const { data, error } = await supabase.rpc('create_invoice_tables');

    if (error) {
      console.error('Error executing procedure:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create tables',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice tables created successfully',
      result: data
    });
  } catch (error: any) {
    console.error('Error in direct SQL execution:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute SQL',
      error: error.message
    });
  }
} 