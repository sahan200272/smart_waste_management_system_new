/**
 * Bill Card Component
 * Displays outstanding bill information with pay button
 * Integrates with existing PaymentForm component
 */

import React from 'react';

const BillCard = ({ bills = [], resident, onPay }) => {
  const totalAmount = bills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
  const hasOutstanding = totalAmount > 0;
  
  // Get the nearest due date
  const nearestDueDate = bills.length > 0 
    ? new Date(Math.min(...bills.map(bill => new Date(bill.dueDate))))
    : null;
  
  const isOverdue = nearestDueDate && new Date() > nearestDueDate;

  if (!hasOutstanding) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-green-800">
              All Bills Paid
            </h3>
            <p className="text-green-600">
              You have no outstanding payments at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-md p-6 mb-6 ${isOverdue ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <svg className={`w-6 h-6 mr-2 ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 className={`text-lg font-semibold ${isOverdue ? 'text-red-800' : 'text-yellow-800'}`}>
              {isOverdue ? 'Overdue Payment' : 'Outstanding Bill'}
            </h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Amount:</span>
              <span className={`text-2xl font-bold ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                Rs. {totalAmount.toFixed(2)}
              </span>
            </div>
            
            {nearestDueDate && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Due Date:</span>
                <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                  {nearestDueDate.toLocaleDateString()}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Number of Bills:</span>
              <span className="font-medium text-gray-800">{bills.length}</span>
            </div>
          </div>
          
          {isOverdue && (
            <div className="mt-3 p-3 bg-red-100 rounded-md">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ This payment is overdue. Please pay immediately to avoid service interruption.
              </p>
            </div>
          )}
        </div>
        
        <div className="ml-6">
          <button
            onClick={() => onPay(totalAmount)}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-200 ${
              isOverdue
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            Pay Now
          </button>
        </div>
      </div>
      
      {bills.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Bill Breakdown:</h4>
          <div className="space-y-1">
            {bills.map((bill, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {bill.billId || `Bill #${index + 1}`}
                </span>
                <span className="text-gray-800 font-medium">
                  Rs. {(bill.amount || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillCard;