import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PaymentReceipt from '../components/PaymentReceipt';
import paymentApi from '../api/paymentApi';

// Mock the payment API
jest.mock('../api/paymentApi');
const mockPaymentApi = paymentApi;

/**
 * PaymentReceipt Component Tests
 * Tests receipt display, success/failure states, and user interactions
 */
describe('PaymentReceipt Component', () => {
  const mockOnClose = jest.fn();
  const mockOnDownloadReceipt = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPaymentReceipt = (payment) => {
    return render(
      <BrowserRouter>
        <PaymentReceipt
          payment={payment}
          onClose={mockOnClose}
          onDownloadReceipt={mockOnDownloadReceipt}
        />
      </BrowserRouter>
    );
  };

  describe('Successful Payment Receipt', () => {
    const successfulPayment = {
      _id: 'payment-123',
      transactionId: 'TXN_123',
      amount: 120.00,
      status: 'SUCCESS',
      paymentMethod: 'CREDIT_CARD',
      paidAt: '2024-03-10T10:34:00Z',
      createdAt: '2024-03-10T10:34:00Z'
    };

    test('should render success icon and message', () => {
      renderPaymentReceipt(successfulPayment);
      
      expect(screen.getByText('Payment Successful')).toBeInTheDocument();
    });

    test('should display payment details', () => {
      renderPaymentReceipt(successfulPayment);
      
      expect(screen.getByText('$120')).toBeInTheDocument();
      expect(screen.getByText('TXN_123')).toBeInTheDocument();
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
    });

    test('should show download receipt button', () => {
      renderPaymentReceipt(successfulPayment);
      
      expect(screen.getByText('Download Receipt')).toBeInTheDocument();
    });

    test('should call onDownloadReceipt when download button is clicked', () => {
      renderPaymentReceipt(successfulPayment);
      
      const downloadButton = screen.getByText('Download Receipt');
      fireEvent.click(downloadButton);
      
      expect(mockOnDownloadReceipt).toHaveBeenCalledWith(successfulPayment);
    });

    test('should call onClose when done button is clicked', () => {
      renderPaymentReceipt(successfulPayment);
      
      const doneButton = screen.getByText('Done');
      fireEvent.click(doneButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should load receipt data on mount', async () => {
      const mockReceiptData = {
        data: {
          transactionId: 'TXN_123',
          amount: 120.00,
          paymentMethod: 'CREDIT_CARD',
          paidAt: '2024-03-10T10:34:00Z',
          receiptUrl: '/receipt/TXN_123',
          billId: 'BILL_123'
        }
      };

      mockPaymentApi.getPaymentReceipt.mockResolvedValue(mockReceiptData);

      renderPaymentReceipt(successfulPayment);
      
      await waitFor(() => {
        expect(mockPaymentApi.getPaymentReceipt).toHaveBeenCalledWith('TXN_123');
      });
    });
  });

  describe('Failed Payment Receipt', () => {
    const failedPayment = {
      _id: 'payment-123',
      transactionId: 'TXN_123',
      amount: 120.00,
      status: 'FAILED',
      paymentMethod: 'CREDIT_CARD',
      failureReason: 'Insufficient funds',
      createdAt: '2024-03-10T10:34:00Z'
    };

    test('should render failure icon and message', () => {
      renderPaymentReceipt(failedPayment);
      
      expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    });

    test('should display failure reason', () => {
      renderPaymentReceipt(failedPayment);
      
      expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
    });

    test('should show try again button', () => {
      renderPaymentReceipt(failedPayment);
      
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    test('should call onClose when try again button is clicked', () => {
      renderPaymentReceipt(failedPayment);
      
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pending Payment Receipt', () => {
    const pendingPayment = {
      _id: 'payment-123',
      transactionId: 'TXN_123',
      amount: 120.00,
      status: 'PENDING',
      paymentMethod: 'CREDIT_CARD',
      createdAt: '2024-03-10T10:34:00Z'
    };

    test('should render pending state', () => {
      renderPaymentReceipt(pendingPayment);
      
      expect(screen.getByText('Processing Payment...')).toBeInTheDocument();
    });

    test('should show loading spinner', () => {
      renderPaymentReceipt(pendingPayment);
      
      // Check for loading spinner (animated element)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Date and Time Formatting', () => {
    const paymentWithDates = {
      _id: 'payment-123',
      transactionId: 'TXN_123',
      amount: 120.00,
      status: 'SUCCESS',
      paymentMethod: 'CREDIT_CARD',
      paidAt: '2024-03-10T10:34:00Z',
      createdAt: '2024-03-10T10:34:00Z'
    };

    test('should format date correctly', () => {
      renderPaymentReceipt(paymentWithDates);
      
      // The exact format may vary based on locale, but should contain the date
      expect(screen.getByText(/Mar 10/)).toBeInTheDocument();
    });

    test('should format time correctly', () => {
      renderPaymentReceipt(paymentWithDates);
      
      // The exact format may vary based on locale, but should contain the time
      expect(screen.getByText(/10:34/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle receipt loading error', async () => {
      const successfulPayment = {
        _id: 'payment-123',
        transactionId: 'TXN_123',
        amount: 120.00,
        status: 'SUCCESS',
        paymentMethod: 'CREDIT_CARD',
        paidAt: '2024-03-10T10:34:00Z'
      };

      mockPaymentApi.getPaymentReceipt.mockRejectedValue(new Error('Receipt not found'));

      renderPaymentReceipt(successfulPayment);
      
      // Should still render the component even if receipt loading fails
      expect(screen.getByText('Payment Successful')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    const successfulPayment = {
      _id: 'payment-123',
      transactionId: 'TXN_123',
      amount: 120.00,
      status: 'SUCCESS',
      paymentMethod: 'CREDIT_CARD',
      paidAt: '2024-03-10T10:34:00Z'
    };

    test('should have proper button roles', () => {
      renderPaymentReceipt(successfulPayment);
      
      expect(screen.getByRole('button', { name: 'Download Receipt' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    test('should have proper heading structure', () => {
      renderPaymentReceipt(successfulPayment);
      
      expect(screen.getByRole('heading', { name: 'Payment Successful' })).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('should show loading state when receipt data is being fetched', async () => {
      const successfulPayment = {
        _id: 'payment-123',
        transactionId: 'TXN_123',
        amount: 120.00,
        status: 'SUCCESS',
        paymentMethod: 'CREDIT_CARD',
        paidAt: '2024-03-10T10:34:00Z'
      };

      // Mock a delayed response
      mockPaymentApi.getPaymentReceipt.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
      );

      renderPaymentReceipt(successfulPayment);
      
      // Should show loading state initially
      expect(screen.getByText('Loading receipt...')).toBeInTheDocument();
    });
  });
});
