// Quick test to verify the issue reporting API works
console.log('Testing Field Operations Issue Reporting...');

const testIssue = {
  type: 'Damage',
  priority: 'High',
  description: 'Test damage report - broken bin lid',
  location: 'Main Street Corner',
  binId: 'BIN001'
};

// Test the API endpoint
fetch('http://localhost:5000/api/fieldops/report-issue', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testIssue)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Success! Issue reported:');
  console.log('- Ticket ID:', data.data?.ticketId);
  console.log('- Type:', data.data?.type);
  console.log('- Priority:', data.data?.priority);
  console.log('- Status:', data.data?.status);
  console.log('- Message:', data.message);
})
.catch(error => {
  console.error('❌ Error:', error);
});