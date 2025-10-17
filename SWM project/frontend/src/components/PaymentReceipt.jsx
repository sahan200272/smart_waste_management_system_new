import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';

/**
 * PaymentReceipt Component
 * Displays payment success/failure receipt
 * Follows Single Responsibility Principle (SRP)
 */
const PaymentReceipt = ({ payment, onClose, onDownloadReceipt }) => {
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment && payment.status === 'SUCCESS') {
      loadReceiptData();
    }
  }, [payment]);

  const loadReceiptData = async () => {
    try {
      setLoading(true);
      
      // Create mock receipt data instead of calling API
      const mockReceiptData = {
        transactionId: payment.transactionId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt || payment.createdAt,
        receiptUrl: `/receipt/${payment.transactionId}`,
        billId: payment.billId || 'BILL_MOCK_001'
      };
      
      setReceiptData(mockReceiptData);
    } catch (error) {
      console.error('Error loading receipt:', error);
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

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'FAILED':
        return (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
        );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'SUCCESS':
        return 'Payment Successful';
      case 'FAILED':
        return 'Payment Failed';
      default:
        return 'Processing Payment...';
    }
  };

  const downloadPdf = () => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 48;
      let y = 64;

      // Header band
      doc.setFillColor(34, 197, 94); // emerald-500
      doc.rect(0, 0, pageWidth, 84, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Smart Waste Management System', margin, 36);
      doc.setFontSize(24);
      doc.text('Payment Receipt', margin, 64);

      // Reset to dark text
      doc.setTextColor(33, 37, 41);
      y = 120;

      // Receipt meta
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const paidDate = new Date(payment.paidAt || payment.createdAt);
      doc.text(`Receipt # ${payment.transactionId}`, margin, y);
      doc.text(`Date: ${paidDate.toLocaleDateString()} ${paidDate.toLocaleTimeString()}`, pageWidth - margin - 260, y);
      y += 16;
      doc.setDrawColor(229, 231, 235); // gray-200
      doc.line(margin, y, pageWidth - margin, y);
      y += 24;

      // Details card
      const cardX = margin;
      const cardW = pageWidth - margin * 2;
      const cardH = 220;
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(cardX, y, cardW, cardH, 8, 8, 'F');

      const row = (label, value) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(label.toUpperCase(), cardX + 20, y + 28);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39); // slate-900
        doc.text(value, cardX + 200, y + 28);
        y += 28;
      };

      y += 12;
      row('Payer', 'Resident');
      row('Transaction ID', payment.transactionId);
      row('Payment Method', payment.paymentMethod.replace('_', ' '));
      row('Bill ID', receiptData?.billId || 'N/A');

      // Amount emphasis
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52); // green-800
      doc.setFontSize(18);
      doc.text(`Amount Paid: $${Number(payment.amount).toFixed(2)}`, cardX + 20, y + 24);
      y += 24;

      // Footer note
      y = cardX + cardH + 96;
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(12);
      doc.text('Thank you for your payment! Keep this receipt for your records.', margin, y);

      // Save file
      doc.save(`receipt-${payment.transactionId}.pdf`);
    } catch (e) {
      console.error('Failed to generate PDF receipt', e);
      alert('Failed to download receipt.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Status Icon */}
      {getStatusIcon(payment.status)}

      {/* Status Message */}
      <div className="text-center mb-6">
        <h2 className={`text-2xl font-bold ${getStatusColor(payment.status)} mb-2`}>
          {getStatusMessage(payment.status)}
        </h2>
        
        {payment.status === 'FAILED' && payment.failureReason && (
          <p className="text-red-600 text-sm">
            {payment.failureReason}
          </p>
        )}
      </div>

      {/* Payment Details */}
      {payment.status === 'SUCCESS' && (
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Amount</span>
              <span className="text-2xl font-bold text-gray-900">${payment.amount}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Date</span>
              <span>{formatDate(payment.paidAt || payment.createdAt)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Time</span>
              <span>{formatTime(payment.paidAt || payment.createdAt)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Transaction ID</span>
              <span className="font-mono text-xs">{payment.transactionId}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Payment Method</span>
              <span>{payment.paymentMethod.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Data */}
      {receiptData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Receipt Details</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <div>Bill ID: {receiptData.billId}</div>
            <div>Receipt URL: {receiptData.receiptUrl}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {payment.status === 'SUCCESS' && (
          <button
            onClick={downloadPdf}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Download Receipt
          </button>
        )}
        
        {payment.status === 'FAILED' && (
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        )}
        
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {payment.status === 'SUCCESS' ? 'Done' : 'Close'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading receipt...</p>
        </div>
      )}
    </div>
  );
};

export default PaymentReceipt;
