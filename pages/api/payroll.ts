import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise, { getCollection } from '../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let collection;
  const collectionName = 'payroll';
  
  // Check if MongoDB is available, otherwise use JSON DB
  if (process.env.MONGODB_URI && clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB || 'landscaping');
      collection = db.collection(collectionName);
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      return res.status(500).json({ success: false, message: 'MongoDB connection failed' });
    }
  } else {
    collection = getCollection(collectionName);
    if (!collection) {
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
  }

  try {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          // Get a single payroll entry by ID
          let query = {};
          
          // Handle different ID formats (ObjectId vs string)
          try {
            if (process.env.MONGODB_URI) {
              query = { _id: new ObjectId(req.query.id as string) };
            } else {
              query = { id: req.query.id };
            }
          } catch (error) {
            query = { id: req.query.id };
          }
          
          const payrollEntry = await collection.findOne(query);
          
          if (!payrollEntry) {
            return res.status(404).json({ success: false, message: 'Payroll entry not found' });
          }
          
          return res.status(200).json({ success: true, data: payrollEntry });
        } else {
          // Get all payroll entries with optional period filters
          let query = {};
          
          // Filter by period if provided
          if (req.query.periodStart && req.query.periodEnd) {
            query = {
              ...query,
              periodStart: { $gte: new Date(req.query.periodStart as string) },
              periodEnd: { $lte: new Date(req.query.periodEnd as string) }
            };
          }
          
          // Filter by employee if provided
          if (req.query.employeeId) {
            query = {
              ...query,
              employeeId: req.query.employeeId
            };
          }
          
          const payrollEntries = await collection.find(query).sort({ periodStart: -1 }).toArray();
          return res.status(200).json({ success: true, data: payrollEntries });
        }

      case 'POST':
        // Create a new payroll entry
        const newPayrollEntry = req.body;
        newPayrollEntry.createdAt = new Date();
        newPayrollEntry.updatedAt = new Date();
        
        // Ensure dates are properly formatted
        if (newPayrollEntry.periodStart) {
          newPayrollEntry.periodStart = new Date(newPayrollEntry.periodStart);
        }
        
        if (newPayrollEntry.periodEnd) {
          newPayrollEntry.periodEnd = new Date(newPayrollEntry.periodEnd);
        }
        
        const result = await collection.insertOne(newPayrollEntry);
        
        if (!result.acknowledged) {
          return res.status(500).json({ success: false, message: 'Failed to create payroll entry' });
        }
        
        return res.status(201).json({ 
          success: true, 
          data: { ...newPayrollEntry, _id: result.insertedId } 
        });

      case 'PUT':
        // Update a payroll entry
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Payroll entry ID is required' });
        }
        
        const updates = req.body;
        updates.updatedAt = new Date();
        
        // Ensure dates are properly formatted
        if (updates.periodStart) {
          updates.periodStart = new Date(updates.periodStart);
        }
        
        if (updates.periodEnd) {
          updates.periodEnd = new Date(updates.periodEnd);
        }
        
        let updateQuery = {};
        try {
          if (process.env.MONGODB_URI) {
            updateQuery = { _id: new ObjectId(req.query.id as string) };
          } else {
            updateQuery = { id: req.query.id };
          }
        } catch (error) {
          updateQuery = { id: req.query.id };
        }
        
        const updateResult = await collection.updateOne(
          updateQuery,
          { $set: updates }
        );
        
        if (!updateResult.acknowledged) {
          return res.status(500).json({ success: false, message: 'Failed to update payroll entry' });
        }
        
        return res.status(200).json({ success: true, data: { ...updates, _id: req.query.id } });

      case 'DELETE':
        // Delete a payroll entry
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Payroll entry ID is required' });
        }
        
        let deleteQuery = {};
        try {
          if (process.env.MONGODB_URI) {
            deleteQuery = { _id: new ObjectId(req.query.id as string) };
          } else {
            deleteQuery = { id: req.query.id };
          }
        } catch (error) {
          deleteQuery = { id: req.query.id };
        }
        
        const deleteResult = await collection.deleteOne(deleteQuery);
        
        if (!deleteResult.acknowledged || deleteResult.deletedCount === 0) {
          return res.status(500).json({ success: false, message: 'Failed to delete payroll entry' });
        }
        
        return res.status(200).json({ success: true, message: 'Payroll entry deleted successfully' });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in payroll API:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
} 