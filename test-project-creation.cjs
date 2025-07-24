const fetch = require('node-fetch');

async function testProjectCreation() {
  try {
    console.log('🧪 Testing automatic project creation...\n');

    // Step 1: Login to get session
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:5005/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@remodra.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful\n');

    // Step 2: Get invoices to find one without a project
    console.log('2. Fetching invoices...');
    const invoicesResponse = await fetch('http://localhost:5005/api/protected/invoices', {
      headers: {
        'Cookie': cookies
      }
    });

    if (!invoicesResponse.ok) {
      throw new Error(`Failed to fetch invoices: ${invoicesResponse.status}`);
    }

    const invoices = await invoicesResponse.json();
    console.log(`✅ Found ${invoices.length} invoices`);

    // Find an invoice without a project
    const invoiceWithoutProject = invoices.find(inv => !inv.projectId && inv.status !== 'paid');
    
    if (!invoiceWithoutProject) {
      console.log('❌ No invoices found without projects and not fully paid');
      return;
    }

    console.log(`📄 Using invoice: ${invoiceWithoutProject.invoiceNumber} (ID: ${invoiceWithoutProject.id})`);
    console.log(`💰 Total: $${invoiceWithoutProject.total}, Amount Paid: $${invoiceWithoutProject.amountPaid || 0}\n`);

    // Step 3: Make a payment
    console.log('3. Making payment...');
    const paymentAmount = Math.min(100, invoiceWithoutProject.total - (invoiceWithoutProject.amountPaid || 0));
    
    const paymentResponse = await fetch(`http://localhost:5005/api/protected/invoices/${invoiceWithoutProject.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        amount: paymentAmount.toString(),
        method: 'cash',
        notes: 'Test payment for automatic project creation'
      })
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      throw new Error(`Payment failed: ${paymentResponse.status} - ${errorText}`);
    }

    const paymentResult = await paymentResponse.json();
    console.log('✅ Payment successful');
    console.log(`💰 Payment amount: $${paymentAmount}`);
    console.log(`📊 Project update: ${paymentResult.projectUpdate.message}\n`);

    // Step 4: Verify project was created
    console.log('4. Verifying project creation...');
    const updatedInvoiceResponse = await fetch(`http://localhost:5005/api/protected/invoices/${invoiceWithoutProject.id}`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (!updatedInvoiceResponse.ok) {
      throw new Error(`Failed to fetch updated invoice: ${updatedInvoiceResponse.status}`);
    }

    const updatedInvoice = await updatedInvoiceResponse.json();
    
    if (updatedInvoice.project) {
      console.log('✅ Project created successfully!');
      console.log(`📋 Project ID: ${updatedInvoice.project.id}`);
      console.log(`📋 Project Title: ${updatedInvoice.project.title}`);
      console.log(`📋 Project Status: ${updatedInvoice.project.status}`);
    } else {
      console.log('❌ No project found after payment');
    }

    // Step 5: Check all projects
    console.log('\n5. Checking all projects...');
    const projectsResponse = await fetch('http://localhost:5005/api/protected/projects', {
      headers: {
        'Cookie': cookies
      }
    });

    if (projectsResponse.ok) {
      const projects = await projectsResponse.json();
      console.log(`📋 Total projects: ${projects.length}`);
      
      const recentProjects = projects.filter(p => 
        p.title && p.title.includes(invoiceWithoutProject.invoiceNumber)
      );
      
      if (recentProjects.length > 0) {
        console.log('✅ Found automatically created project(s):');
        recentProjects.forEach(p => {
          console.log(`   - ${p.title} (ID: ${p.id}, Status: ${p.status})`);
        });
      }
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProjectCreation(); 