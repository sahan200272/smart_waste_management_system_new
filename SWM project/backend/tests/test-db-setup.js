// Test Database Setup
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const connectToTestDB = async () => {
  try {
    // Create an in-memory MongoDB instance for testing
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to in-memory test database');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    // Fall back to mock mode if in-memory DB fails
    return false;
  }
  return true;
};

export const disconnectFromTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Disconnected from test database');
  } catch (error) {
    console.error('Error disconnecting from test database:', error);
  }
};

export const clearTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  } catch (error) {
    console.error('Error clearing test database:', error);
  }
};

// Mock mode fallback
export const mockDatabaseOperations = () => {
  // Mock mongoose operations for when DB is not available
  const mockModel = {
    find: () => Promise.resolve([]),
    findOne: () => Promise.resolve(null),
    create: (data) => Promise.resolve({ ...data, _id: 'mock-id' }),
    save: function() { return Promise.resolve(this); },
    deleteMany: () => Promise.resolve({ deletedCount: 0 })
  };

  return mockModel;
};