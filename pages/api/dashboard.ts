import type { NextApiRequest, NextApiResponse } from 'next';
import jsonDb from '../../utils/jsonDb';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Ensure receipts.json exists
    const receiptsPath = path.join(dataDir, 'receipts.json');
    if (!fs.existsSync(receiptsPath)) {
      fs.writeFileSync(receiptsPath, '[]', 'utf8');
    }
    
    // Get receipts from JSON database with fallback
    let receipts = [];
    try {
      receipts = jsonDb.getAll('receipts') || [];
    } catch (err) {
      console.error('Error reading receipts:', err);
      receipts = [];
    }
    
    // Count receipts for dashboard stats
    const receiptCount = receipts.length;
    const pendingReceiptCount = receipts.filter(r => r.status === 'Pending').length;
    
    // Get recent receipts for dashboard
    const recentReceipts = receipts
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
    
    // Calculate total expenses
    const totalExpenses = receipts.reduce((sum, receipt) => {
      // Remove currency symbol and convert to number
      const amount = parseFloat((receipt.totalAmount || '0').toString().replace(/[^0-9.-]+/g, '')) || 0;
      return sum + amount;
    }, 0);
    
    res.status(200).json({
      receiptCount,
      pendingReceiptCount,
      recentReceipts,
      totalExpenses // Send as number, let client format it
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    
    // Return a fallback response
    res.status(200).json({
      receiptCount: 0,
      pendingReceiptCount: 0,
      recentReceipts: [],
      totalExpenses: 0
    });
  }
} 