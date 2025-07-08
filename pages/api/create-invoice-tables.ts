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
    // Check if tables already exist
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

    // Create invoices table
    const { error: createInvoicesError } = await supabase.from('_tables').insert({
      name: 'invoices',
      columns: [
        { name: 'id', type: 'bigint', primaryKey: true, identity: true },
        { name: 'client_id', type: 'bigint', references: 'clients(id)', onDelete: 'cascade' },
        { name: 'job_id', type: 'bigint', references: 'jobs(id)', onDelete: 'set null', nullable: true },
        { name: 'invoice_number', type: 'text', nullable: false },
        { name: 'invoice_date', type: 'date', nullable: false },
        { name: 'due_date', type: 'date', nullable: false },
        { name: 'subtotal', type: 'decimal(10,2)', nullable: false },
        { name: 'tax_rate', type: 'decimal(5,2)', nullable: false, default: 0 },
        { name: 'tax_amount', type: 'decimal(10,2)', nullable: false, default: 0 },
        { name: 'total_amount', type: 'decimal(10,2)', nullable: false },
        { name: 'amount_paid', type: 'decimal(10,2)', nullable: false, default: 0 },
        { name: 'status', type: 'text', nullable: false, default: "'Draft'" },
        { name: 'notes', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
        { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' }
      ]
    });

    if (createInvoicesError) {
      console.error('Error creating invoices table:', createInvoicesError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create invoices table',
        error: createInvoicesError.message
      });
    }

    // Create invoice_items table
    const { error: createItemsError } = await supabase.from('_tables').insert({
      name: 'invoice_items',
      columns: [
        { name: 'id', type: 'bigint', primaryKey: true, identity: true },
        { name: 'invoice_id', type: 'bigint', references: 'invoices(id)', onDelete: 'cascade' },
        { name: 'description', type: 'text', nullable: false },
        { name: 'quantity', type: 'integer', nullable: false },
        { name: 'rate', type: 'decimal(10,2)', nullable: false },
        { name: 'amount', type: 'decimal(10,2)', nullable: false },
        { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
        { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' }
      ]
    });

    if (createItemsError) {
      console.error('Error creating invoice_items table:', createItemsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create invoice_items table',
        error: createItemsError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice tables created successfully'
    });
  } catch (error: any) {
    console.error('Error creating invoice tables:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create invoice tables',
      error: error.message
    });
  }
} 