import { NextApiRequest, NextApiResponse } from 'next';
import jsonDb from '../../utils/jsonDb';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { invoiceId, status, amountPaid, paymentDate, paymentMethod, paymentNote } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ success: false, message: 'Invoice ID is required' });
    }

    // Find the invoice
    const invoices = jsonDb.find('invoices', { id: invoiceId });
    
    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const invoice = invoices[0];
    
    // Update invoice status
    const updatedInvoice = {
      ...invoice,
      status: status || invoice.status,
      amount_paid: amountPaid !== undefined ? amountPaid : invoice.amount_paid,
      updated_at: new Date().toISOString()
    };
    
    // Update the invoice in the database
    jsonDb.updateOne('invoices', 'id', invoiceId, updatedInvoice);
    
    // Record payment if amount is provided
    if (amountPaid > 0) {
      const payment = {
        id: `payment_${Date.now()}`,
        invoice_id: invoiceId,
        amount: amountPaid,
        payment_date: paymentDate || new Date().toISOString(),
        payment_method: paymentMethod || 'Other',
        note: paymentNote || '',
        created_at: new Date().toISOString()
      };
      
      // Ensure payments table exists
      const dataDir = path.join(process.cwd(), 'data');
      const paymentsPath = path.join(dataDir, 'payments.json');
      
      if (!fs.existsSync(paymentsPath)) {
        fs.writeFileSync(paymentsPath, JSON.stringify([], null, 2));
      }
      
      // Record the payment
      jsonDb.insertOne('payments', payment);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error updating invoice status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 