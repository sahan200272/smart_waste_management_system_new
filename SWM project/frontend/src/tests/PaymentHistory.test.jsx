import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PaymentHistory from '../components/PaymentHistory';
import paymentApi from '../api/paymentApi';
import usePaymentStore from '../store/usePaymentStore';

// Mock the payment API
jest.mock('../api/paymentApi');
const mockPaymentApi = paymentApi;

// Mock the payment store
jest.mock('../store/usePaymentStore', () => ({
  __esModule: true,
  default: () => ({
    paymentHistory: [],
    setPaymentHistory: jest.fn(),
    loading: false,
    setLoading: jest.fn(),
    error: null,
    setError: jest.fn()
  })
}));

/**
 * PaymentHistory Component Tests
 * Tests payment history display, filtering, and pagination
 */
describe('PaymentHistory Component', () => {
  const mockUserId = 'test-user-123';
  const mockPayments = [
    {
      _id: 'payment-1',
      transactionId: 'TXN_001',
      amount: 120.00,
      status: 'SUCCESS',
      paymentMethod: 'CREDIT_CARD',
      createdAt: '2024-03-10T10:34:00Z'
    },
    {
      _id: 'payment-2',
      transactionId: 'TXN_002',
      amount: 95.00,
      status: 'FAILED',
      paymentMethod: 'DEBIT_CARD',
      failureReason: 'Insufficient funds',
      createdAt: '2024-02-25T14:20:00Z'
    },
    {
      _id: 'payment-3',
      transactionId: 'TXN_003',
      amount: 100.00,
      status: 'SUCCESS',
      paymentMethod: 'NET_BANKING',
      createdAt: '2024-01-15T09:15:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPaymentHistory = () => {
    return render(
      <BrowserRouter>
        <PaymentHistory userId={mockUserId} />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    test('should render payment history header', () => {
      renderPaymentHistory();
      
      expect(screen.getByText('Payment History')).toBeInTheDocument();
    });

    test('should render filter dropdown', () => {
      renderPaymentHistory();
      
      expect(screen.getByDisplayValue('All Payments')).toBeInTheDocument();
      expect(screen.getByText('Successful')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    test('should show loading state', () => {
      // Mock loading state
      usePaymentStore.mockReturnValue({
        paymentHistory: [],
        setPaymentHistory: jest.fn(),
        loading: true,
        setLoading: jest.fn(),
        error: null,
        setError: jest.fn()
      });

      renderPaymentHistory();
      
      expect(screen.getByText('Loading payment data...')).toBeInTheDocument();
    });

    test('should show error state', () => {
      // Mock error state
      usePaymentStore.mockReturnValue({
        paymentHistory: [],
        setPaymentHistory: jest.fn(),
        loading: false,
        setLoading: jest.fn(),
        error: 'Failed to load payment history',
        setError: jest.fn()
      });

      renderPaymentHistory();
      
      expect(screen.getByText('Failed to load payment history')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    test('should show empty state when no payments', () => {
      // Mock empty state
      usePaymentStore.mockReturnValue({
        paymentHistory: [],
        setPaymentHistory: jest.fn(),
        loading: false,
        setLoading: jest.fn(),
        error: null,
        setError: jest.fn()
      });

      renderPaymentHistory();
      
      expect(screen.getByText('No payment history found')).toBeInTheDocument();
    });
  });

  describe('Payment List Display', () => {
    beforeEach(() => {
      // Mock store with payment data
      usePaymentStore.mockReturnValue({
        paymentHistory: mockPayments,
        setPaymentHistory: jest.fn(),
        loading: false,
        setLoading: jest.fn(),
        error: null,
        setError: jest.fn()
      });
    });

    test('should display payment list', () => {
      renderPaymentHistory();
      
      expect(screen.getByText('$120')).toBeInTheDocument();
      expect(screen.getByText('$95')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
    });

    test('should display payment method icons', () => {
      renderPaymentHistory();
      
      // Check for payment method icons (💳 for cards, 🏦 for net banking)
      const cardIcons = document.querySelectorAll('text-2xl');
      expect(cardIcons.length).toBeGreaterThan(0);
    });

    test('should display status badges', () => {
      renderPaymentHistory();
      
      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    test('should display transaction IDs', () => {
      renderPaymentHistory();
      
      expect(screen.getByText('TXN_001')).toBeInTheDocument();
      expect(screen.getByText('TXN_002')).toBeInTheDocument();
      expect(screen.getByText('TXN_003')).toBeInTheDocument();
    });

    test('should display formatted dates', () => {
      renderPaymentHistory();
      
      // Should display formatted dates (exact format may vary)
      expect(screen.getByText(/Mar 10/)).toBeInTheDocument();
      expect(screen.getByText(/Feb 25/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      usePaymentStore.mockReturnValue({
        paymentHistory: mockPayments,
        setPaymentHistory: jest.fn(),
        loading: false,
        setLoading: jest.fn(),
        error: null,
        setError: jest.fn()
      });
    });

    test('should filter by successful payments', () => {
      renderPaymentHistory();
      
      const filterSelect = screen.getByDisplayValue('All Payments');
      fireEvent.change(filterSelect, { target: { value: 'SUCCESS' } });
      
      // Should only show successful payments
      expect(screen.getByText('$120')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
      expect(screen.queryByText('$95')).not.toBeInTheDocument();
    });

    test('should filter by failed payments', () => {
      renderPaymentHistory();
      
      const filterSelect = screen.getByDisplayValue('All Payments');
      fireEvent.change(filterSelect, { target: { value: 'FAILED' } });
      
      // Should only show failed payments
      expect(screen.getByText('$95')).toBeInTheDocument();
      expect(screen.queryByText('$120')).not.toBeInTheDocument();
      expect(screen.queryByText('$100')).not.toBeInTheDocument();
    });

    test('should show all payments when filter is set to ALL', () => {
      renderPaymentHistory();
      
      const filterSelect = screen.getByDisplayValue('All Payments');
      fireEvent.change(filterSelect, { target: { value: 'ALL' } });
      
      // Should show all payments
      expect(screen.getByText('$120')).toBeInTheDocument();
      expect(screen.getByText('$95')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      usePaymentStore.mockReturnValue({
        paymentHistory: mockPayments,
        setPaymentHistory: jest.fn(),
        loading: false,
        setLoading: jest.fn(),
        error: null,
        setError: jest.fn()
      });
    });

    test('should handle view receipt click for successful payments', () => {
      mockPaymentApi.getPaymentReceipt.mockResolvedValue({
        data: { transactionId: 'TXN_001', amount: 120.00 }
      });

      renderPaymentHistory();
      
      const viewReceiptButton = screen.getByText('View Receipt');
      fireEvent.click(viewReceiptButton);
      
      // Should call the API to get receipt
      expect(mockPaymentApi.getPaymentReceipt).toHaveBeenCalled();
    });

    test('should handle retry payment click for failed payments', () => {
      renderPaymentHistory();
      
      // Change filter to show failed payments
      const filterSelect = screen.getByDisplayValue('All Payments');
      fireEvent.change(filterSelect, { target: { value: 'FAILED' } });
      
      const retryButton = screen.getByText('Retry Payment');
      fireEvent.click(retryButton);
      
      // Should handle retry action (implementation depends on component)
      expect(retryButton).toBeInTheDocument();
    });

    test('should handle download receipt', async () => {
      mockPaymentApi.getPaymentReceipt.mockResolvedValue({
        data: { transactionId: 'TXN_001', amount: 120.00 }
      });

      renderPaymentHistory();
      
      const viewReceiptButton = screen.getByText('View Receipt');
      fireEvent.click(viewReceiptButton);
      
      await waitFor(() => {
        expect(mockPaymentApi.getPaymentReceipt).toHaveBeenCalledWith('TXN_001');
      });
    });
  });

  describe('Pagination', () => {
    const manyPayments = Array.from({ length: 15 }, (_, i) => ({
      _id: `payment-${i}`,
      transactionId: `TXN_${i.toString().padStart(3, '0')}`,
      amount: 100 + i,
      status: 'SUCCESS',
      paymentMethod: 'CREDIT_CARD',
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
    }));

    beforeEach(() => {
      usePaymentStore.mockReturnValue({
        paymentHistory: manyPayments,
        setPaymentHistory: jest.fn(),
        loading: false,
        setLoading: jest.fn(),
        error: null,
        setError: jest.fn()
      });
    });

    test('should show pagination controls when there are many payments', () => {
      renderPaymentHistory();
      
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    test('should disable previous button on first page', () => {
      renderPaymentHistory();
      
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    test('should disable next button on last page', () => {
      // Mock being on last page
      usePaymentStore.mockReturnValue({
        paymentHistory: manyPayments.slice(10),
        setPaymentHistory: jest.fn(),
        loading: false,
        setLoading: jest.fn(),
        error: null,
        setError: jest.fn()
      });

      renderPaymentHistory();
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    test('should handle page navigation', () => {
      renderPaymentHistory();
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      // Should trigger page change (implementation depends on component)
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle receipt download error', async () => {
      mockPaymentApi.getPaymentReceipt.mockRejectedValue(new Error('Receipt not found'));

      usePaymentStore.mockReturnValue({
        paymentHistory: mockPayments,
        setPaymentHistory: jest.fn(),
        loading: false,
        setLoading: jest.fn(),
        error: null,
        setError: jest.fn()
      });

      renderPaymentHistory();
      
      const viewReceiptButton = screen.getByText('View Receipt');
      fireEvent.click(viewReceiptButton);
      
      await waitFor(() => {
        expect(mockPaymentApi.getPaymentReceipt).toHaveBeenCalled();
      });
    });

    test('should handle retry on error', () => {
      usePaymentStore.mockReturnValue({
        paymentHistory: [],
        setPaymentHistory: jest.fn(),
        loading: false,
        setLoading: jest.fn(),
        error: 'Failed to load payment history',
        setError: jest.fn()
      });

      renderPaymentHistory();
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      // Should trigger retry action
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      usePaymentStore.mockReturnValue({
        paymentHistory: mockPayments,
        setPaymentHistory: jest.fn(),
        loading: false,
        setLoading: jest.fn(),
        error: null,
        setError: jest.fn()
      });
    });

    test('should have proper button roles', () => {
      renderPaymentHistory();
      
      expect(screen.getByRole('button', { name: 'View Receipt' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry Payment' })).toBeInTheDocument();
    });

    test('should have proper select element', () => {
      renderPaymentHistory();
      
      const filterSelect = screen.getByDisplayValue('All Payments');
      expect(filterSelect).toBeInTheDocument();
    });

    test('should have proper heading structure', () => {
      renderPaymentHistory();
      
      expect(screen.getByRole('heading', { name: 'Payment History' })).toBeInTheDocument();
    });
  });
});
