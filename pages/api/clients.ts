import { NextApiRequest, NextApiResponse } from 'next';
import jsonDb from '../../utils/jsonDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          // Get a single client by ID
          const clients = jsonDb.find('clients', { id: req.query.id });
          
          if (!clients || clients.length === 0) {
            return res.status(404).json({ success: false, message: 'Client not found' });
          }
          
          return res.status(200).json({ success: true, data: clients[0] });
        } else {
          // Get all clients
          const clients = jsonDb.getAll('clients');
          
          // Sort by name
          const sortedClients = clients.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
          
          return res.status(200).json({ success: true, data: sortedClients });
        }

      case 'POST':
        // Create a new client
        const newClient = {
          ...req.body,
          id: req.body.id || `client_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          active_jobs: 0,
          total_spent: 0
        };
        
        const createdClient = jsonDb.insertOne('clients', newClient);
        
        return res.status(201).json({ 
          success: true, 
          data: createdClient
        });

      case 'PUT':
        // Update a client
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Client ID is required' });
        }
        
        const updates = {
          ...req.body,
          updated_at: new Date().toISOString()
        };
        
        const updatedClient = jsonDb.updateOne('clients', 'id', String(req.query.id), updates);
        
        if (!updatedClient) {
          return res.status(404).json({ success: false, message: 'Client not found' });
        }
        
        return res.status(200).json({ success: true, data: updatedClient });

      case 'DELETE':
        // Delete a client
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Client ID is required' });
        }
        
        const deleted = jsonDb.deleteOne('clients', 'id', String(req.query.id));
        
        if (!deleted) {
          return res.status(404).json({ success: false, message: 'Client not found' });
        }
        
        return res.status(200).json({ success: true, message: 'Client deleted successfully' });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in clients API:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
} 