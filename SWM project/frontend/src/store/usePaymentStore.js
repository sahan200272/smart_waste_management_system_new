import { create } from 'zustand';

/**
 * Payment Store - Manages payment state using Zustand
 * Follows Single Responsibility Principle (SRP)
 */
const usePaymentStore = create((set, get) => ({
  // State
  outstandingBills: [],
  paymentHistory: [],
  currentPayment: null,
  paymentStats: null,
  loading: false,
  error: null,
  processing: false,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setProcessing: (processing) => set({ processing }),

  // Set outstanding bills
  setOutstandingBills: (bills) => set({ outstandingBills: bills }),

  // Set payment history
  setPaymentHistory: (history) => set({ paymentHistory: history }),

  // Set current payment
  setCurrentPayment: (payment) => set({ currentPayment: payment }),

  // Set payment stats
  setPaymentStats: (stats) => set({ paymentStats: stats }),

  // Clear current payment
  clearCurrentPayment: () => set({ currentPayment: null }),

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({
    outstandingBills: [],
    paymentHistory: [],
    currentPayment: null,
    paymentStats: null,
    loading: false,
    error: null,
    processing: false
  }),

  // Get total outstanding amount
  getTotalOutstanding: () => {
    const { outstandingBills } = get();
    return outstandingBills.reduce((total, bill) => total + bill.amount, 0);
  },

  // Get successful payments count
  getSuccessfulPaymentsCount: () => {
    const { paymentHistory } = get();
    return paymentHistory.filter(payment => payment.status === 'SUCCESS').length;
  },

  // Get failed payments count
  getFailedPaymentsCount: () => {
    const { paymentHistory } = get();
    return paymentHistory.filter(payment => payment.status === 'FAILED').length;
  },

  // Get recent payments (last 5)
  getRecentPayments: () => {
    const { paymentHistory } = get();
    return paymentHistory.slice(0, 5);
  }
}));

export default usePaymentStore;
