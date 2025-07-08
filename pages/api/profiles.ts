import type { NextApiRequest, NextApiResponse } from 'next';
import jsonDb from '../../utils/jsonDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      await getProfiles(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

/**
 * Get profiles
 */
async function getProfiles(req: NextApiRequest, res: NextApiResponse) {
  try {
    const profiles = jsonDb.getAll('profiles');
    res.status(200).json(profiles || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
} 