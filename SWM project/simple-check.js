console.log('Checking MongoDB for maintenance tickets...');

// Use MongoDB connection directly
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/smart_waste_management';

async function checkTickets() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('smart_waste_management');
    const collection = db.collection('maintenancetickets');
    
    const tickets = await collection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    
    console.log(`\n📋 Found ${tickets.length} maintenance tickets:`);
    console.log('=====================================');
    
    tickets.forEach((ticket, index) => {
      console.log(`\n${index + 1}. Ticket ID: ${ticket.ticketId}`);
      console.log(`   Bin ID: ${ticket.binId}`);
      console.log(`   Reason: ${ticket.reason}`);
      console.log(`   Priority: ${ticket.priority}`);
      console.log(`   Status: ${ticket.status}`);
      console.log(`   Created: ${ticket.createdAt}`);
      console.log(`   Notes: ${ticket.notes?.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkTickets();