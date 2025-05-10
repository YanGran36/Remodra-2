import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { CheckCircle, XCircle, AlertCircle, Send, Edit3, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Define invoice status colors
const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-blue-100 text-blue-800",
  overdue: "bg-red-100 text-red-800",
  partially_paid: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  signed: "bg-purple-100 text-purple-800"
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <AlertCircle className="h-4 w-4" />,
  pending: <Send className="h-4 w-4" />,
  signed: <CheckCircle className="h-4 w-4" />,
  paid: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />
};

// Signature Pad Component
function SignaturePad({
  onChange,
  value,
  width = 350,
  height = 200,
  lineWidth = 2.5,
  lineColor = "#000000",
  clearLabel = "Clear",
  confirmLabel = "Confirm Signature"
}: {
  onChange: (value: string) => void;
  value?: string;
  width?: number;
  height?: number;
  lineWidth?: number;
  lineColor?: string;
  clearLabel?: string;
  confirmLabel?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const isFirstRender = useRef(true);
  
  // Detect if mobile device
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Setup canvas context
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set exact canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Configure drawing context
    context.lineWidth = lineWidth;
    context.strokeStyle = lineColor;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    
    setCtx(context);
    
    // Clear canvas on first render
    if (isFirstRender.current) {
      clearCanvas();
      isFirstRender.current = false;
    }
  }, [width, height, lineWidth, lineColor]);
  
  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!ctx) return;
    
    setDrawing(true);
    setHasDrawn(true);
    
    // Get position
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      // Touch event
      e.preventDefault(); // Prevent scrolling
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawing || !ctx) return;
    
    // Get position
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      // Touch event
      e.preventDefault(); // Prevent scrolling
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };
  
  const finishDrawing = () => {
    if (!drawing) return;
    
    if (ctx) {
      ctx.closePath();
    }
    
    setDrawing(false);
  };
  
  // Function to clear canvas
  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.beginPath();
    setHasDrawn(false);
    onChange('');
  };
  
  // Function to save signature
  const saveSignature = () => {
    if (!canvasRef.current || !hasDrawn) return;
    
    try {
      const dataURL = canvasRef.current.toDataURL('image/png');
      onChange(dataURL);
    } catch (e) {
      console.error('Error saving signature:', e);
    }
  };
  
  return (
    <div className="flex flex-col items-center w-full">
      <div 
        className="border-2 border-blue-300 rounded-lg overflow-hidden bg-white mb-3 relative"
        style={{ width: `${width}px`, height: `${height}px`, touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={finishDrawing}
          onMouseLeave={finishDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={finishDrawing}
        />
        
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
            <div className="text-center p-4">
              <Edit3 className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p>Draw your signature here</p>
              {isMobile && <p className="text-xs mt-1">Use your finger to sign</p>}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-3 w-full justify-center">
        <Button 
          variant="outline"
          onClick={clearCanvas}
          disabled={!hasDrawn}
        >
          {clearLabel}
        </Button>
        
        <Button
          onClick={saveSignature}
          disabled={!hasDrawn}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

// Definición de tipo para la factura
interface Invoice {
  id: number;
  invoiceNumber?: string;
  status: string;
  issueDate?: string | Date;
  dueDate?: string | Date;
  subtotal?: number | string;
  tax?: number | string;
  discount?: number | string;
  total?: number | string;
  notes?: string;
  terms?: string;
  clientSignature?: string;
  contractorSignature?: string;
  updatedAt?: string | Date;
  estimateId?: number;
  items?: Array<{
    id: number;
    description: string;
    quantity: number | string;
    unitPrice: number | string;
    amount: number | string;
    notes?: string;
  }>;
  contractor?: any;
  client?: any;
  project?: any;
  estimate?: any;
}

export default function PublicInvoiceView() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [contractor, setContractor] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [signature, setSignature] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);
  const [actionResult, setActionResult] = useState<{
    success: boolean;
    message: string;
    redirectTo?: string;
  } | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch invoice data
        const response = await fetch(`/api/public/invoices/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Couldn't load invoice");
        }
        
        const data = await response.json();
        setInvoice(data);
        setContractor(data.contractor);
        setClient(data.client);
      } catch (err: any) {
        setError(err.message || "An error occurred while loading the invoice");
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSignInvoice = async () => {
    if (!signature) {
      alert("Please provide your signature first.");
      return;
    }
    
    setActionInProgress(true);
    
    try {
      const response = await fetch(`/api/public/invoices/${id}/client-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sign',
          signature,
          notes
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to sign invoice");
      }
      
      setActionComplete(true);
      setActionResult({
        success: true,
        message: result.message || "Invoice has been signed successfully",
        redirectTo: result.redirectTo
      });
      
      // Update local state
      setInvoice((prevInvoice: any) => {
        if (!prevInvoice) return null;
        return {
          ...prevInvoice,
          status: 'signed',
          clientSignature: signature
        };
      });
      
    } catch (err: any) {
      setActionResult({
        success: false,
        message: err.message || "An error occurred while signing the invoice"
      });
    } finally {
      setActionInProgress(false);
      setShowSignatureDialog(false);
    }
  };

  // Helper function to format dates
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "Not specified";
    return format(new Date(dateString), "MMMM d, yyyy", { locale: es });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <div className="loading-spinner mb-4"></div>
        <h2 className="text-lg font-medium mb-1">Loading invoice...</h2>
        <p className="text-gray-500">Please wait while we retrieve the invoice details</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader>
            <CardTitle>Error Loading Invoice</CardTitle>
            <CardDescription>We encountered a problem while trying to load the invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              If this problem persists, please contact support.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader>
            <CardTitle>Invoice Not Found</CardTitle>
            <CardDescription>We couldn't find the requested invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <p>The invoice you're looking for doesn't exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine if action buttons should be shown
  const shouldShowActionButtons = invoice.status === 'pending';

  // Result dialog after an action is taken
  const ResultDialog = () => (
    <AlertDialog open={actionComplete}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {actionResult?.success ? "Success!" : "Error"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {actionResult?.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setActionComplete(false)}>
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Signature dialog
  const SignatureDialog = () => (
    <AlertDialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Sign Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Please provide your signature to approve this invoice.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <SignaturePad
            onChange={setSignature}
            value={signature}
          />
          
          <div className="mt-4">
            <Textarea
              placeholder="Optional notes or comments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[80px]"
            />
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSignInvoice}
            disabled={actionInProgress || !signature}
          >
            {actionInProgress ? (
              <>
                <span className="loading-spinner mr-2"></span>
                Processing...
              </>
            ) : (
              "Sign Invoice"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="flex min-h-screen flex-col items-center p-6 bg-gray-50">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="bg-gray-100/60 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Invoice {invoice.invoiceNumber || `#${invoice.id}`}</CardTitle>
              <CardDescription>
                {contractor?.companyName || `${contractor?.firstName} ${contractor?.lastName}`}
              </CardDescription>
            </div>
            <Badge className={statusColors[invoice.status] || statusColors.draft}>
              {invoice.status === 'signed' ? 'Signed' : 
               invoice.status === 'pending' ? 'Pending Signature' : 
               invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">From</h3>
              <p className="font-medium">
                {contractor?.companyName || `${contractor?.firstName} ${contractor?.lastName}`}
              </p>
              <p className="text-sm text-gray-600">{contractor?.email}</p>
              <p className="text-sm text-gray-600">{contractor?.phone}</p>
              {contractor?.address && (
                <p className="text-sm text-gray-600 mt-1">{contractor?.address}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">To</h3>
              <p className="font-medium">{client?.firstName} {client?.lastName}</p>
              <p className="text-sm text-gray-600">{client?.email}</p>
              <p className="text-sm text-gray-600">{client?.phone}</p>
              {client?.address && (
                <p className="text-sm text-gray-600 mt-1">{client?.address}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Invoice Date</h3>
              <p>{formatDate(invoice.issueDate)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
              <p>{formatDate(invoice.dueDate)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Amount Due</h3>
              <p className="font-semibold text-lg">
                {formatCurrency(Number(invoice.total) || 0)}
              </p>
            </div>
          </div>
          
          <Tabs defaultValue="items" className="mt-6">
            <TabsList>
              <TabsTrigger value="items">Invoice Items</TabsTrigger>
              <TabsTrigger value="terms">Terms & Notes</TabsTrigger>
              {invoice.clientSignature && <TabsTrigger value="signatures">Signatures</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="items" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.description}
                          {item.notes && <p className="text-sm text-gray-500 mt-1">{item.notes}</p>}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(Number(item.unitPrice))}</TableCell>
                        <TableCell>{formatCurrency(Number(item.amount))}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        No items in this invoice
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                    <TableCell>{formatCurrency(Number(invoice.subtotal) || 0)}</TableCell>
                  </TableRow>
                  {Number(invoice.tax) > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Tax ({invoice.tax}%)</TableCell>
                      <TableCell>{formatCurrency((Number(invoice.subtotal) * Number(invoice.tax)) / 100)}</TableCell>
                    </TableRow>
                  )}
                  {Number(invoice.discount) > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Discount ({invoice.discount}%)</TableCell>
                      <TableCell>-{formatCurrency((Number(invoice.subtotal) * Number(invoice.discount)) / 100)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                    <TableCell className="font-bold">{formatCurrency(Number(invoice.total) || 0)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TabsContent>
            
            <TabsContent value="terms" className="mt-4">
              <div className="space-y-6">
                {invoice.terms && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Terms & Conditions</h3>
                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                      {invoice.terms}
                    </div>
                  </div>
                )}

                {invoice.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Notes</h3>
                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                      {invoice.notes}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {invoice.clientSignature && (
              <TabsContent value="signatures" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {invoice.clientSignature && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Client Signature</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <img 
                          src={invoice.clientSignature} 
                          alt="Client Signature" 
                          className="max-h-32"
                        />
                        {invoice.updatedAt && (
                          <p className="text-sm text-gray-500 mt-2">
                            Signed on {formatDate(invoice.updatedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {invoice.contractorSignature && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Contractor Signature</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <img 
                          src={invoice.contractorSignature} 
                          alt="Contractor Signature" 
                          className="max-h-32"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t mt-4 pt-6">
          {shouldShowActionButtons ? (
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto"
                onClick={() => setShowSignatureDialog(true)}
              >
                Sign Invoice
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {invoice.status === 'signed' && "This invoice has been signed."}
              {invoice.status === 'paid' && "This invoice has been paid."}
              {invoice.status === 'cancelled' && "This invoice has been cancelled."}
            </p>
          )}
          
          <p className="text-xs text-gray-500 text-center sm:text-right">
            {invoice.project?.title && `Project: ${invoice.project.title}`}
            <br />
            Invoice generated from Estimate #{invoice.estimateId}
          </p>
        </CardFooter>
      </Card>
      
      {/* Result Dialog */}
      <ResultDialog />
      
      {/* Signature Dialog */}
      <SignatureDialog />
    </div>
  );
}