import React, { useState } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface RefundPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  payment: {
    id: number;
    amount: number;
    method: string;
    paymentDate: string;
    notes?: string;
  };
  isLoading?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function RefundPaymentDialog({
  isOpen,
  onClose,
  onConfirm,
  payment,
  isLoading = false
}: RefundPaymentDialogProps) {
  const [reason, setReason] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      setShowConfirmation(true);
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm(reason);
      setReason('');
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error('Refund failed:', error);
    }
  };

  const handleCancel = () => {
    setReason('');
    setShowConfirmation(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              Refund Payment
            </DialogTitle>
            <DialogDescription>
              Reverse a payment for this invoice. This action will update the invoice balance and mark the payment as reversed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800">Payment Details</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-orange-700">Amount:</span>
                  <span className="font-medium text-orange-800">{formatCurrency(payment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Method:</span>
                  <span className="text-orange-800">{payment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Date:</span>
                  <span className="text-orange-800">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Refund Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for this refund (e.g., Customer cancellation, billing error, etc.)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
              <p className="text-xs text-gray-500">
                This reason will be recorded in the payment history for audit purposes.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={!reason.trim() || isLoading}
              >
                {isLoading ? 'Processing...' : 'Refund Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund {formatCurrency(payment.amount)}? This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Mark this payment as reversed</li>
                <li>Update the invoice balance</li>
                <li>Record the refund reason in the payment history</li>
              </ul>
              <p className="mt-2 font-medium text-red-600">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Confirm Refund'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 