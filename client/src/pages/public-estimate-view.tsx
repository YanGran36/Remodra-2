import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "../components/ui/dialog";
import { AlertCircle, CheckCircle, XCircle, Send, Loader2, Undo, Check, Pencil, Edit3, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";

// Componente para firmar digitalmente con touchscreen
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
  
  // Detectar si es dispositivo móvil
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);
  
  // Inicializar el canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Configurar el contexto del canvas
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Establecer las dimensiones exactas del canvas
    canvas.width = width;
    canvas.height = height;
    
    // Configurar el contexto de dibujo
    context.lineWidth = lineWidth;
    context.strokeStyle = lineColor;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    
    setCtx(context);
    
    // Limpiar el canvas si es primera renderización
    if (isFirstRender.current) {
      clearCanvas();
      isFirstRender.current = false;
    }
    
    // Si hay un valor previo (por ejemplo, al editar), mostrarlo
    if (value && !hasDrawn) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0);
        setHasDrawn(true);
      };
      image.src = value;
    }
  }, [width, height, lineWidth, lineColor, value]);
  
  // Función para comenzar a dibujar
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    draw(e);
  };
  
  // Función para dibujar
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !ctx) return;
    
    // Prevenir desplazamiento en dispositivos táctiles
    if (e.nativeEvent instanceof TouchEvent) {
      e.preventDefault();
    }
    
    // Obtener coordenadas
    let x: number, y: number;
    
    if ('touches' in e.nativeEvent) {
      // Evento táctil
      const touch = e.nativeEvent.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      x = touch.clientX - (rect?.left || 0);
      y = touch.clientY - (rect?.top || 0);
    } else {
      // Evento de ratón
      const rect = canvasRef.current?.getBoundingClientRect();
      x = e.nativeEvent.clientX - (rect?.left || 0);
      y = e.nativeEvent.clientY - (rect?.top || 0);
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    setHasDrawn(true);
  };
  
  // Función para dejar de dibujar
  const finishDrawing = () => {
    if (!ctx) return;
    
    ctx.beginPath();
    setDrawing(false);
  };
  
  // Función para limpiar el canvas
  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.beginPath();
    setHasDrawn(false);
    onChange('');
  };
  
  // Función para guardar la firma
  const saveSignature = () => {
    if (!canvasRef.current || !hasDrawn) return;
    
    try {
      const dataURL = canvasRef.current.toDataURL('image/png');
      onChange(dataURL);
    } catch (e) {
      console.error('Error al guardar la firma:', e);
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
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-3 w-full justify-center">
        <Button 
          type="button" 
          variant="outline" 
          onClick={clearCanvas}
          className="flex items-center gap-2"
        >
          <Undo className="h-4 w-4" />
          {clearLabel}
        </Button>
        
        <Button 
          type="button" 
          onClick={saveSignature}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          disabled={!hasDrawn}
        >
          <Check className="h-4 w-4" />
          {confirmLabel}
        </Button>
      </div>
      
      {isMobile && (
        <p className="text-sm text-blue-600 mt-3 text-center">
          Use your finger or a stylus to sign
        </p>
      )}
    </div>
  );
}

// Colores personalizados según el estado
const statusColors: Record<string, string> = {
  draft: "bg-gray-400",
  sent: "bg-blue-400",
  accepted: "bg-green-400",
  rejected: "bg-red-400",
  converted: "bg-purple-400"
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <AlertCircle className="h-4 w-4" />,
  sent: <Send className="h-4 w-4" />,
  accepted: <CheckCircle className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
  converted: <CheckCircle className="h-4 w-4" />
};

export default function PublicEstimateView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [estimate, setEstimate] = useState<any>(null);
  const [contractor, setContractor] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  // Ya no necesitamos variables para la firma
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);
  const [actionResult, setActionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/estimates/${id}`);
        
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Estimado no encontrado. Por favor verifique el enlace."
              : "Hubo un problema al cargar el estimado."
          );
        }
        
        const data = await response.json();
        setEstimate(data);
        
        if (data.contractor) {
          setContractor(data.contractor);
        }
        
        if (data.client) {
          setClient(data.client);
        }
        
        setError(null);
      } catch (error) {
        console.error("Error fetching estimate:", error);
        setError(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEstimate();
    }
  }, [id]);

  const handleAction = async (action: 'accept' | 'reject') => {
    if (action === 'reject' && !notes) {
      setError("Por favor, proporcione un motivo para el rechazo.");
      return;
    }

    try {
      setActionInProgress(true);
      setError(null);
      
      const response = await fetch(`/api/public/estimates/${id}/client-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          clientId: client?.id,
          notes: action === 'accept' ? '' : notes
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Hubo un problema al procesar su solicitud");
      }
      
      setEstimate(result.estimate);
      setActionResult({
        success: true,
        message: action === 'accept' 
                      ? "Estimate accepted! Thank you for your confirmation."
            : "Estimate rejected. We have recorded your decision."
      });
      setActionComplete(true);
      
      // Cerrar diálogos
      setAcceptDialogOpen(false);
      setRejectDialogOpen(false);
      
    } catch (error) {
      console.error(`Error ${action === 'accept' ? 'accepting' : 'rejecting'} estimate:`, error);
      setActionResult({
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido"
      });
    } finally {
      setActionInProgress(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Number(value));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-amber-400" />
          <p className="text-lg text-slate-200">Loading estimate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="w-full max-w-3xl shadow-lg remodra-card">
          <CardHeader className="bg-red-900/20 border-red-500/20">
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Error
            </CardTitle>
            <CardDescription className="text-slate-300">Could not load the estimate</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-lg text-center mb-6 text-slate-200">{error}</p>
            <div className="flex justify-center">
              <Button onClick={() => window.location.reload()} className="remodra-button">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="w-full max-w-3xl shadow-lg remodra-card">
          <CardHeader>
            <CardTitle className="text-amber-400">Estimate Not Found</CardTitle>
            <CardDescription className="text-slate-300">Could not find the requested estimate</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-200">The estimate you are looking for does not exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si ya se ha tomado acción y se ha completado la acción actual
  if (actionComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="w-full max-w-4xl shadow-lg remodra-card">
          <CardHeader className={
            estimate.status === "accepted" || actionResult?.success
              ? "bg-green-900/20 border-green-500/20"
              : estimate.status === "rejected"
              ? "bg-red-900/20 border-red-500/20"
              : "bg-blue-900/20 border-blue-500/20"
          }>
            <CardTitle className={
              estimate.status === "accepted" || actionResult?.success
                ? "text-green-400 flex items-center gap-2"
                : estimate.status === "rejected"
                ? "text-red-400 flex items-center gap-2"
                : "text-blue-400 flex items-center gap-2"
            }>
              {estimate.status === "accepted" && <CheckCircle className="h-6 w-6" />}
              {estimate.status === "rejected" && <XCircle className="h-6 w-6" />}
              {estimate.status !== "accepted" && estimate.status !== "rejected" && <AlertCircle className="h-6 w-6" />}
              
              {estimate.status === "accepted" && "Estimate Accepted"}
              {estimate.status === "rejected" && "Estimate Rejected"}
              {estimate.status !== "accepted" && estimate.status !== "rejected" && "Current Status"}
            </CardTitle>
            <CardDescription className="text-slate-300">
              {estimate.status === "accepted" && "This estimate has been accepted."}
              {estimate.status === "rejected" && "This estimate has been rejected."}
              {estimate.status === "draft" && "This estimate is in draft."}
              {estimate.status === "converted" && "This estimate has been converted to invoice."}
              {estimate.status === "sent" && actionComplete && actionResult?.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-amber-400">Estimate Details</h3>
                <p className="text-slate-200"><span className="font-medium text-slate-300">Number:</span> {estimate.estimateNumber}</p>
                <p className="text-slate-200"><span className="font-medium text-slate-300">Date:</span> {estimate.issueDate ? format(new Date(estimate.issueDate), 'dd/MM/yyyy') : 'Not available'}</p>
                <p className="text-slate-200"><span className="font-medium text-slate-300">Expiration:</span> {estimate.expiryDate ? format(new Date(estimate.expiryDate), 'dd/MM/yyyy') : 'Not available'}</p>
                <p className="flex items-center gap-1">
                  <span className="font-medium text-slate-300">Status:</span> 
                  <Badge className={`${statusColors[estimate.status]} text-white flex gap-1 items-center`}>
                    {statusIcons[estimate.status]} 
                    {estimate.status === 'draft' && 'Draft'}
                    {estimate.status === 'sent' && 'Sent'}
                    {estimate.status === 'accepted' && 'Accepted'}
                    {estimate.status === 'rejected' && 'Rejected'}
                    {estimate.status === 'converted' && 'Converted'}
                  </Badge>
                </p>
              </div>
              <div>
                {contractor && (
                  <>
                    <h3 className="text-lg font-semibold mb-2 text-amber-400">Contractor</h3>
                    <p className="text-slate-200">{contractor.companyName || `${contractor.firstName} ${contractor.lastName}`}</p>
                    <p className="text-slate-200">{contractor.email}</p>
                    <p className="text-slate-200">{contractor.phone}</p>
                  </>
                )}
                <div className="mt-4">
                  {client && (
                    <>
                      <h3 className="text-lg font-semibold mb-2 text-amber-400">Client</h3>
                      <p className="text-slate-200">{client.firstName} {client.lastName}</p>
                      <p className="text-slate-200">{client.email}</p>
                      <p className="text-slate-200">{client.phone}</p>
                      <p className="text-slate-200">{client.address}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            <div>
              <h3 className="text-lg font-semibold mb-4 text-amber-400">Item Details</h3>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-600">
                    <TableHead className="text-slate-200">Description</TableHead>
                    <TableHead className="text-right text-slate-200">Quantity</TableHead>
                    <TableHead className="text-right text-slate-200">Unit Price</TableHead>
                    <TableHead className="text-right text-slate-200">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimate.items?.map((item: any) => (
                    <TableRow key={item.id} className="border-slate-600">
                      <TableCell className="font-medium text-slate-200">{item.description}</TableCell>
                      <TableCell className="text-right text-slate-200">{item.quantity}</TableCell>
                      <TableCell className="text-right text-slate-200">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right text-slate-200">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-200">Subtotal:</span>
                  <span className="text-slate-200">{formatCurrency(estimate.subtotal)}</span>
                </div>
                {Number(estimate.tax) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-200">Tax ({estimate.tax}%):</span>
                    <span className="text-slate-200">{formatCurrency((Number(estimate.subtotal) * Number(estimate.tax) / 100))}</span>
                  </div>
                )}
                {Number(estimate.discount) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-200">Discount ({estimate.discount}%):</span>
                    <span className="text-slate-200">-{formatCurrency((Number(estimate.subtotal) * Number(estimate.discount) / 100))}</span>
                  </div>
                )}
                <Separator className="my-2 bg-slate-600" />
                <div className="flex justify-between py-1 font-bold">
                  <span className="text-amber-400">Total:</span>
                  <span className="text-amber-400">{formatCurrency(estimate.total)}</span>
                </div>
              </div>
            </div>

            {estimate.terms && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-amber-400">Terms</h3>
                <div className="bg-slate-800/50 p-4 rounded-md whitespace-pre-wrap text-slate-200 border border-slate-600">
                  {estimate.terms}
                </div>
              </div>
            )}

            {estimate.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-amber-400">Notes</h3>
                <div className="bg-slate-800/50 p-4 rounded-md whitespace-pre-wrap text-slate-200 border border-slate-600">
                  {estimate.notes}
                </div>
              </div>
            )}

            {estimate.clientSignature && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-amber-400">Signed by client</h3>
                <div className="bg-slate-800/50 p-4 rounded-md text-slate-200 border border-slate-600">
                  {estimate.clientSignature}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800/50 p-6 border-t border-slate-600">
            <p className="text-sm text-slate-300">
              {estimate.status === "accepted" && "This estimate has been accepted."}
              {estimate.status === "rejected" && "This estimate has been rejected."}
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Si todavía no se ha tomado acción (estimate.status === 'sent')
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-4xl relative">
        {/* Efecto de sombra decorativa */}
        <div className="absolute -top-4 -left-4 w-full h-full bg-slate-700 rounded-lg opacity-30 hidden sm:block" style={{transform: 'rotate(1deg)'}}></div>
        <div className="absolute -bottom-4 -right-4 w-full h-full bg-slate-600 rounded-lg opacity-30 hidden sm:block" style={{transform: 'rotate(-1deg)'}}></div>
        
        <Card className="w-full shadow-xl relative z-10 border border-slate-600 overflow-hidden remodra-card">
          <CardHeader className="bg-slate-800/50 border-b border-slate-600">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-amber-400 flex items-center gap-2 text-2xl">
                  <Send className="h-6 w-6" />
                  Estimate for Your Approval
                </CardTitle>
                <CardDescription className="text-lg mt-2 text-slate-300">
                  <span className="font-medium">{contractor?.companyName || `${contractor?.firstName} ${contractor?.lastName}`}</span> has sent you an estimate for review.
                </CardDescription>
              </div>
              <div className="flex">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg h-auto rounded-xl shadow-lg transition-all hover:shadow-xl animate-pulse"
                  onClick={() => setAcceptDialogOpen(true)}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approve Estimate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-amber-400">Estimate Details</h3>
                <p className="text-slate-200"><span className="font-medium text-slate-300">Number:</span> {estimate.estimateNumber}</p>
                <p className="text-slate-200"><span className="font-medium text-slate-300">Date:</span> {estimate.issueDate ? format(new Date(estimate.issueDate), 'dd/MM/yyyy') : 'Not available'}</p>
                <p className="text-slate-200"><span className="font-medium text-slate-300">Expiration:</span> {estimate.expiryDate ? format(new Date(estimate.expiryDate), 'dd/MM/yyyy') : 'Not available'}</p>
                <p className="flex items-center gap-1">
                  <span className="font-medium text-slate-300">Status:</span> 
                  <Badge className={`${statusColors[estimate.status]} text-white flex gap-1 items-center`}>
                    {statusIcons[estimate.status]} 
                    {estimate.status === 'draft' && 'Draft'}
                    {estimate.status === 'sent' && 'Sent'}
                    {estimate.status === 'accepted' && 'Accepted'}
                    {estimate.status === 'rejected' && 'Rejected'}
                    {estimate.status === 'converted' && 'Converted'}
                  </Badge>
                </p>
              </div>
              <div>
                {contractor && (
                  <>
                    <h3 className="text-lg font-semibold mb-2 text-amber-400">Contractor</h3>
                    <p className="text-slate-200">{contractor.companyName || `${contractor.firstName} ${contractor.lastName}`}</p>
                    <p className="text-slate-200">{contractor.email}</p>
                    <p className="text-slate-200">{contractor.phone}</p>
                  </>
                )}
                <div className="mt-4">
                  {client && (
                    <>
                      <h3 className="text-lg font-semibold mb-2 text-amber-400">Client</h3>
                      <p className="text-slate-200">{client.firstName} {client.lastName}</p>
                      <p className="text-slate-200">{client.email}</p>
                      <p className="text-slate-200">{client.phone}</p>
                      <p className="text-slate-200">{client.address}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            <div>
              <h3 className="text-lg font-semibold mb-4 text-amber-400">Item Details</h3>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-600">
                    <TableHead className="text-slate-200">Description</TableHead>
                    <TableHead className="text-right text-slate-200">Quantity</TableHead>
                    <TableHead className="text-right text-slate-200">Unit Price</TableHead>
                    <TableHead className="text-right text-slate-200">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimate.items?.map((item: any) => (
                    <TableRow key={item.id} className="border-slate-600">
                      <TableCell className="font-medium text-slate-200">{item.description}</TableCell>
                      <TableCell className="text-right text-slate-200">{item.quantity}</TableCell>
                      <TableCell className="text-right text-slate-200">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right text-slate-200">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-200">Subtotal:</span>
                  <span className="text-slate-200">{formatCurrency(estimate.subtotal)}</span>
                </div>
                {Number(estimate.tax) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-200">Tax ({estimate.tax}%):</span>
                    <span className="text-slate-200">{formatCurrency((Number(estimate.subtotal) * Number(estimate.tax) / 100))}</span>
                  </div>
                )}
                {Number(estimate.discount) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-200">Discount ({estimate.discount}%):</span>
                    <span className="text-slate-200">-{formatCurrency((Number(estimate.subtotal) * Number(estimate.discount) / 100))}</span>
                  </div>
                )}
                <Separator className="my-2 bg-slate-600" />
                <div className="flex justify-between py-1 font-bold">
                  <span className="text-amber-400">Total:</span>
                  <span className="text-amber-400">{formatCurrency(estimate.total)}</span>
                </div>
              </div>
            </div>

            {estimate.terms && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-amber-400">Terms</h3>
                <div className="bg-slate-800/50 p-4 rounded-md whitespace-pre-wrap text-slate-200 border border-slate-600">
                  {estimate.terms}
                </div>
              </div>
            )}

            {estimate.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Notes</h3>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                  {estimate.notes}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
                {error}
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
                <ClipboardCheck className="h-6 w-6" />
                Estimate Review
              </h3>
              <div className="border-l-4 border-blue-400 pl-4 mb-4">
                <p className="text-blue-800">
                  Please carefully review the estimate before making a decision.
                </p>
                <p className="text-blue-700 mt-2">
                  <strong>Important note:</strong> By accepting this estimate, an invoice will be automatically generated that will require your signature to proceed with payment.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 bg-gradient-to-b from-blue-50 to-blue-100 p-8 border-t border-blue-200">
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold text-blue-800">Do you agree with this estimate?</h3>
              <p className="text-blue-600 mt-1">Select one of the following options:</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-2xl mx-auto">
              <Button
                onClick={() => setRejectDialogOpen(true)}
                className="w-full sm:w-1/3 bg-red-600 hover:bg-red-700 text-white py-8 text-xl h-auto rounded-lg shadow-lg transition-all hover:shadow-xl relative overflow-hidden border-2 border-red-500"
              >
                <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                  <div className="animate-pulse bg-white/5 w-full h-full"></div>
                </div>
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <XCircle className="h-6 w-6" />
                  <span>REJECT ESTIMATE</span>
                </div>
              </Button>
              
              <Button
                onClick={() => setAcceptDialogOpen(true)}
                className="w-full sm:w-2/3 bg-green-600 hover:bg-green-700 text-white py-8 text-xl h-auto rounded-lg shadow-lg transition-all hover:shadow-xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                  <div className="animate-pulse bg-white/5 w-full h-full"></div>
                </div>
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  <span>APPROVE ESTIMATE</span>
                </div>
              </Button>
            </div>
            

          </CardFooter>
        </Card>

        {/* Diálogo de aceptación */}
        <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl text-green-700 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Confirm Approval
              </DialogTitle>
              <DialogDescription className="text-base">
                By approving this estimate, you are authorizing the contractor to proceed with the work.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-800 font-medium">Total to pay:</span>
                  <span className="text-2xl font-bold text-green-800">{formatCurrency(estimate.total)}</span>
                </div>
                <p className="text-sm text-green-700">
                  This is the total amount agreed for the work described in this estimate.
                </p>
              </div>
              
              <div className="border-t border-b border-gray-200 py-4">
                <p className="font-medium mb-1">Important information:</p>
                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                  <p className="text-sm text-blue-800">
                    By accepting this estimate, an invoice will be automatically generated that will require your signature to proceed with payment.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setAcceptDialogOpen(false)}
                disabled={actionInProgress}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleAction('accept')}
                disabled={actionInProgress}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-lg"
              >
                {actionInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Approve Estimate
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de rechazo */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl text-red-700 flex items-center gap-2">
                <XCircle className="h-6 w-6" />
                Confirm Rejection
              </DialogTitle>
              <DialogDescription className="text-base">
                Please help us improve by indicating the reason for your rejection.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="font-medium text-red-800 mb-2">Reason for rejection:</p>
                <Textarea
                  placeholder="Please briefly explain why you are not satisfied with this estimate..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px] border-red-200 focus:border-red-400 focus:ring-red-400"
                />
                {!notes && (
                  <p className="text-sm text-red-600 mt-2">
                    * This field is required to reject the estimate
                  </p>
                )}
              </div>
              
              <div className="border-t border-gray-200 py-4">
                <p className="text-gray-500 text-sm italic">
                  Your comments will help the contractor improve their services. Thank you for your feedback.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-3 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setRejectDialogOpen(false)}
                disabled={actionInProgress}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleAction('reject')}
                disabled={actionInProgress || !notes}
                className="w-full sm:w-auto text-lg"
              >
                {actionInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-5 w-5" />
                    Reject Estimate
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}