import { NextApiRequest, NextApiResponse } from 'next';
import jsonDb from '../../utils/jsonDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        // Get invoice items by invoice_id
        if (req.query.invoice_id) {
          const invoiceId = req.query.invoice_id as string;
          console.log(`Fetching items for invoice ID: ${invoiceId}`);
          
          // Find items for this invoice
          const items = jsonDb.find('invoice_items', { invoice_id: invoiceId });
          
          if (!items || items.length === 0) {
            console.log(`No items found for invoice ID: ${invoiceId}`);
            return res.status(200).json({ success: true, data: [] });
          }
          
          console.log(`Found ${items.length} items for invoice ID: ${invoiceId}`);
          return res.status(200).json({ success: true, data: items });
        } else {
          // Get all invoice items
          const items = jsonDb.getAll('invoice_items');
          return res.status(200).json({ success: true, data: items });
        }

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in invoice-items API:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 