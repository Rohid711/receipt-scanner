import fs from 'fs';
import path from 'path';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Define the data directory
const DATA_DIR = !isBrowser ? path.join(process.cwd(), 'data') : null;

// Helper function to check if we're running on the server
const isServer = () => {
  if (isBrowser) {
    console.warn('Attempting to use jsonDb in browser environment');
    return false;
  }
  return true;
};

// Create data directory only on the server
if (isServer()) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      console.log('Creating data directory');
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

/**
 * Get the full path to a JSON database file
 * @param {string} collection - The collection name (e.g., 'receipts')
 * @returns {string} - The full path to the JSON file
 */
const getDbPath = (collection) => {
  if (!isServer()) return null;
  return path.join(DATA_DIR, `${collection}.json`);
};

/**
 * Get all documents from a collection
 * @param {string} collection - The collection name
 * @returns {Array} - Array of documents
 */
export const getAll = (collection) => {
  if (!isServer()) return [];
  
  try {
    const dbPath = getDbPath(collection);
    
    // If the file doesn't exist yet, return an empty array
    if (!fs.existsSync(dbPath)) {
      return [];
    }
    
    // Read and parse the JSON file
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error getting all ${collection}:`, error);
    return [];
  }
};

/**
 * Save a new document to a collection
 * @param {string} collection - The collection name
 * @param {Object} document - The document to save
 * @returns {Object} - The saved document with ID
 */
export const insertOne = (collection, document) => {
  if (!isServer()) {
    // In browser, just log the operation and return the document with a fake ID
    console.warn(`Browser: Would insert into ${collection}`, document);
    return {
      ...document,
      id: document.id || Date.now().toString()
    };
  }
  
  try {
    // Ensure the data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    const dbPath = getDbPath(collection);
    const documents = getAll(collection);
    
    // Add the document with a generated ID if it doesn't have one
    const newDocument = {
      ...document,
      id: document.id || Date.now().toString()
    };
    
    // Add to the collection
    documents.push(newDocument);
    
    // Save the updated collection
    fs.writeFileSync(dbPath, JSON.stringify(documents, null, 2));
    
    return newDocument;
  } catch (error) {
    console.error(`Error inserting into ${collection}:`, error);
    throw error;
  }
};

/**
 * Update a document in a collection
 * @param {string} collection - The collection name
 * @param {string} idField - The field to use as the identifier
 * @param {string} idValue - The value of the identifier
 * @param {Object} updates - The fields to update or full replacement object
 * @returns {Object|null} - The updated document or null if not found
 */
export const updateOne = (collection, idField, idValue, updates) => {
  if (!isServer()) {
    // In browser, just log the operation and return the updates
    console.warn(`Browser: Would update in ${collection} where ${idField}=${idValue}`, updates);
    return { ...updates, [idField]: idValue };
  }
  
  try {
    const dbPath = getDbPath(collection);
    const documents = getAll(collection);
    
    // Find the document to update
    const index = documents.findIndex(doc => doc[idField] === idValue);
    
    if (index === -1) {
      return null;
    }
    
    // Handle full object replacement vs partial update
    if (updates[idField] && typeof updates === 'object') {
      // This is likely a full object - make sure we preserve the ID
      documents[index] = updates;
    } else {
      // This is a partial update
      documents[index] = {
        ...documents[index],
        ...updates
      };
    }
    
    // Save the updated collection
    fs.writeFileSync(dbPath, JSON.stringify(documents, null, 2));
    
    return documents[index];
  } catch (error) {
    console.error(`Error updating in ${collection}:`, error);
    throw error;
  }
};

/**
 * Delete a document from a collection
 * @param {string} collection - The collection name
 * @param {string} id - The ID of the document to delete
 * @returns {boolean} - Whether the document was deleted
 */
export const deleteOne = (collection, idField, idValue) => {
  if (!isServer()) {
    // In browser, just log the operation
    console.warn(`Browser: Would delete from ${collection} where ${idField}=${idValue}`);
    return true;
  }
  
  try {
    const dbPath = getDbPath(collection);
    const documents = getAll(collection);
    
    // Find the document to delete
    const index = documents.findIndex(doc => doc[idField] === idValue);
    
    if (index === -1) {
      return false;
    }
    
    // Remove the document
    documents.splice(index, 1);
    
    // Save the updated collection
    fs.writeFileSync(dbPath, JSON.stringify(documents, null, 2));
    
    return true;
  } catch (error) {
    console.error(`Error deleting from ${collection}:`, error);
    throw error;
  }
};

/**
 * Find documents that match a filter
 * @param {string} collection - The collection name
 * @param {Object} filter - Filter criteria
 * @returns {Array} - Array of matching documents
 */
export const find = (collection, filter) => {
  if (!isServer()) return [];
  
  try {
    const documents = getAll(collection);
    
    if (!filter || Object.keys(filter).length === 0) {
      return documents;
    }
    
    // Filter documents based on criteria
    return documents.filter(doc => {
      return Object.entries(filter).every(([key, value]) => doc[key] === value);
    });
  } catch (error) {
    console.error(`Error finding in ${collection}:`, error);
    return [];
  }
};

/**
 * Count documents in a collection, optionally with a filter
 * @param {string} collection - The collection name
 * @param {Object} filter - Optional filter criteria
 * @returns {number} - Number of matching documents
 */
export const count = (collection, filter) => {
  if (!isServer()) return 0;
  
  try {
    const documents = find(collection, filter);
    return documents.length;
  } catch (error) {
    console.error(`Error counting in ${collection}:`, error);
    return 0;
  }
};

export default {
  getAll,
  insertOne,
  updateOne,
  deleteOne,
  find,
  count
}; 