import { db } from './db/index.js';
import { payments, invoices } from './shared/schema-sqlite.js';
import { eq, and, desc } from 'drizzle-orm';

async function cleanupDuplicatePayments() {
  try {
    console.log('🔍 Starting duplicate payment cleanup...');
    
    // Get all payments grouped by invoice_id, amount, method, and payment_date
    const allPayments = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.created_at));
    
    console.log(`📊 Found ${allPayments.length} total payments`);
    
    // Group payments by invoice to find duplicates
    const paymentsByInvoice = {};
    const duplicates = [];
    
    allPayments.forEach(payment => {
      const key = `${payment.invoice_id}-${payment.amount}-${payment.method}-${payment.payment_date}`;
      if (!paymentsByInvoice[key]) {
        paymentsByInvoice[key] = [];
      }
      paymentsByInvoice[key].push(payment);
      
      // If we have more than one payment with the same key, mark as duplicate
      if (paymentsByInvoice[key].length > 1) {
        duplicates.push({
          key,
          payments: paymentsByInvoice[key]
        });
      }
    });
    
    console.log(`🔍 Found ${duplicates.length} potential duplicate groups`);
    
    // Remove duplicates (keep the first one, remove the rest)
    let removedCount = 0;
    for (const duplicateGroup of duplicates) {
      const [keepPayment, ...duplicatePayments] = duplicateGroup.payments;
      
      console.log(`🗑️  Removing ${duplicatePayments.length} duplicates for invoice ${keepPayment.invoice_id}`);
      
      for (const duplicatePayment of duplicatePayments) {
        await db
          .delete(payments)
          .where(eq(payments.id, duplicatePayment.id));
        removedCount++;
      }
    }
    
    console.log(`✅ Removed ${removedCount} duplicate payments`);
    
    // Now recalculate all invoice balances
    console.log('🔄 Recalculating invoice balances...');
    
    const allInvoices = await db
      .select()
      .from(invoices);
    
    let updatedCount = 0;
    for (const invoice of allInvoices) {
      // Get all payments for this invoice
      const invoicePayments = await db
        .select()
        .from(payments)
        .where(eq(payments.invoice_id, invoice.id));
      
      // Calculate total paid
      const totalPaid = invoicePayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const totalAmount = parseFloat(invoice.total);
      
      // Determine new status
      let newStatus = invoice.status;
      if (totalPaid >= totalAmount) {
        newStatus = "paid";
      } else if (totalPaid > 0) {
        newStatus = "partially_paid";
      } else {
        newStatus = "pending";
      }
      
      // Update invoice if needed
      if (Math.abs(totalPaid - parseFloat(invoice.amount_paid || '0')) > 0.01 || newStatus !== invoice.status) {
        await db
          .update(invoices)
          .set({
            amount_paid: totalPaid.toString(),
            status: newStatus
          })
          .where(eq(invoices.id, invoice.id));
        
        console.log(`📝 Updated invoice ${invoice.id}: amount_paid=${totalPaid}, status=${newStatus}`);
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} invoices`);
    console.log('🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

cleanupDuplicatePayments(); 