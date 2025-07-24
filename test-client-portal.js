import fetch from 'node-fetch';

async function testClientPortalAPI() {
  try {
    console.log('Testing Client Portal API...');
    
    // Test with client ID 6 (Yandeivis Granado)
    const clientId = 6;
    console.log(`Testing client portal for client ID: ${clientId}`);
    
    const response = await fetch(`http://localhost:5005/api/client-portal/${clientId}/data`);
    console.log('Response status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ Client portal data received:');
      console.log('Client info:', data.client ? 'Found' : 'Missing');
      console.log('Projects count:', data.projects ? data.projects.length : 0);
      console.log('Estimates count:', data.estimates ? data.estimates.length : 0);
      console.log('Invoices count:', data.invoices ? data.invoices.length : 0);
      console.log('Appointments count:', data.appointments ? data.appointments.length : 0);
      console.log('Agent info:', data.agent ? 'Found' : 'Missing');
    } else if (response.status === 401) {
      console.log('❌ Authentication required (expected for protected route)');
    } else if (response.status === 404) {
      console.log('❌ Client not found');
      const errorText = await response.text();
      console.log('Error details:', errorText);
    } else {
      console.log('❌ Unexpected response:', response.status);
      const errorText = await response.text();
      console.log('Response body:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing client portal API:', error.message);
  }
}

testClientPortalAPI(); 