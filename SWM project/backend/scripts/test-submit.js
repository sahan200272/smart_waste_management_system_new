// Simple test to verify the API endpoint
const testReport = {
  type: "Damage",
  priority: "High",
  description: "Test issue report from Node.js",
  location: "Test Location 123",
  binId: "BIN001"
};

console.log('Testing issue report API...');

fetch('http://localhost:5000/api/fieldops/report-issue', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testReport)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Success! Response:', data);
  
  if (data.success) {
    console.log('🎫 Ticket ID:', data.data.ticketId);
    console.log('📝 Message:', data.message);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});