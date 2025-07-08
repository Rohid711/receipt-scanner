import type { NextApiRequest, NextApiResponse } from 'next';
import jsonDb from '../../utils/jsonDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      await getEmails(req, res);
      break;
    case 'POST':
      await saveEmail(req, res);
      break;
    case 'DELETE':
      await deleteEmail(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

/**
 * Get email history
 */
async function getEmails(req: NextApiRequest, res: NextApiResponse) {
  try {
    const emails = jsonDb.getAll('emails');
    res.status(200).json(emails);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Save email to history
 */
async function saveEmail(req: NextApiRequest, res: NextApiResponse) {
  try {
    const emailData = req.body;
    
    // Validate required fields
    if (!emailData.to || !emailData.subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Add ID and timestamp if not provided
    const emailToSave = {
      ...emailData,
      id: emailData.id || Date.now().toString(),
      sentAt: emailData.sentAt || new Date().toISOString()
    };
    
    // Save to database
    const savedEmail = jsonDb.insertOne('emails', emailToSave);
    
    res.status(201).json(savedEmail);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Delete email from history
 */
async function deleteEmail(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Email ID is required' });
    }
    
    // Delete from database
    const deleted = jsonDb.deleteOne('emails', 'id', id as string);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    res.status(200).json({ success: true, message: 'Email deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
} 