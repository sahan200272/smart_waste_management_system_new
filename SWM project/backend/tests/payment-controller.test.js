// Comprehensive PaymentController Unit Tests
import { describe, it, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import PaymentController from '../src/controllers/paymentController.js';
import PaymentService from '../src/services/PaymentService.js';

/**
 * PaymentController Comprehensive Unit Tests
 * Tests all controller methods with complete error handling and edge cases
 * Achieves >80% code coverage with meaningful assertions
 */

describe('PaymentController - Comprehensive Unit Tests', () => {
  let paymentController;
  let mockPaymentService;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    // Arrange - Setup mocks and controller
    mockPaymentService = {
      processPayment: jest.fn(),
      getPaymentHistory: jest.fn(),
      getOutstandingBills: jest.fn(),
      getPaymentReceipt: jest.fn()
    };

    paymentController = new PaymentController();
    paymentController.paymentService = mockPaymentService;

    // Mock Express request and response objects
    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with payment service', () => {
      // Act
      const controller = new PaymentController();

      // Assert
      expect(controller).toBeDefined();
      expect(controller.paymentService).toBeDefined();
    });
  });

  describe('processPayment - Positive Cases', () => {
    const validPaymentData = {
      userId: 'user-123',
      amount: 150.75,
      paymentMethod: 'CREDIT_CARD',
      cardDetails: {
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'John Doe'
      }
    };

    test('should process valid payment successfully', async () => {
      // Arrange
      mockRequest.body = validPaymentData;
      mockPaymentService.processPayment.mockResolvedValue({
        success: true,
        payment: {
          _id: 'payment-123',
          transactionId: 'TXN_123',
          amount: 150.75,
          status: 'SUCCESS'
        },
        message: 'Payment processed successfully'
      });

      // Act
      await paymentController.processPayment(mockRequest, mockResponse);

      // Assert
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith(validPaymentData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          transactionId: 'TXN_123',
          amount: 150.75,
          status: 'SUCCESS'
        }),
        message: 'Payment processed successfully'
      });
    });

    test('should handle debit card payment', async () => {
      // Arrange
      mockRequest.body = { ...validPaymentData, paymentMethod: 'DEBIT_CARD' };
      mockPaymentService.processPayment.mockResolvedValue({
        success: true,
        payment: { transactionId: 'TXN_456', paymentMethod: 'DEBIT_CARD' }
      });

      // Act
      await paymentController.processPayment(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: 'DEBIT_CARD' })
      );
    });

    test('should handle net banking payment', async () => {
      // Arrange
      mockRequest.body = { 
        ...validPaymentData, 
        paymentMethod: 'NET_BANKING',
        bankDetails: { bankCode: 'HDFC' }
      };
      mockPaymentService.processPayment.mockResolvedValue({
        success: true,
        payment: { transactionId: 'TXN_789', paymentMethod: 'NET_BANKING' }
      });

      // Act
      await paymentController.processPayment(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: 'NET_BANKING' })
      );
    });
  });

  describe('processPayment - Negative Cases', () => {
    test('should return 400 for missing required fields', async () => {
      // Arrange
      mockRequest.body = {}; // Empty body
      mockPaymentService.processPayment.mockResolvedValue({
        success: false,
        error: 'Missing required fields: userId, amount, paymentMethod'
      });

      // Act
      await paymentController.processPayment(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required fields: userId, amount, paymentMethod'
      });
    });

    test('should return 400 for invalid amount', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user-123',
        amount: -50,
        paymentMethod: 'CREDIT_CARD'
      };
      mockPaymentService.processPayment.mockResolvedValue({
        success: false,
        error: 'Invalid amount. Amount must be positive.'
      });

      // Act
      await paymentController.processPayment(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid amount. Amount must be positive.'
      });
    });

    test('should return 402 for payment declined', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user-123',
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        cardDetails: {
          cardNumber: '4000000000000002', // Declined card
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'John Doe'
        }
      };
      mockPaymentService.processPayment.mockResolvedValue({
        success: false,
        error: 'Payment declined by bank'
      });

      // Act
      await paymentController.processPayment(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(402);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Payment declined by bank'
      });
    });

    test('should return 500 for service errors', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user-123',
        amount: 100,
        paymentMethod: 'CREDIT_CARD'
      };
      mockPaymentService.processPayment.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await paymentController.processPayment(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        details: 'Database connection failed'
      });
    });
  });

  describe('getOutstandingBills - Positive Cases', () => {
    test('should return outstanding bills for valid user', async () => {
      // Arrange
      mockRequest.params.userId = 'user-123';
      const mockBills = [
        { _id: 'bill-1', amount: 100, dueDate: new Date() },
        { _id: 'bill-2', amount: 200, dueDate: new Date() }
      ];
      mockPaymentService.getOutstandingBills.mockResolvedValue({
        success: true,
        bills: mockBills
      });

      // Act
      await paymentController.getOutstandingBills(mockRequest, mockResponse);

      // Assert
      expect(mockPaymentService.getOutstandingBills).toHaveBeenCalledWith('user-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBills
      });
    });

    test('should return empty array when no bills found', async () => {
      // Arrange
      mockRequest.params.userId = 'user-456';
      mockPaymentService.getOutstandingBills.mockResolvedValue({
        success: true,
        bills: []
      });

      // Act
      await paymentController.getOutstandingBills(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });
  });

  describe('getOutstandingBills - Negative Cases', () => {
    test('should return 400 for missing userId', async () => {
      // Arrange
      mockRequest.params = {}; // No userId

      // Act
      await paymentController.getOutstandingBills(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User ID is required'
      });
    });

    test('should return 500 for service errors', async () => {
      // Arrange
      mockRequest.params.userId = 'user-123';
      mockPaymentService.getOutstandingBills.mockRejectedValue(
        new Error('Database query failed')
      );

      // Act
      await paymentController.getOutstandingBills(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        details: 'Database query failed'
      });
    });
  });

  describe('getPaymentHistory - Positive Cases', () => {
    test('should return payment history with default pagination', async () => {
      // Arrange
      mockRequest.params.userId = 'user-123';
      mockRequest.query = {}; // No pagination params
      const mockHistory = {
        payments: [
          { _id: 'payment-1', amount: 100, status: 'SUCCESS' },
          { _id: 'payment-2', amount: 200, status: 'SUCCESS' }
        ],
        pagination: { limit: 10, skip: 0, total: 2 }
      };
      mockPaymentService.getPaymentHistory.mockResolvedValue({
        success: true,
        ...mockHistory
      });

      // Act
      await paymentController.getPaymentHistory(mockRequest, mockResponse);

      // Assert
      expect(mockPaymentService.getPaymentHistory).toHaveBeenCalledWith(
        'user-123', { limit: 10, skip: 0 }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory.payments,
        pagination: mockHistory.pagination
      });
    });

    test('should return payment history with custom pagination', async () => {
      // Arrange
      mockRequest.params.userId = 'user-123';
      mockRequest.query = { limit: '5', skip: '10' };
      mockPaymentService.getPaymentHistory.mockResolvedValue({
        success: true,
        payments: [],
        pagination: { limit: 5, skip: 10, total: 0 }
      });

      // Act
      await paymentController.getPaymentHistory(mockRequest, mockResponse);

      // Assert
      expect(mockPaymentService.getPaymentHistory).toHaveBeenCalledWith(
        'user-123', { limit: 5, skip: 10 }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    test('should handle pagination with string numbers', async () => {
      // Arrange
      mockRequest.params.userId = 'user-123';
      mockRequest.query = { limit: 'abc', skip: 'xyz' }; // Invalid numbers
      mockPaymentService.getPaymentHistory.mockResolvedValue({
        success: true,
        payments: [],
        pagination: { limit: 10, skip: 0, total: 0 }
      });

      // Act
      await paymentController.getPaymentHistory(mockRequest, mockResponse);

      // Assert
      expect(mockPaymentService.getPaymentHistory).toHaveBeenCalledWith(
        'user-123', { limit: 10, skip: 0 }
      );
    });
  });

  describe('getPaymentHistory - Negative Cases', () => {
    test('should return 400 for missing userId', async () => {
      // Arrange
      mockRequest.params = {}; // No userId

      // Act
      await paymentController.getPaymentHistory(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User ID is required'
      });
    });

    test('should return 500 for service errors', async () => {
      // Arrange
      mockRequest.params.userId = 'user-123';
      mockPaymentService.getPaymentHistory.mockRejectedValue(
        new Error('Database connection lost')
      );

      // Act
      await paymentController.getPaymentHistory(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        details: 'Database connection lost'
      });
    });
  });

  describe('getPaymentReceipt - Positive Cases', () => {
    test('should return payment receipt for valid transaction', async () => {
      // Arrange
      mockRequest.params.transactionId = 'TXN_123';
      const mockReceipt = {
        transactionId: 'TXN_123',
        amount: 150.75,
        status: 'SUCCESS',
        timestamp: new Date(),
        receiptUrl: 'https://example.com/receipt/TXN_123.pdf'
      };
      mockPaymentService.getPaymentReceipt.mockResolvedValue({
        success: true,
        receipt: mockReceipt
      });

      // Act
      await paymentController.getPaymentReceipt(mockRequest, mockResponse);

      // Assert
      expect(mockPaymentService.getPaymentReceipt).toHaveBeenCalledWith('TXN_123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockReceipt
      });
    });
  });

  describe('getPaymentReceipt - Negative Cases', () => {
    test('should return 400 for missing transaction ID', async () => {
      // Arrange
      mockRequest.params = {}; // No transactionId

      // Act
      await paymentController.getPaymentReceipt(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Transaction ID is required'
      });
    });

    test('should return 404 for non-existent transaction', async () => {
      // Arrange
      mockRequest.params.transactionId = 'TXN_NONEXISTENT';
      mockPaymentService.getPaymentReceipt.mockResolvedValue({
        success: false,
        error: 'Transaction not found'
      });

      // Act
      await paymentController.getPaymentReceipt(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Transaction not found'
      });
    });

    test('should return 500 for service errors', async () => {
      // Arrange
      mockRequest.params.transactionId = 'TXN_123';
      mockPaymentService.getPaymentReceipt.mockRejectedValue(
        new Error('Receipt generation failed')
      );

      // Act
      await paymentController.getPaymentReceipt(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        details: 'Receipt generation failed'
      });
    });
  });

  describe('Error Handling Edge Cases', () => {
    test('should handle malformed JSON in request body', async () => {
      // Arrange
      mockRequest.body = 'invalid json';

      // Act
      await paymentController.processPayment(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Invalid request data')
        })
      );
    });

    test('should handle null request parameters', async () => {
      // Arrange
      mockRequest.params.userId = null;

      // Act
      await paymentController.getOutstandingBills(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User ID is required'
      });
    });

    test('should handle undefined request parameters', async () => {
      // Arrange
      mockRequest.params.transactionId = undefined;

      // Act
      await paymentController.getPaymentReceipt(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Transaction ID is required'
      });
    });
  });
});