import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';
import paymentApi from '../api/paymentApi';

// Mock the payment API
jest.mock('../api/paymentApi');
const mockPaymentApi = paymentApi;

// Mock the payment store
jest.mock('../store/usePaymentStore', () => ({
  __esModule: true,
  default: () => ({
    processing: false,
    setProcessing: jest.fn(),
    setError: jest.fn()
  })
}));

/**
 * PaymentForm Component Tests
 * Tests form validation, user interactions, and payment processing
 */
describe('PaymentForm Component', () => {
  const mockBill = {
    _id: 'bill-123',
    amount: 120.00,
    billId: 'BILL_123',
    dueDate: new Date('2024-12-31')
  };

  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPaymentForm = () => {
    return render(
      <BrowserRouter>
        <PaymentForm
          bill={mockBill}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    test('should render payment form with bill amount', () => {
      renderPaymentForm();
      
      expect(screen.getByText('Payment Details')).toBeInTheDocument();
      expect(screen.getByText('Complete your payment for $120')).toBeInTheDocument();
    });

    test('should render payment method options', () => {
      renderPaymentForm();
      
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
      expect(screen.getByText('Debit Card')).toBeInTheDocument();
      expect(screen.getByText('Net Banking')).toBeInTheDocument();
    });

    test('should render card details form for credit card', () => {
      renderPaymentForm();
      
      expect(screen.getByPlaceholderText('1234 5678 9012 3456')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('MM/YY')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('123')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    test('should render action buttons', () => {
      renderPaymentForm();
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm Payment')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('should show validation errors for empty form submission', async () => {
      renderPaymentForm();
      
      const submitButton = screen.getByText('Confirm Payment');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please select a payment method')).toBeInTheDocument();
      });
    });

    test('should validate card number format', async () => {
      renderPaymentForm();
      
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      fireEvent.change(cardNumberInput, { target: { value: '123' } });
      
      const submitButton = screen.getByText('Confirm Payment');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid card number')).toBeInTheDocument();
      });
    });

    test('should validate expiry date format', async () => {
      renderPaymentForm();
      
      const expiryInput = screen.getByPlaceholderText('MM/YY');
      fireEvent.change(expiryInput, { target: { value: '12' } });
      
      const submitButton = screen.getByText('Confirm Payment');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter expiry date in MM/YY format')).toBeInTheDocument();
      });
    });

    test('should validate CVV length', async () => {
      renderPaymentForm();
      
      const cvvInput = screen.getByPlaceholderText('123');
      fireEvent.change(cvvInput, { target: { value: '12' } });
      
      const submitButton = screen.getByText('Confirm Payment');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid CVV')).toBeInTheDocument();
      });
    });

    test('should validate cardholder name', async () => {
      renderPaymentForm();
      
      const nameInput = screen.getByPlaceholderText('John Doe');
      fireEvent.change(nameInput, { target: { value: '' } });
      
      const submitButton = screen.getByText('Confirm Payment');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter cardholder name')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    test('should change payment method when radio button is clicked', () => {
      renderPaymentForm();
      
      const debitCardRadio = screen.getByDisplayValue('DEBIT_CARD');
      fireEvent.click(debitCardRadio);
      
      expect(debitCardRadio).toBeChecked();
    });

    test('should format card number with spaces', () => {
      renderPaymentForm();
      
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      fireEvent.change(cardNumberInput, { target: { value: '4111111111111111' } });
      
      expect(cardNumberInput.value).toBe('4111 1111 1111 1111');
    });

    test('should toggle save card checkbox', () => {
      renderPaymentForm();
      
      const saveCardCheckbox = screen.getByRole('checkbox', { name: /save card/i });
      fireEvent.click(saveCardCheckbox);
      
      expect(saveCardCheckbox).toBeChecked();
    });

    test('should call onCancel when cancel button is clicked', () => {
      renderPaymentForm();
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Payment Processing', () => {
    test('should process payment successfully', async () => {
      const mockPaymentResult = {
        success: true,
        data: {
          payment: {
            _id: 'payment-123',
            transactionId: 'TXN_123',
            status: 'SUCCESS',
            amount: 120.00
          },
          receiptUrl: '/receipt/TXN_123'
        }
      };

      mockPaymentApi.processPayment.mockResolvedValue(mockPaymentResult);

      renderPaymentForm();
      
      // Fill form
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryInput = screen.getByPlaceholderText('MM/YY');
      const cvvInput = screen.getByPlaceholderText('123');
      const nameInput = screen.getByPlaceholderText('John Doe');
      
      fireEvent.change(cardNumberInput, { target: { value: '4111111111111111' } });
      fireEvent.change(expiryInput, { target: { value: '12/25' } });
      fireEvent.change(cvvInput, { target: { value: '123' } });
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      const submitButton = screen.getByText('Confirm Payment');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPaymentApi.processPayment).toHaveBeenCalledWith({
          userId: 'residents',
          amount: 120.00,
          paymentMethod: 'CREDIT_CARD',
          cardDetails: {
            cardNumber: '4111 1111 1111 1111',
            expiryDate: '12/25',
            cvv: '123',
            cardholderName: 'John Doe'
          }
        });
        expect(mockOnSuccess).toHaveBeenCalledWith(mockPaymentResult.data);
      });
    });

    test('should handle payment failure', async () => {
      const mockPaymentError = new Error('Payment failed');
      mockPaymentApi.processPayment.mockRejectedValue(mockPaymentError);

      renderPaymentForm();
      
      // Fill form
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryInput = screen.getByPlaceholderText('MM/YY');
      const cvvInput = screen.getByPlaceholderText('123');
      const nameInput = screen.getByPlaceholderText('John Doe');
      
      fireEvent.change(cardNumberInput, { target: { value: '4111111111111111' } });
      fireEvent.change(expiryInput, { target: { value: '12/25' } });
      fireEvent.change(cvvInput, { target: { value: '123' } });
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      const submitButton = screen.getByText('Confirm Payment');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPaymentApi.processPayment).toHaveBeenCalled();
        // Error should be handled by the component
      });
    });

    test('should show processing state during payment', async () => {
      // Mock a delayed response
      mockPaymentApi.processPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100))
      );

      renderPaymentForm();
      
      // Fill form
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      fireEvent.change(cardNumberInput, { target: { value: '4111111111111111' } });
      
      const submitButton = screen.getByText('Confirm Payment');
      fireEvent.click(submitButton);
      
      // Should show processing state
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Net Banking Payment', () => {
    test('should show net banking message when selected', () => {
      renderPaymentForm();
      
      const netBankingRadio = screen.getByDisplayValue('NET_BANKING');
      fireEvent.click(netBankingRadio);
      
      expect(screen.getByText(/You will be redirected to your bank's secure payment page/)).toBeInTheDocument();
    });

    test('should not show card details for net banking', () => {
      renderPaymentForm();
      
      const netBankingRadio = screen.getByDisplayValue('NET_BANKING');
      fireEvent.click(netBankingRadio);
      
      expect(screen.queryByPlaceholderText('1234 5678 9012 3456')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper form labels', () => {
      renderPaymentForm();
      
      expect(screen.getByLabelText('Card Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Expiry Date')).toBeInTheDocument();
      expect(screen.getByLabelText('CVV')).toBeInTheDocument();
      expect(screen.getByLabelText('Cardholder Name')).toBeInTheDocument();
    });

    test('should have proper button roles', () => {
      renderPaymentForm();
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm Payment' })).toBeInTheDocument();
    });
  });
});
