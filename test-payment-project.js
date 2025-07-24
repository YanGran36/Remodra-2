import fetch from 'node-fetch';

async function testPaymentAndProjectCreation() {
  try {
    console.log('🧪 Testing Payment and Automatic Project Creation...\n');

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
    console.log('✅ Login successful');

    // Step 2: Get invoices to find one without a project
    console.log('\n2. Fetching invoices...');
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

    // Find an invoice without a project and with some amount paid
    const targetInvoice = invoices.find(invoice => 
      !invoice.project && 
      invoice.amountPaid > 0 && 
      invoice.amountPaid < invoice.total
    );

    if (!targetInvoice) {
      console.log('❌ No suitable invoice found for testing (need one with partial payment and no project)');
      return;
    }

    console.log(`📋 Using invoice #${targetInvoice.invoiceNumber} (ID: ${targetInvoice.id})`);
    console.log(`   Amount paid: $${targetInvoice.amountPaid}`);
    console.log(`   Total: $${targetInvoice.total}`);
    console.log(`   Project ID: ${targetInvoice.project || 'None'}`);

    // Step 3: Make a payment
    console.log('\n3. Making payment...');
    const paymentAmount = 1000; // $1000 payment
    const paymentResponse = await fetch(`http://localhost:5005/api/protected/invoices/${targetInvoice.id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        amount: paymentAmount,
        paymentMethod: 'test',
        notes: 'Test payment for automatic project creation'
      })
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      throw new Error(`Payment failed: ${paymentResponse.status} - ${errorText}`);
    }

    const paymentResult = await paymentResponse.json();
    console.log('✅ Payment successful');
    console.log(`   Payment amount: $${paymentAmount}`);
    console.log(`   New amount paid: $${paymentResult.totals.currentAmountPaid}`);
    console.log(`   Project update: ${paymentResult.projectUpdate.updated ? 'Yes' : 'No'}`);
    
    if (paymentResult.projectUpdate.updated) {
      console.log(`   Project message: ${paymentResult.projectUpdate.message}`);
    }

    // Step 4: Verify project was created
    console.log('\n4. Verifying project creation...');
    const updatedInvoiceResponse = await fetch(`http://localhost:5005/api/protected/invoices/${targetInvoice.id}`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (!updatedInvoiceResponse.ok) {
      throw new Error(`Failed to fetch updated invoice: ${updatedInvoiceResponse.status}`);
    }

    const updatedInvoice = await updatedInvoiceResponse.json();
    console.log(`✅ Invoice updated`);
    console.log(`   New amount paid: $${updatedInvoice.amountPaid}`);
    console.log(`   Project ID: ${updatedInvoice.projectId || 'None'}`);

    if (updatedInvoice.projectId) {
      console.log('🎉 SUCCESS: Project was automatically created!');
      
      // Get project details
      const projectResponse = await fetch(`http://localhost:5005/api/protected/projects/${updatedInvoice.projectId}`, {
        headers: {
          'Cookie': cookies
        }
      });

      if (projectResponse.ok) {
        const project = await projectResponse.json();
        console.log(`📋 Project Details:`);
        console.log(`   Title: ${project.title}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   Budget: $${project.budget}`);
        console.log(`   Description: ${project.description?.substring(0, 100)}...`);
      }
    } else {
      console.log('❌ FAILED: No project was created');
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
      console.log(`✅ Found ${projects.length} total projects`);
      projects.forEach(project => {
        console.log(`   - Project ${project.id}: ${project.title} (${project.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPaymentAndProjectCreation(); 

async function testPaymentAndProjectCreation() {
  try {
    console.log('🧪 Testing Payment and Automatic Project Creation...\n');

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
    console.log('✅ Login successful');

    // Step 2: Get invoices to find one without a project
    console.log('\n2. Fetching invoices...');
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

    // Find an invoice without a project and with some amount paid
    const targetInvoice = invoices.find(invoice => 
      !invoice.project && 
      invoice.amountPaid > 0 && 
      invoice.amountPaid < invoice.total
    );

    if (!targetInvoice) {
      console.log('❌ No suitable invoice found for testing (need one with partial payment and no project)');
      return;
    }

    console.log(`📋 Using invoice #${targetInvoice.invoiceNumber} (ID: ${targetInvoice.id})`);
    console.log(`   Amount paid: $${targetInvoice.amountPaid}`);
    console.log(`   Total: $${targetInvoice.total}`);
    console.log(`   Project ID: ${targetInvoice.project || 'None'}`);

    // Step 3: Make a payment
    console.log('\n3. Making payment...');
    const paymentAmount = 1000; // $1000 payment
    const paymentResponse = await fetch(`http://localhost:5005/api/protected/invoices/${targetInvoice.id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        amount: paymentAmount,
        paymentMethod: 'test',
        notes: 'Test payment for automatic project creation'
      })
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      throw new Error(`Payment failed: ${paymentResponse.status} - ${errorText}`);
    }

    const paymentResult = await paymentResponse.json();
    console.log('✅ Payment successful');
    console.log(`   Payment amount: $${paymentAmount}`);
    console.log(`   New amount paid: $${paymentResult.totals.currentAmountPaid}`);
    console.log(`   Project update: ${paymentResult.projectUpdate.updated ? 'Yes' : 'No'}`);
    
    if (paymentResult.projectUpdate.updated) {
      console.log(`   Project message: ${paymentResult.projectUpdate.message}`);
    }

    // Step 4: Verify project was created
    console.log('\n4. Verifying project creation...');
    const updatedInvoiceResponse = await fetch(`http://localhost:5005/api/protected/invoices/${targetInvoice.id}`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (!updatedInvoiceResponse.ok) {
      throw new Error(`Failed to fetch updated invoice: ${updatedInvoiceResponse.status}`);
    }

    const updatedInvoice = await updatedInvoiceResponse.json();
    console.log(`✅ Invoice updated`);
    console.log(`   New amount paid: $${updatedInvoice.amountPaid}`);
    console.log(`   Project ID: ${updatedInvoice.projectId || 'None'}`);

    if (updatedInvoice.projectId) {
      console.log('🎉 SUCCESS: Project was automatically created!');
      
      // Get project details
      const projectResponse = await fetch(`http://localhost:5005/api/protected/projects/${updatedInvoice.projectId}`, {
        headers: {
          'Cookie': cookies
        }
      });

      if (projectResponse.ok) {
        const project = await projectResponse.json();
        console.log(`📋 Project Details:`);
        console.log(`   Title: ${project.title}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   Budget: $${project.budget}`);
        console.log(`   Description: ${project.description?.substring(0, 100)}...`);
      }
    } else {
      console.log('❌ FAILED: No project was created');
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
      console.log(`✅ Found ${projects.length} total projects`);
      projects.forEach(project => {
        console.log(`   - Project ${project.id}: ${project.title} (${project.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPaymentAndProjectCreation(); 