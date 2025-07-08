import { MongoClient } from 'mongodb';
import * as jsonDb from './jsonDb';

// Check if MongoDB connection string is available
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'landscaping';

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

// Create a client promise if MongoDB is configured
if (uri) {
  client = new MongoClient(uri);
  clientPromise = client.connect();
} else {
  console.warn('MongoDB URI not found, falling back to JSON DB');
}

// Create a mock MongoDB client that uses jsonDb
export const getCollection = (collectionName: string) => {
  if (!uri) {
    // Return a mock collection that uses jsonDb
    return {
      find: (query = {}) => {
        return {
          sort: () => ({
            toArray: async () => {
              return jsonDb.find(collectionName, query);
            }
          }),
          toArray: async () => {
            return jsonDb.find(collectionName, query);
          }
        };
      },
      findOne: async (query: any) => {
        const results = jsonDb.find(collectionName, query);
        return results.length > 0 ? results[0] : null;
      },
      insertOne: async (doc: any) => {
        const result = jsonDb.insertOne(collectionName, doc) as any;
        return {
          acknowledged: true,
          insertedId: result.id
        };
      },
      updateOne: async (query: any, update: any) => {
        // Extract ID from query
        const id = query._id || Object.values(query)[0];
        const idField = query._id ? '_id' : Object.keys(query)[0];
        
        const result = jsonDb.updateOne(collectionName, idField, id, update.$set);
        return {
          acknowledged: !!result,
          modifiedCount: result ? 1 : 0
        };
      },
      deleteOne: async (query: any) => {
        // Extract ID from query
        const id = query._id || Object.values(query)[0];
        const idField = query._id ? '_id' : Object.keys(query)[0];
        
        const result = jsonDb.deleteOne(collectionName, idField, id);
        return {
          acknowledged: true,
          deletedCount: result ? 1 : 0
        };
      }
    };
  }
  return null;
};

// Default export for actual MongoDB client if available
export default clientPromise; 