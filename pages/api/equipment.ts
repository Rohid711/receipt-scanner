import { NextApiRequest, NextApiResponse } from 'next';
import jsonDb from '../../utils/jsonDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          // Get single equipment by id
          const equipmentItems = jsonDb.find('equipment', { id: req.query.id });
          
          if (!equipmentItems || equipmentItems.length === 0) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
          }
          
          return res.status(200).json({ success: true, data: equipmentItems[0] });
        }
        
        // Get all equipment with optional filters
        let equipment = jsonDb.getAll('equipment');
        
        // Apply filters if provided
        if (req.query.type) {
          equipment = equipment.filter(e => e.type === req.query.type);
        }
        if (req.query.status) {
          equipment = equipment.filter(e => e.status === req.query.status);
        }
        
        // Sort by name
        equipment = equipment.sort((a, b) => a.name.localeCompare(b.name));
        
        return res.status(200).json({ success: true, data: equipment });

      case 'POST':
        // Create new equipment
        const newEquipment = {
          ...req.body,
          id: req.body.id || `equipment_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const createdEquipment = jsonDb.insertOne('equipment', newEquipment);
        
        return res.status(201).json({ 
          success: true, 
          data: createdEquipment
        });

      case 'PUT':
        // Update equipment
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Equipment ID is required' });
        }
        
        const updates = {
          ...req.body,
          updated_at: new Date().toISOString()
        };
        
        const updatedEquipment = jsonDb.updateOne('equipment', 'id', String(req.query.id), updates);
        
        if (!updatedEquipment) {
          return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        
        return res.status(200).json({ success: true, data: updatedEquipment });

      case 'DELETE':
        // Delete equipment
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Equipment ID is required' });
        }
        
        const deleted = jsonDb.deleteOne('equipment', 'id', String(req.query.id));
        
        if (!deleted) {
          return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        
        return res.status(200).json({ success: true, message: 'Equipment deleted successfully' });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in equipment API:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
} 