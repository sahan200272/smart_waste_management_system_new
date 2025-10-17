/**
 * Resident Controller Tests
 * Tests for the resident dashboard functionality
 */

import { setupTestEnvironment, teardownTestEnvironment } from './testDatabase.js';
import { describe, it, test, expect, beforeAll, beforeEach, afterAll, jest } from '@jest/globals';
import ResidentController from '../src/controllers/residentController.js';
import Resident from '../src/model/Resident.js';
import Payment from '../src/model/Payment.js';

describe('Resident Controller Tests', () => {
  let residentController;
  
  beforeAll(async () => {
    await setupTestEnvironment();
    residentController = new ResidentController();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await Resident.deleteMany({});
    await Payment.deleteMany({});
  });

  describe('Demo Resident Details', () => {
    test('should create and return demo resident details', async () => {
      // Arrange
      const mockReq = {};
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // Act
      await residentController.getDemoResidentDetails(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            resident: expect.objectContaining({
              userId: 'demo-resident-001',
              name: 'John Doe',
              email: 'demo.resident@swms.com'
            }),
            outstandingBills: expect.any(Array)
          })
        })
      );
    });

    test('should handle errors gracefully', async () => {
      // Arrange
      const mockReq = {};
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // Mock Resident.findOne to throw an error
      jest.spyOn(Resident, 'findOne').mockRejectedValueOnce(new Error('Database error'));

      // Act
      await residentController.getDemoResidentDetails(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String)
        })
      );

      // Restore the mock
      Resident.findOne.mockRestore();
    });
  });

  describe('Payment History', () => {
    test('should get payment history for resident', async () => {
      // Arrange
      const userId = 'test-resident-001';
      
      // Create test resident
      await new Resident({
        userId,
        name: 'Test User',
        email: 'test@example.com',
        contact: '0771234567',
        address: '123 Test Street, Colombo 10250',
      }).save();

      // Create test payment
      await new Payment({
        userId,
        amount: 150.00,
        status: 'SUCCESS',
        paymentMethod: 'CREDIT_CARD',
        transactionId: 'TXN_TEST_001',
        billId: 'BILL_TEST_001',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }).save();

      const mockReq = {
        params: { userId },
        query: { page: '1', limit: '10' }
      };
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // Act
      await residentController.getPaymentHistory(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            payments: expect.arrayContaining([
              expect.objectContaining({
                userId,
                amount: 150.00,
                status: 'SUCCESS'
              })
            ]),
            pagination: expect.any(Object)
          })
        })
      );
    });

    test('should handle missing userId parameter', async () => {
      // Arrange
      const mockReq = { 
        params: {}, 
        query: { page: '1', limit: '10' } 
      };
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // Act
      await residentController.getPaymentHistory(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User ID is required'
        })
      );
    });
  });

  describe('Bill Details', () => {
    test('should get bill details for resident', async () => {
      // Arrange
      const userId = 'test-resident-001';
      
      // Create test resident
      await new Resident({
        userId,
        name: 'Test User',
        email: 'test@example.com',
        contact: '0771234567',
        address: '123 Test Street, Colombo 10250',
        outstandingAmount: 250.00
      }).save();

      // Create test outstanding bills
      await new Payment({
        userId,
        amount: 250.00,
        status: 'PENDING',
        paymentMethod: 'CREDIT_CARD',
        transactionId: 'TXN_BILL_001',
        billId: 'BILL_TEST_001',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }).save();

      const mockReq = {
        params: { userId }
      };
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // Act
      await residentController.getBillDetails(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            resident: expect.objectContaining({
              userId
            }),
            bills: expect.arrayContaining([
              expect.objectContaining({
                billId: 'BILL_TEST_001',
                amount: 250.00,
                status: 'PENDING'
              })
            ]),
            totalOutstanding: 250
          })
        })
      );
    });

    test('should return empty bills for resident with no outstanding amounts', async () => {
      // Arrange
      const userId = 'test-resident-002';
      
      // Create test resident with no outstanding amount
      await new Resident({
        userId,
        name: 'Test User 2',
        email: 'test2@example.com',
        contact: '0771234568',
        address: '456 Test Avenue, Kandy 20000',
        outstandingAmount: 0
      }).save();

      const mockReq = {
        params: { userId }
      };
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // Act
      await residentController.getBillDetails(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            resident: expect.objectContaining({
              userId
            }),
            bills: expect.any(Array),
            totalOutstanding: expect.any(Number)
          })
        })
      );
    });
  });

  describe('Integration with PaymentService', () => {
    test('should integrate with existing payment system', async () => {
      // Arrange
      const userId = 'demo-resident-001';

      // Act - Get demo resident details (this creates the resident and bills)
      const mockReq = {};
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await residentController.getDemoResidentDetails(mockReq, mockRes);

      // Assert - Check that the response includes both resident and bill data
      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];
      
      expect(response.success).toBe(true);
      expect(response.data.resident).toBeDefined();
      expect(response.data.outstandingBills).toBeDefined();
      expect(Array.isArray(response.data.outstandingBills)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // Arrange
      const mockReq = { 
        params: { userId: 'test-user' },
        query: { page: '1', limit: '10' }
      };
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // Mock database error
      jest.spyOn(Payment, 'find').mockRejectedValueOnce(new Error('Database connection failed'));

      // Act
      await residentController.getPaymentHistory(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
          message: expect.stringContaining('Failed to retrieve payment history')
        })
      );

      // Restore the mock
      Payment.find.mockRestore();
    });
  });
});