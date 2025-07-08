import { NextApiRequest, NextApiResponse } from 'next';
import * as jsonDb from '../../utils/jsonDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set variables based on environment
  const useJsonDb = process.env.USE_JSON_DB === 'true';
  const collection = 'employees';

  try {
    // GET method - fetch employees
    if (req.method === 'GET') {
      const id = req.query.id as string;
      
      if (id) {
        // Get single employee by id
        const employees = jsonDb.find(collection, { id });
        const employee = employees.length > 0 ? employees[0] : null;
        
        if (!employee) {
          return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        
        return res.status(200).json({ success: true, data: employee });
      }
      
      // Get all employees
      const employees = jsonDb.getAll(collection);
      return res.status(200).json({ success: true, data: employees });
    }
    
    // POST method - create a new employee
    if (req.method === 'POST') {
      const employee = req.body;
      
      if (!employee) {
        return res.status(400).json({ success: false, message: 'No employee data provided' });
      }
      
      // Add timestamp
      const now = new Date().toISOString();
      const employeeWithTimestamp = {
        ...employee,
        id: Date.now().toString(), // Ensure unique ID
        createdAt: now,
        updatedAt: now
      };
      
      // Insert employee
      const savedEmployee = jsonDb.insertOne(collection, employeeWithTimestamp);
      
      return res.status(201).json({ success: true, data: savedEmployee });
    }
    
    // PUT method - update an employee
    if (req.method === 'PUT') {
      const id = req.query.id as string;
      const updates = req.body;
      
      if (!id) {
        return res.status(400).json({ success: false, message: 'Employee ID is required' });
      }
      
      if (!updates) {
        return res.status(400).json({ success: false, message: 'No updates provided' });
      }
      
      // Add updated timestamp
      const updatedEmployee = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Update employee
      const result = jsonDb.updateOne(collection, 'id', id, updatedEmployee);
      
      if (!result) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      
      return res.status(200).json({ success: true, data: result });
    }
    
    // DELETE method - delete an employee
    if (req.method === 'DELETE') {
      const id = req.query.id as string;
      
      if (!id) {
        return res.status(400).json({ success: false, message: 'Employee ID is required' });
      }
      
      // Delete employee
      const deleted = jsonDb.deleteOne(collection, 'id', id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      
      return res.status(200).json({ success: true, message: 'Employee deleted successfully' });
    }
    
    // Unsupported method
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
} 