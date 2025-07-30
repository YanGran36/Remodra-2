import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import RefundPaymentDialog from './refund-payment-dialog';

interface Payment {
  id: number;
  amount: number;
  method: string;
  payment_date?: string; // Database field name
  paymentDate?: string; // Frontend field name
  notes?: string;
  created_at?: string; // Database field name
  createdAt?: string; // Frontend field name
  status?: string; // 'active' or 'reversed'
}

interface PaymentTrackingProps {
  total: number;
  amountPaid: number;
  payments: Payment[];
  status: string;
  dueDate?: string;
  invoiceNumber: string;
  onRefundPayment?: (paymentId: number, reason: string) => Promise<void>;
  isRefunding?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getPaymentMethodIcon = (method: string) => {
  switch (method.toLowerCase()) {
    case 'credit_card':
      return <CreditCard className="h-4 w-4" />;
    case 'bank_transfer':
      return <TrendingUp className="h-4 w-4" />;
    case 'check':
      return <Receipt className="h-4 w-4" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
};

const getPaymentMethodLabel = (method: string) => {
  switch (method.toLowerCase()) {
    case 'credit_card':
      return 'Credit Card';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'check':
      return 'Check';
    case 'cash':
      return 'Cash';
    default:
      return method.charAt(0).toUpperCase() + method.slice(1);
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'partially_paid':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'pending':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'partially_paid':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-blue-600" />;
    case 'overdue':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

export default function PaymentTracking({ 
  total, 
  amountPaid, 
  payments, 
  status, 
  dueDate, 
  invoiceNumber,
  onRefundPayment,
  isRefunding = false
}: PaymentTrackingProps) {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Calculate remaining balance
  const remaining = Math.max(total - amountPaid, 0);
  const summaryRows = [
    { label: "Total Amount", value: formatCurrency(total) },
    { label: "Amount Paid", value: formatCurrency(amountPaid) },
    { label: "Remaining Balance", value: formatCurrency(remaining) }
  ];

  const handleRefundClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setRefundDialogOpen(true);
  };

  const handleRefundConfirm = async (reason: string) => {
    if (selectedPayment && onRefundPayment) {
      await onRefundPayment(selectedPayment.id, reason);
    }
  };

  const handleRefundClose = () => {
    setRefundDialogOpen(false);
    setSelectedPayment(null);
  };

  return (
    <div>
      {/* Simple Invoice Summary */}
      <div className="mb-6 p-4 bg-slate-800/50 border border-white/20 rounded-lg flex flex-col md:flex-row md:items-center md:gap-8">
        {summaryRows.map((row, idx) => (
          <div key={row.label} className="flex-1 mb-2 md:mb-0">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{row.label}</div>
            <div className={`text-lg font-bold ${row.label === 'Remaining Balance' && remaining > 0 ? 'text-red-400' : row.label === 'Amount Paid' ? 'text-green-400' : 'text-slate-200'}`}>{row.value}</div>
          </div>
        ))}
      </div>
      {/* Payment History */}
      <Card className="remodra-card">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => {
                const isReversed = payment.status === 'reversed' || (payment.notes && payment.notes.includes('[REVERSED]'));
                const paymentDate = payment.paymentDate || payment.payment_date || Date.now();
                const createdDate = payment.createdAt || payment.created_at || Date.now();
                
                return (
                  <div
                    key={payment.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      isReversed 
                        ? 'bg-slate-800/50 border-white/20 opacity-75' 
                        : 'bg-slate-800/30 border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        isReversed ? 'bg-slate-700' : 'bg-green-600/20'
                      }`}>
                        {getPaymentMethodIcon(payment.method)}
                      </div>
                      <div>
                        <p className={`font-semibold text-lg ${
                          isReversed ? 'line-through text-slate-400' : 'text-slate-200'
                        }`}>
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-slate-400">
                          {getPaymentMethodLabel(payment.method)} • {format(new Date(paymentDate), 'MMM dd, yyyy')}
                        </p>
                        {payment.notes && (
                          <p className={`text-xs mt-1 ${
                            isReversed ? 'text-red-400' : 'text-slate-500'
                          }`}>
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <Badge className={
                          isReversed 
                            ? 'bg-red-600/20 text-red-400 border-white/30' 
                            : 'bg-green-600/10 text-green-300 border-white/30'
                        }>
                          {isReversed ? 'Reversed' : 'Received'}
                        </Badge>
                        <p className="text-xs text-slate-400 mt-1">
                          {format(new Date(createdDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      {!isReversed && onRefundPayment && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefundClick(payment)}
                          disabled={isRefunding}
                          className="ml-2"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Refund
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <p>No payments recorded yet</p>
              <p className="text-sm">Payment history will appear here once payments are made</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      {selectedPayment && (
        <RefundPaymentDialog
          isOpen={refundDialogOpen}
          onClose={handleRefundClose}
          onConfirm={handleRefundConfirm}
          payment={{
            id: selectedPayment.id,
            amount: selectedPayment.amount,
            method: selectedPayment.method,
            paymentDate: selectedPayment.paymentDate || selectedPayment.payment_date || new Date().toISOString(),
            notes: selectedPayment.notes
          }}
          isLoading={isRefunding}
        />
      )}

      {/* Payment Instructions */}
      {remaining > 0 && (
        <Card className="remodra-card border-l-4 border-l-amber-500">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
            <CardTitle className="flex items-center gap-2 text-lg text-amber-400">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              Payment Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-amber-600/20 p-4 rounded-lg border border-white/20">
              <p className="text-sm text-amber-300">
                <strong>Remaining Balance:</strong> {formatCurrency(remaining)}
              </p>
              {dueDate && (
                <p className="text-sm text-red-400 mt-1">
                  <strong>Note:</strong> This invoice is overdue. Please make payment as soon as possible.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-slate-200 mb-2">Accepted Payment Methods:</p>
                <ul className="space-y-1 text-slate-400">
                  <li>• Credit/Debit Cards</li>
                  <li>• Bank Transfers</li>
                  <li>• Checks</li>
                  <li>• Cash</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-200 mb-2">Contact Information:</p>
                <p className="text-slate-400">For payment questions, please contact your contractor directly.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 