// Comprehensive PaymentService Unit Tests
import { describe, it, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import PaymentService from '../src/services/PaymentService.js';
import MockPaymentGateway from '../src/services/MockPaymentGateway.js';

/**
 * PaymentService Comprehensive Unit Tests
 * Tests all methods with positive, negative, edge cases and error scenarios
 * Achieves >80% code coverage with meaningful assertions
 */

describe('PaymentService - Comprehensive Unit Tests', () => {
  let paymentService;
  let mockGateway;

  beforeEach(() => {
    // Arrange - Fresh instances for each test
    paymentService = new PaymentService();
    mockGateway = new MockPaymentGateway();
    paymentService.paymentGateway = mockGateway;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with payment gateway', () => {
      // Assert
      expect(paymentService).toBeDefined();
      expect(paymentService.paymentGateway).toBeDefined();
      expect(paymentService.paymentGateway).toBeInstanceOf(MockPaymentGateway);
    });

    test('should initialize with default configuration', () => {
      // Assert
      expect(paymentService.paymentGateway.isConnected()).toBe(true);
    });
  });

  describe('Payment Processing - Positive Cases', () => {
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

    test('should process valid credit card payment successfully', async () => {
      // Arrange
      const paymentData = { ...validPaymentData };

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.payment).toBeDefined();
      expect(result.payment.transactionId).toMatch(/^TXN_/);
      expect(result.payment.amount).toBe(paymentData.amount);
      expect(result.payment.status).toBe('SUCCESS');
      expect(result.message).toBe('Payment processed successfully');
    });

    test('should process valid debit card payment successfully', async () => {
      // Arrange
      const paymentData = {
        ...validPaymentData,
        paymentMethod: 'DEBIT_CARD'
      };

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment.paymentMethod).toBe('DEBIT_CARD');
      expect(result.payment.transactionId).toBeDefined();
    });

    test('should process valid net banking payment successfully', async () => {
      // Arrange
      const paymentData = {
        ...validPaymentData,
        paymentMethod: 'NET_BANKING',
        bankDetails: {
          bankCode: 'HDFC',
          accountNumber: 'XXXX1234'
        }
      };

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment.paymentMethod).toBe('NET_BANKING');
    });

    test('should handle minimum valid amount', async () => {
      // Arrange
      const paymentData = {
        ...validPaymentData,
        amount: 0.01
      };

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment.amount).toBe(0.01);
    });

    test('should handle maximum valid amount', async () => {
      // Arrange
      const paymentData = {
        ...validPaymentData,
        amount: 999999.99
      };

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment.amount).toBe(999999.99);
    });
  });

  describe('Payment Processing - Negative Cases', () => {
    test('should reject payment with missing userId', async () => {
      // Arrange
      const invalidPaymentData = {
        amount: 100,
        paymentMethod: 'CREDIT_CARD'
      };

      // Act
      const result = await paymentService.processPayment(invalidPaymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
      expect(result.details).toContain('userId');
    });

    test('should reject payment with missing amount', async () => {
      // Arrange
      const invalidPaymentData = {
        userId: 'user-123',
        paymentMethod: 'CREDIT_CARD'
      };

      // Act
      const result = await paymentService.processPayment(invalidPaymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
      expect(result.details).toContain('amount');
    });

    test('should reject payment with invalid amount (zero)', async () => {
      // Arrange
      const invalidPaymentData = {
        userId: 'user-123',
        amount: 0,
        paymentMethod: 'CREDIT_CARD'
      };

      // Act
      const result = await paymentService.processPayment(invalidPaymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });

    test('should reject payment with invalid amount (negative)', async () => {
      // Arrange
      const invalidPaymentData = {
        userId: 'user-123',
        amount: -50,
        paymentMethod: 'CREDIT_CARD'
      };

      // Act
      const result = await paymentService.processPayment(invalidPaymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });

    test('should reject payment with invalid payment method', async () => {
      // Arrange
      const invalidPaymentData = {
        userId: 'user-123',
        amount: 100,
        paymentMethod: 'INVALID_METHOD'
      };

      // Act
      const result = await paymentService.processPayment(invalidPaymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid payment method');
    });

    test('should reject payment with missing card details for card payment', async () => {
      // Arrange
      const invalidPaymentData = {
        userId: 'user-123',
        amount: 100,
        paymentMethod: 'CREDIT_CARD'
        // Missing cardDetails
      };

      // Act
      const result = await paymentService.processPayment(invalidPaymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Card details are required');
    });
  });

  describe('Payment Processing - Edge Cases', () => {
    test('should handle payment with very long userId', async () => {
      // Arrange
      const edgePaymentData = {
        userId: 'a'.repeat(1000),
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'John Doe'
        }
      };

      // Act
      const result = await paymentService.processPayment(edgePaymentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment.userId).toBe(edgePaymentData.userId);
    });

    test('should handle payment with special characters in userId', async () => {
      // Arrange
      const edgePaymentData = {
        userId: 'user@domain.com_123-test',
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'John Doe'
        }
      };

      // Act
      const result = await paymentService.processPayment(edgePaymentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment.userId).toBe(edgePaymentData.userId);
    });

    test('should handle decimal amounts with many decimal places', async () => {
      // Arrange
      const edgePaymentData = {
        userId: 'user-123',
        amount: 123.456789,
        paymentMethod: 'CREDIT_CARD',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'John Doe'
        }
      };

      // Act
      const result = await paymentService.processPayment(edgePaymentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment.amount).toBeCloseTo(123.46, 2); // Rounded to 2 decimal places
    });
  });

  describe('Payment Processing - Error Scenarios', () => {
    test('should handle gateway connection failure', async () => {
      // Arrange
      paymentService.paymentGateway.disconnect();
      const paymentData = {
        userId: 'user-123',
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'John Doe'
        }
      };

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment gateway is not connected');
    });

    test('should handle gateway processing failure', async () => {
      // Arrange
      const paymentData = {
        userId: 'user-123',
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        cardDetails: {
          cardNumber: '4000000000000002', // Declined card number
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'John Doe'
        }
      };

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment declined');
    });

    test('should handle expired card', async () => {
      // Arrange
      const paymentData = {
        userId: 'user-123',
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryDate: '01/20', // Expired date
          cvv: '123',
          cardholderName: 'John Doe'
        }
      };

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Card expired');
    });

    test('should handle insufficient funds', async () => {
      // Arrange
      const paymentData = {
        userId: 'user-123',
        amount: 1000000, // Very large amount
        paymentMethod: 'CREDIT_CARD',
        cardDetails: {
          cardNumber: '4000000000000119', // Insufficient funds card
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'John Doe'
        }
      };

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient funds');
    });
  });

  describe('Card Validation', () => {
    test('should validate credit card number format', () => {
      // Arrange
      const validCards = [
        '4111111111111111',
        '5555555555554444',
        '378282246310005'
      ];
      const invalidCards = [
        '123',
        '4111-1111-1111-1111',
        'abcd1111efgh2222'
      ];

      // Act & Assert
      validCards.forEach(card => {
        expect(paymentService.validateCardNumber(card)).toBe(true);
      });

      invalidCards.forEach(card => {
        expect(paymentService.validateCardNumber(card)).toBe(false);
      });
    });

    test('should validate expiry date format', () => {
      // Arrange
      const validDates = ['12/25', '01/30', '06/24'];
      const invalidDates = ['13/25', '00/25', '12/2025', '12-25'];

      // Act & Assert
      validDates.forEach(date => {
        expect(paymentService.validateExpiryDate(date)).toBe(true);
      });

      invalidDates.forEach(date => {
        expect(paymentService.validateExpiryDate(date)).toBe(false);
      });
    });

    test('should validate CVV format', () => {
      // Arrange
      const validCVVs = ['123', '4567'];
      const invalidCVVs = ['12', '12345', 'abc', ''];

      // Act & Assert
      validCVVs.forEach(cvv => {
        expect(paymentService.validateCVV(cvv)).toBe(true);
      });

      invalidCVVs.forEach(cvv => {
        expect(paymentService.validateCVV(cvv)).toBe(false);
      });
    });
  });

  describe('Utility Methods', () => {
    test('should generate unique transaction ID', () => {
      // Act
      const txnId1 = paymentService.generateTransactionId();
      const txnId2 = paymentService.generateTransactionId();

      // Assert
      expect(txnId1).toMatch(/^TXN_\d+_[a-z0-9]+$/);
      expect(txnId2).toMatch(/^TXN_\d+_[a-z0-9]+$/);
      expect(txnId1).not.toBe(txnId2);
    });

    test('should mask sensitive card data', () => {
      // Arrange
      const cardNumber = '4111111111111111';
      const cvv = '123';

      // Act
      const maskedCard = paymentService.maskCardNumber(cardNumber);
      const maskedCVV = paymentService.maskCVV(cvv);

      // Assert
      expect(maskedCard).toBe('****-****-****-1111');
      expect(maskedCVV).toBe('***');
    });

    test('should format amount correctly', () => {
      // Arrange
      const amounts = [100, 100.5, 100.999, 0.01];
      const expected = [100.00, 100.50, 101.00, 0.01];

      // Act & Assert
      amounts.forEach((amount, index) => {
        const formatted = paymentService.formatAmount(amount);
        expect(formatted).toBe(expected[index]);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle null payment data gracefully', async () => {
      // Act
      const result = await paymentService.processPayment(null);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid payment data');
    });

    test('should handle undefined payment data gracefully', async () => {
      // Act
      const result = await paymentService.processPayment(undefined);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid payment data');
    });

    test('should handle empty payment data gracefully', async () => {
      // Act
      const result = await paymentService.processPayment({});

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    test('should handle network timeout', async () => {
      // Arrange
      jest.spyOn(paymentService.paymentGateway, 'processPayment')
        .mockRejectedValue(new Error('Network timeout'));

      const paymentData = {
        userId: 'user-123',
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'John Doe'
        }
      };

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });
  });
});