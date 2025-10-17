import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import { setupTestEnvironment, teardownTestEnvironment, clearTestDB } from './testDatabase.js';

let dbConnected = false;

// Test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  
  try {
    // Setup in-memory database
    await setupTestEnvironment();
    dbConnected = true;
    console.log('Running tests with in-memory database');
  } catch (error) {
    console.log('Running tests in mock mode (no database connection)');
    dbConnected = false;
  }
}, 30000);

beforeEach(async () => {
  if (dbConnected) {
    await clearTestDB();
  }
});

afterAll(async () => {
  if (dbConnected) {
    await teardownTestEnvironment();
  }
});

// Export for use in tests
export { dbConnected };
