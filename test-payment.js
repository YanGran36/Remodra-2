const fetch = require('node-fetch');

async function testPayment() {
  try {
    console.log('Testing payment functionality...');
    
    // First, let's check if we can get invoices
    const invoicesResponse = await fetch('http://localhost:5005/api/protected/invoices', {
      headers: {
        'Cookie': 'session=your-session-cookie-here' // You'll need to get a real session
      }
    });
    
    console.log('Invoices response status:', invoicesResponse.status);
    
    if (invoicesResponse.ok) {
      const invoices = await invoicesResponse.json();
      console.log('Found invoices:', invoices.length);
      
      if (invoices.length > 0) {
        const firstInvoice = invoices[0];
        console.log('Testing payment on invoice:', firstInvoice.id);
        
        // Test payment recording
        const paymentResponse = await fetch(`http://localhost:5005/api/protected/invoices/${firstInvoice.id}/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'session=your-session-cookie-here'
          },
          body: JSON.stringify({
            amount: '100.00',
            paymentMethod: 'cash',
            notes: 'Test payment'
          })
        });
        
        console.log('Payment response status:', paymentResponse.status);
        
        if (paymentResponse.ok) {
          const paymentResult = await paymentResponse.json();
          console.log('Payment recorded successfully:', paymentResult);
        } else {
          const error = await paymentResponse.text();
          console.log('Payment failed:', error);
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPayment(); 