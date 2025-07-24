import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  DollarSign, 
  CreditCard, 
  Banknote, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Receipt
} from 'lucide-react';
import { format } from 'date-fns';

interface PaymentFormProps {
  invoice: {
    id: number;
    invoiceNumber: string;
    total: number;
    amountPaid: number;
    dueDate?: string;
    status: string;
  };
  onSubmit: (paymentData: PaymentData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface PaymentData {
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Credit Card', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: <Banknote className="h-4 w-4" /> },
  { value: 'check', label: 'Check', icon: <Receipt className="h-4 w-4" /> },
  { value: 'cash', label: 'Cash', icon: <DollarSign className="h-4 w-4" /> },
  { value: 'paypal', label: 'PayPal', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <DollarSign className="h-4 w-4" /> },
];

export default function PaymentForm({
  invoice,
  onSubmit,
  onCancel,
  isLoading = false
}: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentData>({
    amount: invoice.total - invoice.amountPaid,
    paymentMethod: 'credit_card',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    referenceNumber: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const pendingAmount = invoice.total - invoice.amountPaid;
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Payment amount must be greater than 0';
    }

    if (formData.amount > pendingAmount) {
      newErrors.amount = `Payment amount cannot exceed the pending balance of ${formatCurrency(pendingAmount)}`;
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Please select a payment date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Payment submission error:', error);
    }
  };

  const handleInputChange = (field: keyof PaymentData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="w-full">
      {/* Form Title */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Form</h2>
        <p className="text-sm text-gray-600">Invoice #{invoice.invoiceNumber}</p>
      </div>

      {/* Invoice Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-900">Invoice Summary</h3>
          <Badge variant={isOverdue ? "destructive" : "secondary"}>
            {isOverdue ? "OVERDUE" : invoice.status.toUpperCase()}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-medium ml-2">{formatCurrency(invoice.total)}</span>
          </div>
          <div>
            <span className="text-gray-600">Amount Paid:</span>
            <span className="font-medium ml-2 text-green-600">{formatCurrency(invoice.amountPaid)}</span>
          </div>
          <div>
            <span className="text-gray-600">Balance Due:</span>
            <span className="font-medium ml-2 text-red-600">{formatCurrency(pendingAmount)}</span>
          </div>
          {invoice.dueDate && (
            <div>
              <span className="text-gray-600">Due Date:</span>
              <span className={`font-medium ml-2 ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
              </span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Payment Amount *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={pendingAmount}
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.amount}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Maximum payment amount: {formatCurrency(pendingAmount)}
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="text-sm font-medium">
                Payment Method *
              </Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => handleInputChange('paymentMethod', value)}
              >
                <SelectTrigger className={errors.paymentMethod ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        {method.icon}
                        {method.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentMethod && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.paymentMethod}
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate" className="text-sm font-medium">
                Payment Date *
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                  className={errors.paymentDate ? 'border-red-500' : ''}
                />
              </div>
              {errors.paymentDate && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.paymentDate}
                </p>
              )}
            </div>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="referenceNumber" className="text-sm font-medium">
                Reference Number
              </Label>
              <Input
                id="referenceNumber"
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                placeholder="Transaction ID, check number, etc."
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this payment..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Submit Payment
                  </div>
                )}
              </Button>
            </div>
          </form>
    </div>
  );
} 