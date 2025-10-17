import { useState, useEffect } from 'react';
import paymentApi from '../api/paymentApi';
import usePaymentStore from '../store/usePaymentStore';

/**
 * PaymentHistory Component
 * Displays payment history with filtering and pagination
 * Follows Single Responsibility Principle (SRP)
 */
const PaymentHistory = ({ userId, onViewReceipt, onRetryPayment }) => {
  const { 
    paymentHistory, 
    setPaymentHistory, 
    loading, 
    setLoading, 
    error, 
    setError 
  } = usePaymentStore();

  const [filter, setFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    loadPaymentHistory();
  }, [userId, currentPage]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use mock data for demonstration
      console.log('Loading mock payment history');
      
      // Create some mock payment history
      const mockHistory = [
        {
          _id: 'payment-1',
          transactionId: 'TXN_001',
          amount: 95.00,
          status: 'SUCCESS',
          paymentMethod: 'CREDIT_CARD',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        },
        {
          _id: 'payment-2',
          transactionId: 'TXN_002',
          amount: 100.00,
          status: 'FAILED',
          paymentMethod: 'DEBIT_CARD',
          failureReason: 'Insufficient funds',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
        }
      ];
      
      setPaymentHistory(mockHistory);
    } catch (error) {
      console.error('Error loading payment history:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'SUCCESS': { color: 'bg-green-100 text-green-800', label: 'Paid' },
      'FAILED': { color: 'bg-red-100 text-red-800', label: 'Failed' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' }
    };

    const config = statusConfig[status] || statusConfig['PENDING'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'CREDIT_CARD': '💳',
      'DEBIT_CARD': '💳',
      'NET_BANKING': '🏦'
    };
    return icons[method] || '💳';
  };

  const filteredPayments = paymentHistory.filter(payment => {
    if (filter === 'ALL') return true;
    return payment.status === filter;
  });

  const totalPages = Math.ceil(paymentHistory.length / itemsPerPage);

  const handleViewReceipt = (payment) => {
    if (payment.status !== 'SUCCESS') return;
    if (typeof onViewReceipt === 'function') {
      onViewReceipt(payment);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>Failed to load payment history</p>
          <button 
            onClick={loadPaymentHistory}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
          
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Payments</option>
            <option value="SUCCESS">Successful</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Payment List */}
      <div className="divide-y divide-gray-200">
        {filteredPayments.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <p>No payment history found</p>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div key={payment._id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {getPaymentMethodIcon(payment.paymentMethod)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {formatAmount(payment.amount)}
                      </span>
                      {getStatusBadge(payment.status)}
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </div>
                    
                    <div className="text-xs text-gray-400 font-mono">
                      {payment.transactionId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {payment.status === 'SUCCESS' && (
                    <button
                      onClick={() => handleViewReceipt(payment)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Receipt
                    </button>
                  )}
                  
                  {payment.status === 'FAILED' && (
                    <button
                      onClick={() => typeof onRetryPayment === 'function' && onRetryPayment(payment)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Retry Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
