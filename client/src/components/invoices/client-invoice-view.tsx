import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  Download, 
  Eye, 
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  User,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import PaymentTracking from './payment-tracking';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

interface ClientInvoiceViewProps {
  invoice: {
    id: number;
    invoiceNumber: string;
    status: string;
    issueDate: string;
    dueDate?: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    amountPaid: number;
    terms?: string;
    notes?: string;
    items: InvoiceItem[];
    payments: Payment[];
    client: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      zip: string;
    };
    contractor: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      zip: string;
    };
    project?: {
      title: string;
      description?: string;
    };
  };
  onDownload?: () => void;
  onViewDetails?: () => void;
  onMakePayment?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    paid: { color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="h-4 w-4" /> },
    partially_paid: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="h-4 w-4" /> },
    pending: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Clock className="h-4 w-4" /> },
    overdue: { color: 'bg-red-100 text-red-800 border-red-200', icon: <AlertCircle className="h-4 w-4" /> },
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
  
  return (
    <Badge className={`flex items-center gap-1 ${config.color}`}>
      {config.icon}
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
};

export default function ClientInvoiceView({
  invoice,
  onDownload,
  onViewDetails,
  onMakePayment
}: ClientInvoiceViewProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const pendingAmount = invoice.total - invoice.amountPaid;
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
          <p className="text-gray-600 mt-1">
            Issued on {format(new Date(invoice.issueDate), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(invoice.status)}
          <div className="flex gap-2">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-lg font-bold">{formatCurrency(invoice.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Amount Paid</p>
                <p className="text-lg font-bold">{formatCurrency(invoice.amountPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Balance Due</p>
                <p className="text-lg font-bold">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className={`text-lg font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd') : 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Tracking */}
            <PaymentTracking
              total={invoice.total}
              amountPaid={invoice.amountPaid}
              payments={invoice.payments}
              status={invoice.status}
              dueDate={invoice.dueDate}
              invoiceNumber={invoice.invoiceNumber}
            />

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contractor Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">From:</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{invoice.contractor.name}</p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {invoice.contractor.address}, {invoice.contractor.city}, {invoice.contractor.state} {invoice.contractor.zip}
                    </p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-3 w-3" />
                      {invoice.contractor.phone}
                    </p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-3 w-3" />
                      {invoice.contractor.email}
                    </p>
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">To:</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{invoice.client.name}</p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {invoice.client.address}, {invoice.client.city}, {invoice.client.state} {invoice.client.zip}
                    </p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-3 w-3" />
                      {invoice.client.phone}
                    </p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-3 w-3" />
                      {invoice.client.email}
                    </p>
                  </div>
                </div>

                {/* Project Info */}
                {invoice.project && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Project:</h4>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{invoice.project.title}</p>
                      {invoice.project.description && (
                        <p className="text-gray-600">{invoice.project.description}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Action */}
          {pendingAmount > 0 && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Payment Required</h3>
                    <p className="text-gray-600">
                      Outstanding balance: {formatCurrency(pendingAmount)}
                    </p>
                  </div>
                  {onMakePayment && (
                    <Button onClick={onMakePayment} size="lg">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Make Payment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableHeader>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(invoice.subtotal)}</TableCell>
                  </TableRow>
                  {invoice.tax > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Tax ({invoice.tax}%)</TableCell>
                      <TableCell className="text-right">{formatCurrency((invoice.subtotal * invoice.tax) / 100)}</TableCell>
                    </TableRow>
                  )}
                  {invoice.discount > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Discount ({invoice.discount}%)</TableCell>
                      <TableCell className="text-right">-{formatCurrency((invoice.subtotal * invoice.discount) / 100)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold text-lg">Total</TableCell>
                    <TableCell className="text-right font-bold text-lg">{formatCurrency(invoice.total)}</TableCell>
                  </TableRow>
                </TableHeader>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <PaymentTracking
            total={invoice.total}
            amountPaid={invoice.amountPaid}
            payments={invoice.payments}
            status={invoice.status}
            dueDate={invoice.dueDate}
            invoiceNumber={invoice.invoiceNumber}
          />
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="space-y-6">
            {/* Terms and Conditions */}
            {invoice.terms && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Terms and Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{invoice.terms}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Notes */}
            {invoice.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{invoice.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 