/**
 * ResidentDashboard Component Tests
 * Tests for the resident dashboard with existing payment integration
 */

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResidentDashboard from '../pages/ResidentDashboard';

// Mock the resident API
const mockGetDemoResidentDetails = jest.fn();
jest.mock('../api/residentApi', () => ({
  residentApi: {
    getDemoResidentDetails: mockGetDemoResidentDetails,
  },
}));

// Mock the payment store
jest.mock('../store/usePaymentStore', () => ({
  __esModule: true,
  default: () => ({
    setProcessing: jest.fn(),
  }),
}));

// Mock the payment components
jest.mock('../components/PaymentForm', () => {
  return function MockPaymentForm() {
    return <div data-testid="payment-form">Payment Form</div>;
  };
});

jest.mock('../components/PaymentHistory', () => {
  return function MockPaymentHistory() {
    return <div data-testid="payment-history">Payment History</div>;
  };
});

jest.mock('../components/PaymentReceipt', () => {
  return function MockPaymentReceipt() {
    return <div data-testid="payment-receipt">Payment Receipt</div>;
  };
});

jest.mock('../components/ResidentCard', () => {
  return function MockResidentCard({ resident }) {
    return (
      <div data-testid="resident-card">
        <div>{resident?.name}</div>
        <div>{resident?.email}</div>
      </div>
    );
  };
});

jest.mock('../components/BillCard', () => {
  return function MockBillCard({ bills, onPay }) {
    const totalAmount = bills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
    const hasOutstanding = totalAmount > 0;
    
    if (!hasOutstanding) {
      return <div data-testid="bill-card">All Bills Paid</div>;
    }
    
    return (
      <div data-testid="bill-card">
        <div>Outstanding: Rs. {totalAmount}</div>
        <button onClick={() => onPay(totalAmount)}>Pay Now</button>
      </div>
    );
  };
});

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ResidentDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    // Mock API to never resolve to test loading state
    mockGetDemoResidentDetails.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<ResidentDashboard />);
    
    expect(screen.getByText(/loading your dashboard/i)).toBeInTheDocument();
  });

  test('renders resident dashboard with demo data', async () => {
    const mockResidentData = {
      success: true,
      data: {
        resident: {
          userId: 'demo-resident-001',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+94771234567',
          address: {
            street: '123 Green Valley Road',
            city: 'Colombo',
            postalCode: '10250',
            district: 'Colombo'
          },
          outstandingAmount: 2500.00,
          accountStatus: 'active',
          serviceType: 'premium'
        },
        outstandingBills: [
          {
            billId: 'BILL-2024-001',
            amount: 1500.00,
            dueDate: new Date('2024-01-31'),
            description: 'Monthly waste collection - January 2024'
          },
          {
            billId: 'BILL-2024-002',
            amount: 1000.00,
            dueDate: new Date('2024-02-29'),
            description: 'Monthly waste collection - February 2024'
          }
        ]
      }
    };

    residentApi.getDemoResidentDetails.mockResolvedValue(mockResidentData);
    
    renderWithRouter(<ResidentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Resident Dashboard')).toBeInTheDocument();
    });

    // Check if resident card is rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    
    // Check if outstanding bills section is rendered
    expect(screen.getByText('Outstanding Bills')).toBeInTheDocument();
    
    // Check if payment history section is rendered
    expect(screen.getByText('Payment History')).toBeInTheDocument();
  });

  test('renders error state when API fails', async () => {
    mockGetDemoResidentDetails.mockRejectedValue(new Error('API Error'));
    
    renderWithRouter(<ResidentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/unable to load dashboard/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('displays no outstanding bills message when all bills are paid', async () => {
    const mockResidentData = {
      success: true,
      data: {
        resident: {
          userId: 'demo-resident-001',
          name: 'John Doe',
          email: 'john.doe@example.com',
          outstandingAmount: 0,
          accountStatus: 'active'
        },
        outstandingBills: []
      }
    };

    residentApi.getDemoResidentDetails.mockResolvedValue(mockResidentData);
    
    renderWithRouter(<ResidentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('All Bills Paid')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/no outstanding payments at this time/i)).toBeInTheDocument();
  });

  test('integrates with existing payment components', async () => {
    const mockResidentData = {
      success: true,
      data: {
        resident: {
          userId: 'demo-resident-001',
          name: 'John Doe',
          outstandingAmount: 1500.00,
        },
        outstandingBills: [
          {
            billId: 'BILL-2024-001',
            amount: 1500.00,
            dueDate: new Date('2024-01-31')
          }
        ]
      }
    };

    mockGetDemoResidentDetails.mockResolvedValue(mockResidentData);
    
    renderWithRouter(<ResidentDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify that payment history component is rendered (integration test)
    expect(screen.getByTestId('payment-history')).toBeInTheDocument();
  });
});