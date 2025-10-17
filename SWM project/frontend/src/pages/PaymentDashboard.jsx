import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import paymentApi from '../api/paymentApi';
import usePaymentStore from '../store/usePaymentStore';
import PaymentForm from '../components/PaymentForm';
import PaymentReceipt from '../components/PaymentReceipt';
import PaymentHistory from '../components/PaymentHistory';

/**
 * PaymentDashboard Component
 * Main payment interface with outstanding bills and payment history
 * Follows Single Responsibility Principle (SRP)
 */
const PaymentDashboard = () => {
  const {
    outstandingBills,
    paymentHistory,
    paymentStats,
    loading,
    error,
    processing,
    setOutstandingBills,
    setPaymentHistory,
    setPaymentStats,
    setLoading,
    setError,
    setProcessing,
    getTotalOutstanding,
    getSuccessfulPaymentsCount,
    getFailedPaymentsCount
  } = usePaymentStore();

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [currentPayment, setCurrentPayment] = useState(null);

  const userId = 'residents'; // Mock user ID

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading payment data for user:', userId);
      
      // Use mock data directly for demonstration
      console.log('Using mock data for demonstration');
      
      // Create mock data for demonstration
      const mockBills = [{
        _id: 'mock-bill-1',
        userId: userId,
        amount: 120.00,
        status: 'PENDING',
        billId: 'BILL_MOCK_001',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      }];

      const mockHistory = [
        {
          _id: 'payment-1',
          transactionId: 'TXN_001',
          amount: 95.00,
          status: 'SUCCESS',
          paymentMethod: 'CREDIT_CARD',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: 'payment-2',
          transactionId: 'TXN_002',
          amount: 100.00,
          status: 'FAILED',
          paymentMethod: 'DEBIT_CARD',
          failureReason: 'Insufficient funds',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      const mockStats = {
        totalOutstanding: 120.00,
        totalPaid: 195.00,
        totalTransactions: 2,
        successfulTransactions: 1,
        failedTransactions: 1
      };

      setOutstandingBills(mockBills);
      setPaymentHistory(mockHistory);
      setPaymentStats(mockStats);
      
      console.log('Mock data loaded successfully');
    } catch (error) {
      console.error('Error loading payment data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = (bill) => {
    setSelectedBill(bill);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    setCurrentPayment(paymentData.payment);
    setShowPaymentForm(false);
    setShowReceipt(true);
    
    // Refresh data
    loadPaymentData();
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setSelectedBill(null);
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setCurrentPayment(null);
  };

  const handleDownloadReceipt = (payment) => {
    try {
      console.log('Downloading receipt for:', payment.transactionId);
      
      // Create a professional receipt content
      const receiptContent = `
╔══════════════════════════════════════════════════════════════╗
║                    PAYMENT RECEIPT                          ║
║              Smart Waste Management System                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Transaction ID: ${payment.transactionId.padEnd(35)} ║
║  Amount: $${payment.amount.toFixed(2).padEnd(40)} ║
║  Payment Method: ${payment.paymentMethod.replace('_', ' ').padEnd(33)} ║
║  Date: ${new Date(payment.paidAt || payment.createdAt).toLocaleString().padEnd(42)} ║
║  Status: ${payment.status.padEnd(40)} ║
║                                                              ║
║  Thank you for your payment!                                ║
║                                                              ║
║  This is a computer-generated receipt.                      ║
║  No signature required.                                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `.trim();
      
      // Create and download the receipt file
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${payment.transactionId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Center</h1>
              <p className="text-gray-600 mt-1">Manage your waste management payments</p>
            </div>
            <Link
              to="/residents"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-semibold text-gray-900">${getTotalOutstanding().toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-semibold text-gray-900">{getSuccessfulPaymentsCount()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-semibold text-gray-900">{getFailedPaymentsCount()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${paymentStats?.totalPaid?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Outstanding Bills */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Outstanding Bills</h2>
            
            {outstandingBills.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-green-600 text-4xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">You have no outstanding bills at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {outstandingBills.map((bill) => (
                  <div key={bill._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Waste Management Bill</h3>
                        <p className="text-sm text-gray-600">Bill ID: {bill.billId}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                        {bill.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-3xl font-bold text-gray-900">${bill.amount}</p>
                        <p className="text-sm text-gray-600">Due: {formatDate(bill.dueDate)}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleMakePayment(bill)}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Pay Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment History */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Payments</h2>
            <PaymentHistory userId={userId} />
          </div>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <PaymentForm
            bill={selectedBill}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </div>
      )}

      {/* Payment Receipt Modal */}
      {showReceipt && currentPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <PaymentReceipt
            payment={currentPayment}
            onClose={handleReceiptClose}
            onDownloadReceipt={() => handleDownloadReceipt(currentPayment)}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentDashboard;
