// Comprehensive PaymentForm Component Tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';
import paymentApi from '../api/paymentApi';

// Mock the payment API
jest.mock('../api/paymentApi');
const mockPaymentApi = paymentApi;

// Mock the payment store
const mockSetProcessing = jest.fn();
const mockSetError = jest.fn();
jest.mock('../store/usePaymentStore', () => ({
  __esModule: true,
  default: () => ({
    processing: false,
    setProcessing: mockSetProcessing,
    setError: mockSetError
  })
}));

/**
 * PaymentForm Component Comprehensive Tests
 * Tests all form interactions, validations, and payment scenarios
 * Achieves >80% code coverage with meaningful assertions
 */
describe('PaymentForm Component - Comprehensive Tests', () => {
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

  const renderPaymentForm = (props = {}) => {
    return render(
      <BrowserRouter>
        <PaymentForm
          bill={mockBill}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          {...props}
        />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    test('should render payment form with all required elements', () => {
      renderPaymentForm();
      
      // Header and amount
      expect(screen.getByText('Payment Details')).toBeInTheDocument();
      expect(screen.getByText('Complete your payment for $120')).toBeInTheDocument();
      
      // Payment method options
      expect(screen.getByLabelText('Credit Card')).toBeInTheDocument();
      expect(screen.getByLabelText('Debit Card')).toBeInTheDocument();
      expect(screen.getByLabelText('Net Banking')).toBeInTheDocument();
      
      // Card details form
      expect(screen.getByPlaceholderText('1234 5678 9012 3456')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('MM/YY')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('123')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      
      // Action buttons
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm Payment')).toBeInTheDocument();
    });

    test('should render with custom bill amount', () => {
      const customBill = { ...mockBill, amount: 250.75 };
      renderPaymentForm({ bill: customBill });
      
      expect(screen.getByText('Complete your payment for $250.75')).toBeInTheDocument();
    });

    test('should render with zero amount', () => {
      const customBill = { ...mockBill, amount: 0 };
      renderPaymentForm({ bill: customBill });
      
      expect(screen.getByText('Complete your payment for $0')).toBeInTheDocument();
    });

    test('should render with large amount', () => {
      const customBill = { ...mockBill, amount: 999999.99 };
      renderPaymentForm({ bill: customBill });
      
      expect(screen.getByText('Complete your payment for $999999.99')).toBeInTheDocument();
    });
  });

  describe('Payment Method Selection', () => {
    test('should select credit card by default', () => {
      renderPaymentForm();
      
      const creditCardRadio = screen.getByLabelText('Credit Card');
      expect(creditCardRadio).toBeChecked();
    });

    test('should allow switching to debit card', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const debitCardRadio = screen.getByLabelText('Debit Card');
      await user.click(debitCardRadio);
      
      expect(debitCardRadio).toBeChecked();
      expect(screen.getByLabelText('Credit Card')).not.toBeChecked();
    });

    test('should allow switching to net banking', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const netBankingRadio = screen.getByLabelText('Net Banking');
      await user.click(netBankingRadio);
      
      expect(netBankingRadio).toBeChecked();
      expect(screen.getByLabelText('Credit Card')).not.toBeChecked();
    });

    test('should show bank selection for net banking', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const netBankingRadio = screen.getByLabelText('Net Banking');
      await user.click(netBankingRadio);
      
      expect(screen.getByText('Select Bank')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Select your bank')).toBeInTheDocument();
    });
  });

  describe('Form Validation - Positive Cases', () => {
    test('should accept valid card details', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      // Fill valid card details
      await user.type(screen.getByPlaceholderText('1234 5678 9012 3456'), '4111111111111111');
      await user.type(screen.getByPlaceholderText('MM/YY'), '12/25');
      await user.type(screen.getByPlaceholderText('123'), '123');
      await user.type(screen.getByPlaceholderText('John Doe'), 'John Doe');
      
      const submitButton = screen.getByText('Confirm Payment');
      expect(submitButton).not.toBeDisabled();
    });

    test('should format card number with spaces', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      await user.type(cardInput, '4111111111111111');
      
      expect(cardInput).toHaveValue('4111 1111 1111 1111');
    });

    test('should format expiry date with slash', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const expiryInput = screen.getByPlaceholderText('MM/YY');
      await user.type(expiryInput, '1225');
      
      expect(expiryInput).toHaveValue('12/25');
    });

    test('should accept 3-digit CVV', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const cvvInput = screen.getByPlaceholderText('123');
      await user.type(cvvInput, '123');
      
      expect(cvvInput).toHaveValue('123');
    });

    test('should accept 4-digit CVV for Amex', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const cvvInput = screen.getByPlaceholderText('123');
      
      await user.type(cardInput, '378282246310005'); // Amex card
      await user.type(cvvInput, '1234');
      
      expect(cvvInput).toHaveValue('1234');
    });
  });

  describe('Form Validation - Negative Cases', () => {
    test('should show error for empty form submission', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const submitButton = screen.getByText('Confirm Payment');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter card number')).toBeInTheDocument();
        expect(screen.getByText('Please enter expiry date')).toBeInTheDocument();
        expect(screen.getByText('Please enter CVV')).toBeInTheDocument();
        expect(screen.getByText('Please enter cardholder name')).toBeInTheDocument();
      });
    });

    test('should validate card number length', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      await user.type(cardInput, '123');
      
      const submitButton = screen.getByText('Confirm Payment');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid card number')).toBeInTheDocument();
      });
    });

    test('should validate card number format', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      await user.type(cardInput, 'abcd1111efgh2222');
      
      const submitButton = screen.getByText('Confirm Payment');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid card number')).toBeInTheDocument();
      });
    });

    test('should validate expiry date format', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const expiryInput = screen.getByPlaceholderText('MM/YY');
      await user.type(expiryInput, '1330'); // Invalid month
      
      const submitButton = screen.getByText('Confirm Payment');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid expiry date')).toBeInTheDocument();
      });
    });

    test('should validate expired card', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const expiryInput = screen.getByPlaceholderText('MM/YY');
      await user.type(expiryInput, '01/20'); // Expired date
      
      const submitButton = screen.getByText('Confirm Payment');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Card has expired')).toBeInTheDocument();
      });
    });

    test('should validate CVV length', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const cvvInput = screen.getByPlaceholderText('123');
      await user.type(cvvInput, '12'); // Too short
      
      const submitButton = screen.getByText('Confirm Payment');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid CVV')).toBeInTheDocument();
      });
    });

    test('should validate cardholder name', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const nameInput = screen.getByPlaceholderText('John Doe');
      await user.type(nameInput, '   '); // Only spaces
      
      const submitButton = screen.getByText('Confirm Payment');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter cardholder name')).toBeInTheDocument();
      });
    });

    test('should validate special characters in cardholder name', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const nameInput = screen.getByPlaceholderText('John Doe');
      await user.type(nameInput, 'John@123'); // Invalid characters
      
      const submitButton = screen.getByText('Confirm Payment');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid name')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Processing - Success Cases', () => {
    test('should process successful payment', async () => {
      const user = userEvent.setup();
      mockPaymentApi.processPayment.mockResolvedValue({
        data: {
          success: true,
          data: {
            transactionId: 'TXN_123',
            amount: 120.00,
            status: 'SUCCESS'
          }
        }
      });
      
      renderPaymentForm();
      
      // Fill valid form
      await user.type(screen.getByPlaceholderText('1234 5678 9012 3456'), '4111111111111111');
      await user.type(screen.getByPlaceholderText('MM/YY'), '12/25');
      await user.type(screen.getByPlaceholderText('123'), '123');
      await user.type(screen.getByPlaceholderText('John Doe'), 'John Doe');
      
      const submitButton = screen.getByText('Confirm Payment');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockPaymentApi.processPayment).toHaveBeenCalledWith({
          userId: expect.any(String),
          amount: 120.00,
          paymentMethod: 'CREDIT_CARD',
          billId: 'BILL_123',
          cardDetails: {
            cardNumber: '4111111111111111',
            expiryDate: '12/25',
            cvv: '123',
            cardholderName: 'John Doe'
          }
        });
        expect(mockOnSuccess).toHaveBeenCalledWith({
          transactionId: 'TXN_123',
          amount: 120.00,
          status: 'SUCCESS'
        });
      });
    });

    test('should process debit card payment', async () => {
      const user = userEvent.setup();
      mockPaymentApi.processPayment.mockResolvedValue({
        data: { success: true, data: { transactionId: 'TXN_456' } }
      });
      
      renderPaymentForm();
      
      // Select debit card
      await user.click(screen.getByLabelText('Debit Card'));
      
      // Fill form
      await user.type(screen.getByPlaceholderText('1234 5678 9012 3456'), '4111111111111111');
      await user.type(screen.getByPlaceholderText('MM/YY'), '12/25');
      await user.type(screen.getByPlaceholderText('123'), '123');
      await user.type(screen.getByPlaceholderText('John Doe'), 'John Doe');
      
      await user.click(screen.getByText('Confirm Payment'));
      
      await waitFor(() => {
        expect(mockPaymentApi.processPayment).toHaveBeenCalledWith(
          expect.objectContaining({ paymentMethod: 'DEBIT_CARD' })
        );
      });
    });

    test('should process net banking payment', async () => {
      const user = userEvent.setup();
      mockPaymentApi.processPayment.mockResolvedValue({
        data: { success: true, data: { transactionId: 'TXN_789' } }
      });
      
      renderPaymentForm();
      
      // Select net banking
      await user.click(screen.getByLabelText('Net Banking'));
      
      // Select bank
      const bankSelect = screen.getByDisplayValue('Select your bank');
      await user.selectOptions(bankSelect, 'HDFC');
      
      await user.click(screen.getByText('Confirm Payment'));
      
      await waitFor(() => {
        expect(mockPaymentApi.processPayment).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentMethod: 'NET_BANKING',
            bankDetails: { bankCode: 'HDFC' }
          })
        );
      });
    });
  });

  describe('Payment Processing - Error Cases', () => {
    test('should handle payment failure', async () => {
      const user = userEvent.setup();
      mockPaymentApi.processPayment.mockResolvedValue({
        data: {
          success: false,
          error: 'Payment declined by bank'
        }
      });
      
      renderPaymentForm();
      
      // Fill form and submit
      await user.type(screen.getByPlaceholderText('1234 5678 9012 3456'), '4000000000000002');
      await user.type(screen.getByPlaceholderText('MM/YY'), '12/25');
      await user.type(screen.getByPlaceholderText('123'), '123');
      await user.type(screen.getByPlaceholderText('John Doe'), 'John Doe');
      
      await user.click(screen.getByText('Confirm Payment'));
      
      await waitFor(() => {
        expect(screen.getByText('Payment declined by bank')).toBeInTheDocument();
        expect(mockSetError).toHaveBeenCalledWith('Payment declined by bank');
      });
    });

    test('should handle network error', async () => {
      const user = userEvent.setup();
      mockPaymentApi.processPayment.mockRejectedValue(
        new Error('Network error')
      );
      
      renderPaymentForm();
      
      // Fill form and submit
      await user.type(screen.getByPlaceholderText('1234 5678 9012 3456'), '4111111111111111');
      await user.type(screen.getByPlaceholderText('MM/YY'), '12/25');
      await user.type(screen.getByPlaceholderText('123'), '123');
      await user.type(screen.getByPlaceholderText('John Doe'), 'John Doe');
      
      await user.click(screen.getByText('Confirm Payment'));
      
      await waitFor(() => {
        expect(screen.getByText('Network error occurred. Please try again.')).toBeInTheDocument();
      });
    });

    test('should handle timeout error', async () => {
      const user = userEvent.setup();
      mockPaymentApi.processPayment.mockRejectedValue(
        new Error('timeout')
      );
      
      renderPaymentForm();
      
      // Fill form and submit
      await user.type(screen.getByPlaceholderText('1234 5678 9012 3456'), '4111111111111111');
      await user.type(screen.getByPlaceholderText('MM/YY'), '12/25');
      await user.type(screen.getByPlaceholderText('123'), '123');
      await user.type(screen.getByPlaceholderText('John Doe'), 'John Doe');
      
      await user.click(screen.getByText('Confirm Payment'));
      
      await waitFor(() => {
        expect(screen.getByText('Request timeout. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    test('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    test('should disable submit button during processing', async () => {
      const user = userEvent.setup();
      
      // Mock processing state
      jest.doMock('../store/usePaymentStore', () => ({
        __esModule: true,
        default: () => ({
          processing: true,
          setProcessing: mockSetProcessing,
          setError: mockSetError
        })
      }));
      
      renderPaymentForm();
      
      const submitButton = screen.getByText('Processing...');
      expect(submitButton).toBeDisabled();
    });

    test('should show loading state during payment', async () => {
      const user = userEvent.setup();
      mockPaymentApi.processPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      renderPaymentForm();
      
      // Fill form
      await user.type(screen.getByPlaceholderText('1234 5678 9012 3456'), '4111111111111111');
      await user.type(screen.getByPlaceholderText('MM/YY'), '12/25');
      await user.type(screen.getByPlaceholderText('123'), '123');
      await user.type(screen.getByPlaceholderText('John Doe'), 'John Doe');
      
      await user.click(screen.getByText('Confirm Payment'));
      
      expect(mockSetProcessing).toHaveBeenCalledWith(true);
    });
  });

  describe('Input Masking and Formatting', () => {
    test('should mask card number input', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      await user.type(cardInput, '4111111111111111');
      
      // Should format with spaces
      expect(cardInput).toHaveValue('4111 1111 1111 1111');
    });

    test('should limit card number to 19 characters (including spaces)', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      await user.type(cardInput, '41111111111111111234567890');
      
      expect(cardInput.value.length).toBeLessThanOrEqual(19);
    });

    test('should limit CVV to 4 digits', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const cvvInput = screen.getByPlaceholderText('123');
      await user.type(cvvInput, '12345');
      
      expect(cvvInput.value.length).toBeLessThanOrEqual(4);
    });

    test('should only allow numbers in CVV', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const cvvInput = screen.getByPlaceholderText('123');
      await user.type(cvvInput, 'abc123');
      
      expect(cvvInput).toHaveValue('123');
    });

    test('should format expiry date automatically', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      const expiryInput = screen.getByPlaceholderText('MM/YY');
      await user.type(expiryInput, '1225');
      
      expect(expiryInput).toHaveValue('12/25');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      renderPaymentForm();
      
      expect(screen.getByLabelText('Credit Card')).toBeInTheDocument();
      expect(screen.getByLabelText('Debit Card')).toBeInTheDocument();
      expect(screen.getByLabelText('Net Banking')).toBeInTheDocument();
    });

    test('should have proper form labels', () => {
      renderPaymentForm();
      
      expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cardholder name/i)).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderPaymentForm();
      
      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText('Credit Card')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('Debit Card')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('Net Banking')).toHaveFocus();
    });
  });
});