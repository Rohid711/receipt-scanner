import { NextApiRequest, NextApiResponse } from 'next';
import jsonDb from '../../utils/jsonDb';

// Define the Receipt interface for TypeScript
interface ReceiptItem {
  name: string;
  price: string;
}

interface Receipt {
  id: string;
  vendor: string;
  date: string;
  totalAmount: string;
  category: string;
  items: ReceiptItem[];
  status?: 'Reconciled' | 'Pending';
  notes?: string;
  createdAt?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          // Get single receipt
          const receipts = jsonDb.find('receipts', { id: req.query.id });
          
          if (!receipts || receipts.length === 0) {
            return res.status(404).json({ success: false, message: 'Receipt not found' });
          }
          
          // Get related job if job_id exists
          const receipt = receipts[0];
          let job = null;
          
          if (receipt.job_id) {
            const jobs = jsonDb.find('jobs', { id: receipt.job_id });
            if (jobs && jobs.length > 0) {
              job = jobs[0];
            }
          }
          
          return res.status(200).json({ 
            success: true, 
            data: { ...receipt, jobs: job }
          });
        }
        
        // Get receipts with optional filters
        let receipts = jsonDb.getAll('receipts');
        
        // Apply filters
        if (req.query.job_id) {
          receipts = receipts.filter(r => r.job_id === req.query.job_id);
        }
        if (req.query.vendor) {
          const vendorQuery = String(req.query.vendor).toLowerCase();
          receipts = receipts.filter(r => r.vendor && r.vendor.toLowerCase().includes(vendorQuery));
        }
        if (req.query.start_date) {
          const startDate = String(req.query.start_date);
          receipts = receipts.filter(r => r.date >= startDate);
        }
        if (req.query.end_date) {
          const endDate = String(req.query.end_date);
          receipts = receipts.filter(r => r.date <= endDate);
        }
        
        // Sort by date descending
        receipts = receipts.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
        
        // Add job information
        const jobs = jsonDb.getAll('jobs');
        const receiptsWithJobs = receipts.map(receipt => {
          let job = null;
          if (receipt.job_id) {
            job = jobs.find(j => j.id === receipt.job_id);
          }
          return { ...receipt, jobs: job };
        });
        
        return res.status(200).json({ success: true, data: receiptsWithJobs });

      case 'POST':
        // Create new receipt
        const newReceipt = {
          ...req.body,
          id: req.body.id || `receipt_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const createdReceipt = jsonDb.insertOne('receipts', newReceipt);
        
        return res.status(201).json({ 
          success: true, 
          data: createdReceipt
        });

      case 'PUT':
        // Update receipt
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Receipt ID is required' });
        }
        
        const updates = {
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        
        const updatedReceipt = jsonDb.updateOne('receipts', 'id', String(req.query.id), updates);
        
        if (!updatedReceipt) {
          return res.status(404).json({ success: false, message: 'Receipt not found' });
        }
        
        return res.status(200).json({ success: true, data: updatedReceipt });

      case 'DELETE':
        // Delete receipt
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Receipt ID is required' });
        }
        
        const deleted = jsonDb.deleteOne('receipts', 'id', String(req.query.id));
        
        if (!deleted) {
          return res.status(404).json({ success: false, message: 'Receipt not found' });
        }
        
        return res.status(200).json({ success: true, message: 'Receipt deleted successfully' });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in receipts API:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
} 