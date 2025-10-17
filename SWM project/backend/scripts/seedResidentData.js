/**
 * Seed Script for Demo Resident Data
 * Creates demo resident and bills for testing
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Resident from '../src/model/Resident.js';
import Payment from '../src/model/Payment.js';

dotenv.config();

const seedResidentData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_waste_db');
    console.log('Connected to MongoDB');

    // Clear existing demo data
    await Resident.deleteMany({ userId: 'demo-resident-001' });
    await Payment.deleteMany({ userId: 'demo-resident-001' });
    console.log('Cleared existing demo data');

    // Create demo resident
    const demoResident = new Resident({
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
      serviceType: 'premium',
      registrationDate: new Date('2023-01-15')
    });

    await demoResident.save();
    console.log('Created demo resident:', demoResident.name);

    // Create some sample bills (represented as unpaid payments)
    const sampleBills = [
      {
        userId: 'demo-resident-001',
        amount: 1500.00,
        status: 'pending',
        description: 'Monthly waste collection - January 2024',
        dueDate: new Date('2024-01-31'),
        billId: 'BILL-2024-001',
        serviceDetails: {
          period: 'January 2024',
          serviceType: 'premium',
          collectionDays: 12
        }
      },
      {
        userId: 'demo-resident-001',
        amount: 1000.00,
        status: 'pending',
        description: 'Monthly waste collection - February 2024',
        dueDate: new Date('2024-02-29'),
        billId: 'BILL-2024-002',
        serviceDetails: {
          period: 'February 2024',
          serviceType: 'premium',
          collectionDays: 8
        }
      }
    ];

    for (const bill of sampleBills) {
      const payment = new Payment(bill);
      await payment.save();
      console.log(`Created demo bill: ${bill.billId}`);
    }

    // Create some payment history (completed payments)
    const paymentHistory = [
      {
        userId: 'demo-resident-001',
        amount: 1200.00,
        status: 'completed',
        description: 'Monthly waste collection - December 2023',
        createdAt: new Date('2023-12-05'),
        completedAt: new Date('2023-12-05'),
        paymentMethod: 'credit_card',
        billId: 'BILL-2023-012',
        serviceDetails: {
          period: 'December 2023',
          serviceType: 'premium',
          collectionDays: 10
        }
      },
      {
        userId: 'demo-resident-001',
        amount: 1200.00,
        status: 'completed',
        description: 'Monthly waste collection - November 2023',
        createdAt: new Date('2023-11-05'),
        completedAt: new Date('2023-11-05'),
        paymentMethod: 'debit_card',
        billId: 'BILL-2023-011',
        serviceDetails: {
          period: 'November 2023',
          serviceType: 'premium',
          collectionDays: 12
        }
      },
      {
        userId: 'demo-resident-001',
        amount: 1100.00,
        status: 'completed',
        description: 'Monthly waste collection - October 2023',
        createdAt: new Date('2023-10-08'),
        completedAt: new Date('2023-10-08'),
        paymentMethod: 'credit_card',
        billId: 'BILL-2023-010',
        serviceDetails: {
          period: 'October 2023',
          serviceType: 'premium',
          collectionDays: 11
        }
      }
    ];

    for (const payment of paymentHistory) {
      const paymentRecord = new Payment(payment);
      await paymentRecord.save();
      console.log(`Created payment history: ${payment.billId}`);
    }

    console.log('\\n✅ Demo data seeded successfully!');
    console.log('Demo Resident Details:');
    console.log(`- Name: ${demoResident.name}`);
    console.log(`- User ID: ${demoResident.userId}`);
    console.log(`- Outstanding Amount: Rs. ${demoResident.outstandingAmount.toFixed(2)}`);
    console.log(`- Outstanding Bills: ${sampleBills.length}`);
    console.log(`- Payment History: ${paymentHistory.length} completed payments`);
    console.log('\\nAccess the dashboard at: http://localhost:5173/resident-dashboard');

  } catch (error) {
    console.error('Error seeding demo data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedResidentData();
}

export default seedResidentData;