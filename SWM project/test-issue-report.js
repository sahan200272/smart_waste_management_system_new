// Simple test script to verify issue reporting API
const testData = {
  type: "Damage",
  priority: "High", 
  description: "Test issue report from script",
  location: "Test Location 123",
  binId: "BIN001"
};

console.log('Testing issue report API...');
console.log('Test data:', JSON.stringify(testData, null, 2));

fetch('http://localhost:5000/api/fieldops/report-issue', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => {
  console.log('✅ API Response:', JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error('❌ Error:', error);
});