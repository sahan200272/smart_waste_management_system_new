import { useState } from 'react';
import paymentApi from '../api/paymentApi';
import usePaymentStore from '../store/usePaymentStore';

/**
 * PaymentForm Component
 * Handles payment form input and submission
 * Follows Single Responsibility Principle (SRP)
 */
const PaymentForm = ({ bill, onSuccess, onCancel }) => {
  const { processing, setProcessing, setError } = usePaymentStore();
  
  const [formData, setFormData] = useState({
    paymentMethod: 'CREDIT_CARD',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    saveCard: false
  });

  const [errors, setErrors] = useState({});

  // Tunable simulated processing delay (in milliseconds)
  const PROCESSING_DELAY_MS = 2000;

  // Payment method options
  const paymentMethods = [
    { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
    { value: 'DEBIT_CARD', label: 'Debit Card', icon: '💳' },
    { value: 'NET_BANKING', label: 'Net Banking', icon: '🏦' }
  ];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    if (formData.paymentMethod !== 'NET_BANKING') {
      if (!formData.cardNumber || formData.cardNumber.length < 13) {
        newErrors.cardNumber = 'Please enter a valid card number';
      }

      if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'Please enter expiry date in MM/YY format';
      }

      if (!formData.cvv || formData.cvv.length < 3) {
        newErrors.cvv = 'Please enter a valid CVV';
      }

      if (!formData.cardholderName.trim()) {
        newErrors.cardholderName = 'Please enter cardholder name';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const paymentData = {
        userId: 'residents', // Mock user ID
        amount: bill.amount,
        paymentMethod: formData.paymentMethod,
        cardDetails: formData.paymentMethod !== 'NET_BANKING' ? {
          cardNumber: formData.cardNumber,
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
          cardholderName: formData.cardholderName
        } : null
      };

      // Simulate payment processing (no backend required)
      console.log('Processing payment with mock gateway');
      
      // Simulate payment processing delay (reduced for better UX)
      await new Promise(resolve => setTimeout(resolve, PROCESSING_DELAY_MS));
      
      // For demo: always succeed after delay
      const isSuccess = true;
      
      if (isSuccess) {
        const mockPayment = {
          _id: 'mock-payment-' + Date.now(),
          transactionId: 'TXN_MOCK_' + Date.now(),
          amount: bill.amount,
          status: 'SUCCESS',
          paymentMethod: formData.paymentMethod,
          paidAt: new Date(),
          createdAt: new Date()
        };
        
        console.log('Payment successful:', mockPayment);
        onSuccess({ payment: mockPayment, receiptUrl: '/receipt/' + mockPayment.transactionId });
      } else {
        const failureReasons = ['Insufficient funds', 'Card declined', 'Invalid card details'];
        const reason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
        console.log('Payment failed:', reason);
        setError(reason);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Handle card number input
  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      cardNumber: formatted
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Details</h2>
        <p className="text-gray-600">Complete your payment for ${bill.amount}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Payment Method
          </label>
          <div className="space-y-2">
            {paymentMethods.map(method => (
              <label key={method.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={formData.paymentMethod === method.value}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <span className="mr-2">{method.icon}</span>
                <span className="font-medium">{method.label}</span>
              </label>
            ))}
          </div>
          {errors.paymentMethod && (
            <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
          )}
        </div>

        {/* Card Details (only for card payments) */}
        {formData.paymentMethod !== 'NET_BANKING' && (
          <div className="space-y-4">
            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
              )}
            </div>

            {/* Expiry Date and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  maxLength="5"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  maxLength="4"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cvv ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cvv && (
                  <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cardholderName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cardholderName && (
                <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>
              )}
            </div>

            {/* Save Card Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="saveCard"
                checked={formData.saveCard}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">Save card for future payments</label>
            </div>
          </div>
        )}

        {/* Net Banking Message */}
        {formData.paymentMethod === 'NET_BANKING' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              You will be redirected to your bank's secure payment page to complete the transaction.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Confirm Payment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
