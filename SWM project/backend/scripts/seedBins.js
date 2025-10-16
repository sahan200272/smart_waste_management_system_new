import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000';

// Sample bins to seed
const SAMPLE_BINS = [
  {
    binId: 'BIN-001',
    category: 'biodegradable',
    level: 25,
    mixed: false
  },
  {
    binId: 'BIN-002', 
    category: 'recyclable',
    level: 40,
    mixed: false
  },
  {
    binId: 'BIN-003',
    category: 'non_biodegradable', 
    level: 15,
    mixed: false
  },
  {
    binId: 'BIN-004',
    category: 'biodegradable',
    level: 60,
    mixed: true // This bin has mixed waste
  },
  {
    binId: 'BIN-005',
    category: 'recyclable',
    level: 85,
    mixed: false // This bin is nearly full
  },
  {
    binId: 'BIN-006',
    category: 'non_biodegradable',
    level: 90,
    mixed: false // This bin is nearly full
  }
];

async function seedBin(binData) {
  try {
    console.log(`📦 Seeding bin ${binData.binId}...`);
    
    const response = await fetch(`${API_BASE_URL}/api/bins/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...binData,
        deviceTs: new Date().toISOString()
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Successfully seeded ${binData.binId}: ${binData.level}% full, category: ${binData.category}, mixed: ${binData.mixed}`);
      return result;
    } else {
      const error = await response.text();
      console.error(`❌ Error seeding ${binData.binId}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Network error seeding ${binData.binId}:`, error.message);
    return null;
  }
}

async function seedAllBins() {
  console.log('🌱 Starting bin seeding process...');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  console.log('');

  // Test API connection first
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    if (healthResponse.ok) {
      console.log('✅ API connection successful');
    } else {
      console.log('❌ API connection failed');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Cannot connect to API. Make sure the backend server is running.');
    console.log('Run: npm run dev');
    process.exit(1);
  }

  console.log('');

  // Seed each bin
  let successCount = 0;
  for (const binData of SAMPLE_BINS) {
    const result = await seedBin(binData);
    if (result) {
      successCount++;
    }
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('');
  console.log(`🎉 Seeding complete! ${successCount}/${SAMPLE_BINS.length} bins seeded successfully.`);
  console.log('');
  console.log('📋 Summary of seeded bins:');
  SAMPLE_BINS.forEach(bin => {
    const statusIcon = bin.mixed ? '⚠️' : bin.level >= 85 ? '🔴' : bin.level >= 50 ? '🟡' : '🟢';
    console.log(`  ${statusIcon} ${bin.binId} - ${bin.category} (${bin.level}% full)${bin.mixed ? ' - Mixed waste!' : ''}`);
  });
  console.log('');
  console.log('Now you can:');
  console.log('1. Open your frontend app and check the dashboard');
  console.log('2. Go to the Resident App to see the bins in the dropdown');
  console.log('3. Run the simulator for continuous updates: npm run sim');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Seeding interrupted');
  process.exit(0);
});

// Start seeding
seedAllBins().catch(error => {
  console.error('❌ Seeding error:', error);
  process.exit(1);
});