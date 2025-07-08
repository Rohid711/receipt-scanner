import { NextApiRequest, NextApiResponse } from 'next';
import jsonDb from '../../utils/jsonDb';
import fs from 'fs';
import path from 'path';

// Define interfaces for type safety
interface Invoice {
  id: string;
  client_id: string;
  job_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  address?: string;
}

// Helper function to validate invoice data
function validateInvoiceData(data: any) {
  const errors = [];
  
  // Required fields
  if (!data.client_id) errors.push('Client ID is required');
  if (!data.invoice_number) errors.push('Invoice number is required');
  if (!data.invoice_date) errors.push('Invoice date is required');
  if (!data.due_date) errors.push('Due date is required');
  if (data.subtotal === undefined || data.subtotal === null) errors.push('Subtotal is required');
  if (data.total_amount === undefined || data.total_amount === null) errors.push('Total amount is required');
  
  // Validate items if present
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item: any, index: number) => {
      if (!item.description) errors.push(`Item ${index + 1}: Description is required`);
      if (item.quantity === undefined || item.quantity === null) errors.push(`Item ${index + 1}: Quantity is required`);
      if (item.rate === undefined || item.rate === null) errors.push(`Item ${index + 1}: Rate is required`);
      if (item.amount === undefined || item.amount === null) errors.push(`Item ${index + 1}: Amount is required`);
    });
  } else {
    errors.push('At least one invoice item is required');
  }
  
  return errors;
}

// Helper function to ensure tables exist in the JSON database
function ensureTablesExist() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // Check if data directory exists, create if not
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Check if invoices.json exists, create if not
    const invoicesPath = path.join(dataDir, 'invoices.json');
    if (!fs.existsSync(invoicesPath)) {
      fs.writeFileSync(invoicesPath, JSON.stringify([], null, 2));
    }
    
    // Check if invoice_items.json exists, create if not
    const invoiceItemsPath = path.join(dataDir, 'invoice_items.json');
    if (!fs.existsSync(invoiceItemsPath)) {
      fs.writeFileSync(invoiceItemsPath, JSON.stringify([], null, 2));
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
    return { success: false, error };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          // Get a single invoice by ID
          const invoices = jsonDb.find('invoices', { id: req.query.id }) as Invoice[];
          
          if (!invoices || invoices.length === 0) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
          }
          
          const invoice = invoices[0];
          
          // Get client information
          let client = null;
          if (invoice.client_id) {
            const clients = jsonDb.find('clients', { id: invoice.client_id }) as Client[];
            if (clients && clients.length > 0) {
              client = clients[0];
            }
          }
          
          return res.status(200).json({ 
            success: true, 
            data: { ...invoice, client }
          });
        } else {
          // Get all invoices
          const invoices = jsonDb.getAll('invoices') as Invoice[];
          const clients = jsonDb.getAll('clients') as Client[];
          
          // Sort by created_at descending
          const sortedInvoices = invoices.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          
          // Add client information to each invoice
          const invoicesWithClients = sortedInvoices.map(invoice => {
            let client = null;
            if (invoice.client_id) {
              client = clients.find(c => c.id === invoice.client_id) || null;
            }
            return { ...invoice, client };
          });
          
          return res.status(200).json({ success: true, data: invoicesWithClients });
        }

      case 'POST':
        try {
          // Validate the invoice data
          const validationErrors = validateInvoiceData(req.body);
          if (validationErrors.length > 0) {
            return res.status(400).json({ 
              success: false, 
              message: 'Validation failed', 
              errors: validationErrors 
            });
          }
          
          // Check if client exists
          const clients = jsonDb.find('clients', { id: req.body.client_id }) as Client[];
          if (!clients || clients.length === 0) {
            return res.status(400).json({ 
              success: false, 
              message: 'Client not found', 
              error: 'The specified client does not exist'
            });
          }
          
          // Check if job exists (if job_id is provided)
          if (req.body.job_id) {
            const jobs = jsonDb.find('jobs', { id: req.body.job_id });
            if (!jobs || jobs.length === 0) {
              return res.status(400).json({ 
                success: false, 
                message: 'Job not found', 
                error: 'The specified job does not exist'
              });
            }
          }
          
          // Ensure tables exist
          const tablesResult = ensureTablesExist();
          if (!tablesResult.success) {
            return res.status(500).json({
              success: false,
              message: 'Failed to create database files',
              error: tablesResult.error
            });
          }
          
          // Create a new invoice
          const newInvoice = {
            id: `invoice_${Date.now()}`,
            client_id: req.body.client_id,
            job_id: req.body.job_id,
            invoice_number: req.body.invoice_number,
            invoice_date: req.body.invoice_date,
            due_date: req.body.due_date,
            subtotal: req.body.subtotal,
            tax_rate: req.body.tax_rate || 0,
            tax_amount: req.body.tax_amount || 0,
            total_amount: req.body.total_amount,
            amount_paid: req.body.amount_paid || 0,
            status: req.body.status || 'Draft',
            notes: req.body.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Invoice;
          
          console.log('Creating invoice with data:', newInvoice);
          
          // Create the invoice
          const createdInvoice = jsonDb.insertOne('invoices', newInvoice) as Invoice;
          
          console.log('Invoice created:', createdInvoice);
          
          // Then create the invoice items
          if (req.body.items && req.body.items.length > 0) {
            const invoiceItems = req.body.items.map((item: any) => ({
              id: `invoice_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              invoice_id: createdInvoice.id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));
            
            console.log('Creating invoice items:', invoiceItems);
            
            // Insert each item
            invoiceItems.forEach((item: InvoiceItem) => {
              jsonDb.insertOne('invoice_items', item);
            });
          }
          
          // Get the client for the response
          const client = clients[0];
          
          return res.status(201).json({ 
            success: true, 
            data: { ...createdInvoice, client }
          });
        } catch (error) {
          console.error('Error creating invoice:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to create invoice', 
            error: String(error)
          });
        }

      case 'PUT':
        // Update invoice
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Invoice ID is required' });
        }
        
        // Check if invoice exists
        const invoicesToUpdate = jsonDb.find('invoices', { id: req.query.id }) as Invoice[];
        if (!invoicesToUpdate || invoicesToUpdate.length === 0) {
          return res.status(404).json({ success: false, message: 'Invoice not found' });
        }
        
        const updates = {
          ...req.body,
          updated_at: new Date().toISOString()
        };
        
        const updatedInvoice = jsonDb.updateOne('invoices', 'id', String(req.query.id), updates) as Invoice;
        
        // Update invoice items if provided
        if (req.body.items && Array.isArray(req.body.items)) {
          // Delete existing items for this invoice
          const existingItems = jsonDb.find('invoice_items', { invoice_id: String(req.query.id) }) as InvoiceItem[];
          if (existingItems && existingItems.length > 0) {
            existingItems.forEach(item => {
              jsonDb.deleteOne('invoice_items', 'id', item.id);
            });
          }
          
          // Create new items
          req.body.items.forEach((item: any) => {
            const newItem = {
              id: item.id || `invoice_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              invoice_id: String(req.query.id),
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            jsonDb.insertOne('invoice_items', newItem);
          });
        }
        
        // Get client information for response
        let client = null;
        if (updatedInvoice.client_id) {
          const clients = jsonDb.find('clients', { id: updatedInvoice.client_id }) as Client[];
          if (clients && clients.length > 0) {
            client = clients[0];
          }
        }
        
        return res.status(200).json({ 
          success: true, 
          data: { ...updatedInvoice, client }
        });

      case 'DELETE':
        // Delete invoice
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Invoice ID is required' });
        }
        
        // Delete invoice items first
        const itemsToDelete = jsonDb.find('invoice_items', { invoice_id: String(req.query.id) }) as InvoiceItem[];
        if (itemsToDelete && itemsToDelete.length > 0) {
          itemsToDelete.forEach(item => {
            jsonDb.deleteOne('invoice_items', 'id', item.id);
          });
        }
        
        // Then delete the invoice
        const deleted = jsonDb.deleteOne('invoices', 'id', String(req.query.id));
        
        if (!deleted) {
          return res.status(404).json({ success: false, message: 'Invoice not found' });
        }
        
        return res.status(200).json({ success: true, message: 'Invoice deleted successfully' });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in invoices API:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
} 