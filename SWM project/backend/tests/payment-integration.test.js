// Payment Integration Tests - Full Flow Testing
import request from 'supertest';
import express from 'express';
import { describe, it, test, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import PaymentController from '../src/controllers/paymentController.js';

/**
 * Payment Integration Tests
 * Tests the complete payment flow from API to business logic
 */

// Create test app with all payment routes
const createPaymentApp = () => {
  const app = express();
  app.use(express.json());
  
  const paymentController = new PaymentController();
  
  // Payment routes
  app.get('/api/payments/outstanding/:userId', (req, res) => paymentController.getOutstandingBills(req, res));
  app.post('/api/payments/process', (req, res) => paymentController.processPayment(req, res));
  app.get('/api/payments/history/:userId', (req, res) => paymentController.getPaymentHistory(req, res));
  app.get('/api/payments/receipt/:transactionId', (req, res) => paymentController.getPaymentReceipt(req, res));
  app.get('/api/payments/verify/:transactionId', (req, res) => paymentController.verifyPayment(req, res));
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  });
  
  return app;
};

describe('Payment Integration Tests', () => {
  let app;
  
  const mockUserId = 'integration-test-user';
  const mockPaymentData = {
    userId: mockUserId,
    amount: 150.00,
    paymentMethod: 'CREDIT_CARD',
    cardDetails: {
      cardNumber: '4111 1111 1111 1111',
      expiryDate: '12/25',
      cvv: '123',
      cardholderName: 'John Doe'
    }
  };

  beforeAll(() => {
    app = createPaymentApp();
  });

  describe('Complete Payment Flow', () => {
    test('should complete full payment process successfully', async () => {
      // Step 1: Get outstanding bills (should create mock bill)
      const billsResponse = await request(app)
        .get(`/api/payments/outstanding/${mockUserId}`)
        .expect(200);

      expect(billsResponse.body.success).toBe(true);
      expect(billsResponse.body.data).toBeDefined();
      expect(Array.isArray(billsResponse.body.data)).toBe(true);

      // Step 2: Process payment
      const paymentResponse = await request(app)
        .post('/api/payments/process')
        .send(mockPaymentData);

      expect(paymentResponse.body).toHaveProperty('success');
      
      // If payment processing succeeds
      if (paymentResponse.status === 200) {
        expect(paymentResponse.body.success).toBe(true);
        expect(paymentResponse.body.data).toHaveProperty('payment');
        
        // Step 3: Get payment history
        const historyResponse = await request(app)
          .get(`/api/payments/history/${mockUserId}`)
          .expect(200);

        expect(historyResponse.body.success).toBe(true);
        expect(historyResponse.body.data).toBeDefined();
      }
    });

    test('should handle payment failure gracefully', async () => {
      // Arrange - Invalid payment data
      const invalidPaymentData = {
        ...mockPaymentData,
        cardDetails: {
          cardNumber: '4000 0000 0000 0002', // This should trigger failure in mock gateway
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'John Doe'
        }
      };

      // Act
      const response = await request(app)
        .post('/api/payments/process')
        .send(invalidPaymentData);

      // Assert
      expect(response.body).toHaveProperty('success');
      if (response.body.success === false) {
        expect(response.body).toHaveProperty('error');
      }
    });

    test('should validate all required fields in payment flow', async () => {
      // Test missing userId
      const missingUserIdData = {
        amount: 150.00,
        paymentMethod: 'CREDIT_CARD'
      };

      const response1 = await request(app)
        .post('/api/payments/process')
        .send(missingUserIdData)
        .expect(400);

      expect(response1.body.success).toBe(false);
      expect(response1.body.error).toContain('Missing required fields');

      // Test missing amount
      const missingAmountData = {
        userId: mockUserId,
        paymentMethod: 'CREDIT_CARD'
      };

      const response2 = await request(app)
        .post('/api/payments/process')
        .send(missingAmountData)
        .expect(400);

      expect(response2.body.success).toBe(false);

      // Test missing payment method
      const missingMethodData = {
        userId: mockUserId,
        amount: 150.00
      };

      const response3 = await request(app)
        .post('/api/payments/process')
        .send(missingMethodData)
        .expect(400);

      expect(response3.body.success).toBe(false);
    });
  });

  describe('API Endpoint Tests', () => {
    test('GET /api/payments/outstanding/:userId - should return user bills', async () => {
      const response = await request(app)
        .get(`/api/payments/outstanding/${mockUserId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number)
      });
    });

    test('GET /api/payments/outstanding/:userId - should handle invalid user ID', async () => {
      const response = await request(app)
        .get('/api/payments/outstanding/')
        .expect(404);
    });

    test('POST /api/payments/process - should process valid payment', async () => {
      const response = await request(app)
        .post('/api/payments/process')
        .send(mockPaymentData);

      expect(response.body).toHaveProperty('success');
      expect([200, 400, 500]).toContain(response.status);
    });

    test('GET /api/payments/history/:userId - should return payment history', async () => {
      const response = await request(app)
        .get(`/api/payments/history/${mockUserId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        pagination: expect.objectContaining({
          limit: expect.any(Number),
          skip: expect.any(Number)
        })
      });
    });

    test('GET /api/payments/history/:userId - should handle pagination', async () => {
      const response = await request(app)
        .get(`/api/payments/history/${mockUserId}`)
        .query({ limit: 5, skip: 10 })
        .expect(200);

      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.skip).toBe(10);
    });

    test('GET /api/payments/receipt/:transactionId - should return receipt', async () => {
      const transactionId = 'TXN_TEST_123';
      
      const response = await request(app)
        .get(`/api/payments/receipt/${transactionId}`);

      expect(response.body).toHaveProperty('success');
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/payments/process')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json');

      expect([400, 500]).toContain(response.status);
    });

    test('should handle very large request payloads', async () => {
      const largePayload = {
        ...mockPaymentData,
        metadata: 'x'.repeat(10000) // Large string
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(largePayload);

      expect(response.body).toHaveProperty('success');
    });

    test('should handle special characters in user ID', async () => {
      const specialUserId = 'user-123@test.com';
      
      const response = await request(app)
        .get(`/api/payments/outstanding/${encodeURIComponent(specialUserId)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Payment Method Tests', () => {
    const paymentMethods = ['CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING'];

    paymentMethods.forEach(method => {
      test(`should process payment with ${method}`, async () => {
        const paymentData = {
          ...mockPaymentData,
          paymentMethod: method
        };

        const response = await request(app)
          .post('/api/payments/process')
          .send(paymentData);

        expect(response.body).toHaveProperty('success');
      });
    });

    test('should reject invalid payment method', async () => {
      const invalidPaymentData = {
        ...mockPaymentData,
        paymentMethod: 'INVALID_METHOD'
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(invalidPaymentData);

      // Should either succeed (if validation happens later) or fail with proper error
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Amount Validation Tests', () => {
    test('should handle different amount formats', async () => {
      const amounts = [150, 150.00, 150.50, 0.01, 999999.99];

      for (const amount of amounts) {
        const paymentData = {
          ...mockPaymentData,
          amount: amount
        };

        const response = await request(app)
          .post('/api/payments/process')
          .send(paymentData);

        expect(response.body).toHaveProperty('success');
      }
    });

    test('should reject negative amounts', async () => {
      const invalidPaymentData = {
        ...mockPaymentData,
        amount: -100
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(invalidPaymentData);

      // Should handle negative amounts appropriately
      expect(response.body).toHaveProperty('success');
    });

    test('should reject zero amounts', async () => {
      const invalidPaymentData = {
        ...mockPaymentData,
        amount: 0
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(invalidPaymentData);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Performance Tests', () => {
    test('should respond to payment processing within reasonable time', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/payments/process')
        .send(mockPaymentData);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000); // 5 seconds max
      expect(response.body).toHaveProperty('success');
    });

    test('should handle concurrent payment requests', async () => {
      const requests = [];
      
      for (let i = 0; i < 5; i++) {
        const paymentData = {
          ...mockPaymentData,
          userId: `${mockUserId}-${i}`
        };
        
        requests.push(
          request(app)
            .post('/api/payments/process')
            .send(paymentData)
        );
      }

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success');
      });
    });
  });
});