import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  CheckCircle, 
  Play, 
  ArrowRight, 
  DollarSign,
  FileText,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface PaymentSuccessNotificationProps {
  payment: {
    amount: number;
    method: string;
    paymentDate: string;
  };
  invoice: {
    invoiceNumber: string;
    total: number;
    amountPaid: number;
  };
  projectUpdate: {
    updated: boolean;
    newStatus?: string;
    message: string;
  };
  onViewProject?: () => void;
  onViewInvoice?: () => void;
  onClose?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function PaymentSuccessNotification({
  payment,
  invoice,
  projectUpdate,
  onViewProject,
  onViewInvoice,
  onClose
}: PaymentSuccessNotificationProps) {
  // Calculate remaining balance
  const remainingBalance = (invoice.total ?? 0) - (invoice.amountPaid ?? 0);
  const isFullyPaid = remainingBalance <= 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full shadow-2xl border-0">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-green-900">Payment Successful!</CardTitle>
              <p className="text-sm text-green-700">Payment has been recorded</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          {/* Payment Confirmation - Main Focus */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex flex-col items-center">
            <CheckCircle className="h-10 w-10 text-green-600 mb-2" />
            <h2 className="text-2xl font-bold text-green-900 mb-1">Payment Received</h2>
            <div className="text-lg font-semibold text-green-800 mb-2">{formatCurrency(payment.amount)}</div>
            <div className="flex gap-4 text-sm text-gray-700 mb-1">
              <span className="capitalize">{payment.method}</span>
              <span>|</span>
              <span>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</span>
            </div>
          </div>

          {/* Invoice Status */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-2">Invoice Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice #:</span>
                <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining Balance:</span>
                {remainingBalance <= 0 ? (
                  <span className="font-medium text-green-600">Paid in Full</span>
                ) : (
                  <span className="font-medium text-red-600">{formatCurrency(remainingBalance)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Project Update */}
          {projectUpdate.updated && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Play className="h-4 w-4 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Project Created!</h3>
              </div>
              <p className="text-sm text-purple-700 mb-3">{projectUpdate.message}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                  {projectUpdate.newStatus}
                </Badge>
                <span className="text-xs text-purple-600">Status</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {projectUpdate.updated && onViewProject && (
              <Button 
                onClick={onViewProject}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Project
              </Button>
            )}
            {onViewInvoice && (
              <Button 
                variant="outline"
                onClick={onViewInvoice}
                className="flex-1"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                View Invoice
              </Button>
            )}
          </div>

          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 