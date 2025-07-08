import { NextApiRequest, NextApiResponse } from 'next';
import jsonDb from '../../utils/jsonDb';

// Define interfaces for type safety
interface MaintenanceRecord {
  id: string;
  equipment_id: string;
  type: string;
  date: string;
  description: string;
  cost: number;
  performed_by: string;
  created_at: string;
  updated_at: string;
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  status: string;
  purchase_date: string;
  purchase_cost: number;
  maintenance_cost: number;
  last_maintenance_date: string;
  next_maintenance_date: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          // Get single maintenance record
          const records = jsonDb.find('maintenance_records', { id: req.query.id }) as MaintenanceRecord[];
          
          if (!records || records.length === 0) {
            return res.status(404).json({ success: false, message: 'Maintenance record not found' });
          }
          
          const record = records[0];
          
          // Get equipment information
          let equipment = null;
          if (record.equipment_id) {
            const equipmentItems = jsonDb.find('equipment', { id: record.equipment_id }) as Equipment[];
            if (equipmentItems && equipmentItems.length > 0) {
              equipment = equipmentItems[0];
            }
          }
          
          return res.status(200).json({ 
            success: true, 
            data: { ...record, equipment }
          });
        }
        
        // Get maintenance records with optional equipment filter
        let records = jsonDb.getAll('maintenance_records') as MaintenanceRecord[];
        const equipment = jsonDb.getAll('equipment') as Equipment[];
        
        if (req.query.equipment_id) {
          records = records.filter(r => r.equipment_id === req.query.equipment_id);
        }
        if (req.query.type) {
          records = records.filter(r => r.type === req.query.type);
        }
        
        // Sort by date descending
        records = records.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
        
        // Add equipment information to each record
        const recordsWithEquipment = records.map(record => {
          let equipmentInfo = null;
          if (record.equipment_id) {
            equipmentInfo = equipment.find(e => e.id === record.equipment_id) || null;
          }
          return { ...record, equipment: equipmentInfo };
        });
        
        return res.status(200).json({ success: true, data: recordsWithEquipment });

      case 'POST':
        // Create new maintenance record
        const newRecord = {
          ...req.body,
          id: req.body.id || `maintenance_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as MaintenanceRecord;
        
        const createdRecord = jsonDb.insertOne('maintenance_records', newRecord) as MaintenanceRecord;
        
        // Update equipment status and maintenance schedule
        if (createdRecord && createdRecord.equipment_id) {
          const equipmentItems = jsonDb.find('equipment', { id: createdRecord.equipment_id }) as Equipment[];
          if (equipmentItems && equipmentItems.length > 0) {
            const equipment = equipmentItems[0];
            
            // Update equipment based on maintenance type
            const updates: Partial<Equipment> = {
              last_maintenance_date: new Date().toISOString(),
              maintenance_cost: (equipment.maintenance_cost || 0) + (createdRecord.cost || 0)
            };
            
            // If it's a scheduled maintenance, update the next maintenance date
            if (createdRecord.type === 'scheduled') {
              // Calculate next maintenance date based on schedule (e.g., 3 months later)
              const nextDate = new Date();
              nextDate.setMonth(nextDate.getMonth() + 3); // Default to 3 months
              updates.next_maintenance_date = nextDate.toISOString();
            }
            
            jsonDb.updateOne('equipment', 'id', createdRecord.equipment_id, updates);
          }
        }
        
        return res.status(201).json({ 
          success: true, 
          data: createdRecord
        });

      case 'PUT':
        // Update maintenance record
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Maintenance record ID is required' });
        }
        
        const updates = {
          ...req.body,
          updated_at: new Date().toISOString()
        };
        
        const updatedRecord = jsonDb.updateOne('maintenance_records', 'id', String(req.query.id), updates) as MaintenanceRecord;
        
        if (!updatedRecord) {
          return res.status(404).json({ success: false, message: 'Maintenance record not found' });
        }
        
        return res.status(200).json({ success: true, data: updatedRecord });

      case 'DELETE':
        // Delete maintenance record
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Maintenance record ID is required' });
        }
        
        const deleted = jsonDb.deleteOne('maintenance_records', 'id', String(req.query.id));
        
        if (!deleted) {
          return res.status(404).json({ success: false, message: 'Maintenance record not found' });
        }
        
        return res.status(200).json({ success: true, message: 'Maintenance record deleted successfully' });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in maintenance API:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
} 