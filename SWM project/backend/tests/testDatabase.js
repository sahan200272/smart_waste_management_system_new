import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

/**
 * In-Memory MongoDB Test Database Setup
 * Provides isolated database for testing without external dependencies
 */

let mongod = null;

/**
 * Connect to a new in-memory database before running any tests
 */
export const connectTestDB = async () => {
  try {
    // If already connected, close the existing connection first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Stop existing mongod instance if it exists
    if (mongod) {
      await mongod.stop();
    }
    
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to in-memory test database');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
};

/**
 * Drop database, close the connection and stop MongoDB
 */
export const closeTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    if (mongod) {
      await mongod.stop();
    }
    
    console.log('Disconnected from test database');
  } catch (error) {
    console.error('Failed to close test database:', error);
    throw error;
  }
};

/**
 * Remove all the data for all db collections
 */
export const clearTestDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    console.log('Cleared test database');
  } catch (error) {
    console.error('Failed to clear test database:', error);
    throw error;
  }
};

/**
 * Create test data for payments
 */
export const createTestPaymentData = () => {
  const testData = {
    validPayment: {
      userId: 'test-user-123',
      amount: 150.75,
      paymentMethod: 'CREDIT_CARD',
      cardDetails: {
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'John Doe'
      },
      billId: 'BILL_TEST_123',
      status: 'PENDING'
    },
    
    invalidPayment: {
      userId: '',
      amount: -50,
      paymentMethod: 'INVALID_METHOD'
    },
    
    declinedCardPayment: {
      userId: 'test-user-456',
      amount: 100.00,
      paymentMethod: 'CREDIT_CARD',
      cardDetails: {
        cardNumber: '4000000000000002', // Declined card number
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Jane Doe'
      }
    },
    
    expiredCardPayment: {
      userId: 'test-user-789',
      amount: 100.00,
      paymentMethod: 'CREDIT_CARD',
      cardDetails: {
        cardNumber: '4111111111111111',
        expiryDate: '01/20', // Expired
        cvv: '123',
        cardholderName: 'Bob Smith'
      }
    },
    
    netBankingPayment: {
      userId: 'test-user-321',
      amount: 200.00,
      paymentMethod: 'NET_BANKING',
      bankDetails: {
        bankCode: 'HDFC',
        accountNumber: 'XXXX1234'
      }
    },
    
    outstandingBills: [
      {
        _id: 'bill-1',
        userId: 'test-user-123',
        billId: 'BILL_001',
        amount: 120.00,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'PENDING',
        type: 'WASTE_COLLECTION'
      },
      {
        _id: 'bill-2',
        userId: 'test-user-123',
        billId: 'BILL_002',
        amount: 200.50,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        status: 'PENDING',
        type: 'MAINTENANCE'
      }
    ],
    
    paymentHistory: [
      {
        _id: 'payment-1',
        userId: 'test-user-123',
        transactionId: 'TXN_001',
        amount: 100.00,
        paymentMethod: 'CREDIT_CARD',
        status: 'SUCCESS',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        billId: 'BILL_PREV_001'
      },
      {
        _id: 'payment-2',
        userId: 'test-user-123',
        transactionId: 'TXN_002',
        amount: 150.50,
        paymentMethod: 'NET_BANKING',
        status: 'SUCCESS',
        timestamp: new Date('2024-01-15T14:30:00Z'),
        billId: 'BILL_PREV_002'
      }
    ]
  };
  
  return testData;
};

/**
 * Setup test environment with database connection
 */
export const setupTestEnvironment = async () => {
  await connectTestDB();
  
  // Disable mongoose warnings for tests
  mongoose.set('strictQuery', false);
};

/**
 * Cleanup test environment after all tests
 */
export const teardownTestEnvironment = async () => {
  await closeTestDB();
};