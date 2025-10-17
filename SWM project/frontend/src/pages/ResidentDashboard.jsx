import { useState, useEffect } from 'react';
import { residentApi } from '../api/residentApi';
import ResidentCard from '../components/ResidentCard';
import BillCard from '../components/BillCard';
import PaymentForm from '../components/PaymentForm';
import PaymentReceipt from '../components/PaymentReceipt';
import PaymentHistory from '../components/PaymentHistory';
import usePaymentStore from '../store/usePaymentStore';

/**
 * Resident Dashboard
 * Main dashboard for residents to view account info and make payments
 * Integrates with existing payment components
 */
const ResidentDashboard = () => {
  const [resident, setResident] = useState(null);
  const [outstandingBills, setOutstandingBills] = useState([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastPayment, setLastPayment] = useState(null);

  const { setProcessing } = usePaymentStore();

  useEffect(() => {
    loadResidentData();
  }, []);

  const loadResidentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await residentApi.getDemoResident();
      
      if (response.success) {
        setResident(response.data.resident);
        setOutstandingBills(response.data.outstandingBills || []);
      } else {
        setError('Failed to load resident data');
      }
    } catch (err) {
      console.error('Error loading resident data:', err);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (amount) => {
    // Create a payment object for the total amount
    const paymentData = {
      amount: amount,
      billId: 'OUTSTANDING_BILLS',
      description: `Payment for outstanding bills`
    };
    setSelectedBill(paymentData);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (payment) => {
    // Unwrap if PaymentForm returns { payment, receiptUrl }
    const normalized = payment?.payment || payment;
    setLastPayment(normalized);
    setShowPaymentForm(false);
    setShowReceipt(true);
    
    // Refresh resident data to show updated outstanding amount
    loadResidentData();
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setSelectedBill(null);
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setLastPayment(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadResidentData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Resident Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your waste management account and payments</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Resident Information Card */}
        <ResidentCard resident={resident} />

        {/* Outstanding Bills Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Outstanding Bills</h2>
          </div>
          <BillCard 
            bills={outstandingBills} 
            resident={resident}
            onPay={handlePayNow}
          />
        </div>

        {/* Payment History Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment History</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <PaymentHistory 
              userId={resident?.userId || 'demo-resident-001'}
              onViewReceipt={(payment) => {
                setLastPayment({
                  ...payment,
                  status: 'SUCCESS'
                });
                setShowReceipt(true);
              }}
              onRetryPayment={(failedPayment) => {
                setSelectedBill({
                  amount: failedPayment.amount,
                  billId: failedPayment.billId || 'RETRY_BILL',
                  description: `Retry payment for ${failedPayment.transactionId}`
                });
                setShowPaymentForm(true);
              }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={loadResidentData}
              className="flex items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh Data
            </button>
            
            <button className="flex items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Download Statement
            </button>
            
            <button className="flex items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Support
            </button>
          </div>
        </div>
      </div>

      {/* Payment Form Modal - Using your existing PaymentForm component */}
      {showPaymentForm && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <PaymentForm
              bill={selectedBill}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      )}

      {/* Payment Receipt Modal - Using your existing PaymentReceipt component */}
      {showReceipt && lastPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <PaymentReceipt
              payment={lastPayment}
              onClose={handleReceiptClose}
              onDownloadReceipt={() => {
                console.log('Downloading receipt for:', lastPayment.transactionId);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;