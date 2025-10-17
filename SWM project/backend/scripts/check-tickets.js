// Script to check maintenance tickets in database
import mongoose from 'mongoose';
import MaintenanceTicket from '../src/model/MaintenanceTicket.js';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_waste_management';

async function checkTickets() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const tickets = await MaintenanceTicket.find().sort({ createdAt: -1 }).limit(5);
    
    console.log(`\n📋 Recent Maintenance Tickets (${tickets.length}):`);
    console.log('=====================================');
    
    tickets.forEach((ticket, index) => {
      console.log(`\n${index + 1}. Ticket ID: ${ticket.ticketId}`);
      console.log(`   Bin ID: ${ticket.binId}`);
      console.log(`   Reason: ${ticket.reason}`);
      console.log(`   Priority: ${ticket.priority}`);
      console.log(`   Status: ${ticket.status}`);
      console.log(`   Created: ${ticket.createdAt}`);
      console.log(`   Notes: ${ticket.notes.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkTickets();