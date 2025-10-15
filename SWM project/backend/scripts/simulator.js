import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000';
const SIMULATION_INTERVAL = 5000; // 5 seconds
const BULK_SYNC_INTERVAL = 30000; // 30 seconds
const OFFLINE_MODE_DURATION = 60000; // 1 minute offline mode

// Demo bins data
const DEMO_BINS = [
  { binId: 'BIN-001', category: 'biodegradable', baseLevel: 30 },
  { binId: 'BIN-002', category: 'recyclable', baseLevel: 45 },
  { binId: 'BIN-003', category: 'non_biodegradable', baseLevel: 20 },
  { binId: 'BIN-004', category: 'biodegradable', baseLevel: 60 },
  { binId: 'BIN-005', category: 'recyclable', baseLevel: 80 }
];

let isOfflineMode = false;
let bufferedReadings = [];
let simulationCount = 0;

// Generate random sensor data
function generateSensorData(bin) {
  const now = new Date();
  const variation = Math.random() * 20 - 10; // ±10 variation
  const level = Math.max(0, Math.min(100, bin.baseLevel + variation));
  
  // Simulate mixed waste detection (10% chance)
  const mixed = Math.random() < 0.1;
  
  // Simulate high fill levels occasionally
  const highFill = Math.random() < 0.15;
  const finalLevel = highFill ? Math.min(100, level + 30) : level;
  
  return {
    binId: bin.binId,
    level: Math.round(finalLevel),
    category: bin.category,
    mixed,
    deviceTs: now.toISOString()
  };
}

// Send sensor data to API
async function sendSensorData(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bins/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Sent data for ${data.binId}: level=${data.level}%, mixed=${data.mixed}, category=${data.category}`);
      return result;
    } else {
      const error = await response.text();
      console.error(`❌ Error sending data for ${data.binId}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Network error for ${data.binId}:`, error.message);
    return null;
  }
}

// Send bulk sync data
async function sendBulkSync() {
  if (bufferedReadings.length === 0) return;

  try {
    console.log(`📦 Sending bulk sync with ${bufferedReadings.length} readings...`);
    
    const response = await fetch(`${API_BASE_URL}/api/reports/bulk-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ readings: bufferedReadings })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Bulk sync completed: ${result.processed} processed, ${result.errors} errors`);
      bufferedReadings = []; // Clear buffer
    } else {
      const error = await response.text();
      console.error(`❌ Bulk sync error:`, error);
    }
  } catch (error) {
    console.error(`❌ Bulk sync network error:`, error.message);
  }
}

// Simulate sensor readings
async function simulateReadings() {
  simulationCount++;
  
  // Toggle offline mode every 10 cycles
  if (simulationCount % 10 === 0) {
    isOfflineMode = !isOfflineMode;
    console.log(`🔄 ${isOfflineMode ? 'Entering' : 'Exiting'} offline mode`);
  }

  // Select random bins to send data (3-5 bins per cycle)
  const numBins = Math.floor(Math.random() * 3) + 3;
  const selectedBins = DEMO_BINS
    .sort(() => 0.5 - Math.random())
    .slice(0, numBins);

  for (const bin of selectedBins) {
    const sensorData = generateSensorData(bin);
    
    if (isOfflineMode) {
      // Buffer readings for later bulk sync
      bufferedReadings.push(sensorData);
      console.log(`📦 Buffered data for ${sensorData.binId}: level=${sensorData.level}%, mixed=${sensorData.mixed} (offline mode)`);
    } else {
      // Send immediately
      await sendSensorData(sensorData);
    }
  }

  // Send bulk sync if we have buffered readings and not in offline mode
  if (!isOfflineMode && bufferedReadings.length > 0) {
    await sendBulkSync();
  }
}

// Simulate manual reports occasionally
async function simulateManualReport() {
  if (Math.random() < 0.1) { // 10% chance
    const bin = DEMO_BINS[Math.floor(Math.random() * DEMO_BINS.length)];
    const issues = [
      'suspected mixing of waste types',
      'bin mechanism seems stuck',
      'unusual odor detected',
      'bin appears damaged'
    ];
    
    const issue = issues[Math.floor(Math.random() * issues.length)];
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'simulated_user',
          binId: bin.binId,
          issue
        })
      });

      if (response.ok) {
        console.log(`📝 Manual report submitted for ${bin.binId}: ${issue}`);
      }
    } catch (error) {
      console.error(`❌ Manual report error:`, error.message);
    }
  }
}

// Main simulation loop
async function startSimulation() {
  console.log('🚀 Starting Smart Waste Management Sensor Simulator');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  console.log(`⏱️  Simulation interval: ${SIMULATION_INTERVAL}ms`);
  console.log(`📦 Bulk sync interval: ${BULK_SYNC_INTERVAL}ms`);
  console.log(`🔄 Offline mode duration: ${OFFLINE_MODE_DURATION}ms`);
  console.log('');

  // Test API connection
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    if (healthResponse.ok) {
      console.log('✅ API connection successful');
    } else {
      console.log('⚠️  API connection failed, but continuing simulation...');
    }
  } catch (error) {
    console.log('⚠️  API connection failed, but continuing simulation...');
  }

  console.log('');

  // Start simulation
  setInterval(simulateReadings, SIMULATION_INTERVAL);
  
  // Simulate manual reports occasionally
  setInterval(simulateManualReport, SIMULATION_INTERVAL * 3);

  // Force bulk sync every 30 seconds
  setInterval(() => {
    if (bufferedReadings.length > 0) {
      sendBulkSync();
    }
  }, BULK_SYNC_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down simulator...');
  
  // Send any remaining buffered readings
  if (bufferedReadings.length > 0) {
    console.log(`📦 Sending final bulk sync with ${bufferedReadings.length} readings...`);
    sendBulkSync().then(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Start the simulation
startSimulation().catch(error => {
  console.error('❌ Simulation error:', error);
  process.exit(1);
});
