import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Upload, Pencil, Ruler, Maximize, Square, Save, FileImage, Camera, Undo, Redo, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Measurement {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number; // in pixels
  realLength: number; // in real-world unit (feet, meters, etc.)
  unit: string;
  label: string;
}

interface DigitalMeasurementProps {
  initialScale?: number;
  unit?: string;
  onMeasurementsChange?: (measurements: Measurement[]) => void;
  initialMeasurements?: any[];
  canvasWidth?: number;
  canvasHeight?: number;
}

export default function DigitalMeasurement({
  initialScale = 1,
  unit = "ft",
  onMeasurementsChange,
  initialMeasurements = [],
  canvasWidth = 800,
  canvasHeight = 600
}: DigitalMeasurementProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>(() => {
    // Initialize with provided measurements if available
    if (initialMeasurements && initialMeasurements.length > 0) {
      return initialMeasurements as Measurement[];
    }
    return [];
  });
  const [activeTool, setActiveTool] = useState<string>("line");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState<Partial<Measurement> | null>(null);
  const [scale, setScale] = useState<number>(initialScale); // pixels per unit
  const [activeTab, setActiveTab] = useState("draw");
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationLength, setCalibrationLength] = useState<number>(10); // Default 10 feet
  
  // Initialize the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image if available
    if (backgroundImage) {
      const aspectRatio = backgroundImage.width / backgroundImage.height;
      let drawWidth, drawHeight;
      
      if (backgroundImage.width > backgroundImage.height) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / aspectRatio;
      } else {
        drawHeight = canvas.height;
        drawWidth = canvas.height * aspectRatio;
      }
      
      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;
      
      ctx.drawImage(backgroundImage, x, y, drawWidth, drawHeight);
    }
    
    // Draw all measurements
    measurements.forEach(measurement => {
      drawMeasurement(ctx, measurement);
    });
    
    // Draw current measurement being drawn
    if (isDrawing && currentMeasurement) {
      drawCurrentMeasurement(ctx);
    }
  }, [measurements, isDrawing, currentMeasurement, backgroundImage]);
  
  // Notify parent component when measurements change
  useEffect(() => {
    if (onMeasurementsChange) {
      onMeasurementsChange(measurements);
    }
  }, [measurements, onMeasurementsChange]);
  
  const drawMeasurement = (ctx: CanvasRenderingContext2D, measurement: Measurement) => {
    const { startX, startY, endX, endY, label } = measurement;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = "#FF5722";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw endpoints
    ctx.beginPath();
    ctx.arc(startX, startY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#FF5722";
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(endX, endY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#FF5722";
    ctx.fill();
    
    // Draw label
    ctx.font = "14px Arial";
    ctx.fillStyle = "#000000";
    
    // Calculate midpoint of the line
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    // Adjust text position to avoid overlap with the line
    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx);
    const offset = 15; // Offset distance from the line
    
    const textX = midX + Math.sin(angle) * offset;
    const textY = midY - Math.cos(angle) * offset;
    
    ctx.fillText(label, textX, textY);
  };
  
  const drawCurrentMeasurement = (ctx: CanvasRenderingContext2D) => {
    if (!currentMeasurement || currentMeasurement.startX === undefined || currentMeasurement.startY === undefined || 
        currentMeasurement.endX === undefined || currentMeasurement.endY === undefined) return;
    
    const { startX, startY, endX, endY } = currentMeasurement;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = "#FF5722";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw endpoints
    ctx.beginPath();
    ctx.arc(startX, startY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#FF5722";
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(endX, endY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#FF5722";
    ctx.fill();
    
    // Calculate length in pixels
    const dx = endX - startX;
    const dy = endY - startY;
    const pixelLength = Math.sqrt(dx * dx + dy * dy);
    
    // Convert to real-world units
    const realLength = pixelLength / scale;
    
    // Draw temporary label
    ctx.font = "14px Arial";
    ctx.fillStyle = "#000000";
    
    // Calculate midpoint of the line
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    // Adjust text position to avoid overlap with the line
    const angle = Math.atan2(dy, dx);
    const offset = 15; // Offset distance from the line
    
    const textX = midX + Math.sin(angle) * offset;
    const textY = midY - Math.cos(angle) * offset;
    
    ctx.fillText(`${realLength.toFixed(2)} ${unit}`, textX, textY);
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== "line" && activeTool !== "measure") return;
    
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentMeasurement({
      startX: x,
      startY: y,
      endX: x,
      endY: y
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentMeasurement) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentMeasurement({
      ...currentMeasurement,
      endX: x,
      endY: y
    });
  };
  
  const handleMouseUp = () => {
    if (!isDrawing || !currentMeasurement || 
        currentMeasurement.startX === undefined || currentMeasurement.startY === undefined || 
        currentMeasurement.endX === undefined || currentMeasurement.endY === undefined) {
      setIsDrawing(false);
      setCurrentMeasurement(null);
      return;
    }
    
    const { startX, startY, endX, endY } = currentMeasurement;
    
    // Calculate length in pixels
    const dx = endX - startX;
    const dy = endY - startY;
    const pixelLength = Math.sqrt(dx * dx + dy * dy);
    
    // Ignore very small measurements (likely accidental clicks)
    if (pixelLength < 5) {
      setIsDrawing(false);
      setCurrentMeasurement(null);
      return;
    }
    
    // Convert to real-world units
    const realLength = pixelLength / scale;
    
    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      startX,
      startY,
      endX,
      endY,
      length: pixelLength,
      realLength,
      unit,
      label: `${realLength.toFixed(2)} ${unit}`
    };
    
    if (calibrationMode) {
      // This is a calibration measurement
      const newScale = pixelLength / calibrationLength;
      setScale(newScale);
      setCalibrationMode(false);
      
      toast({
        title: "Calibración completada",
        description: `Escala establecida a ${newScale.toFixed(2)} píxeles por ${unit}`,
      });
      
      // Don't add the calibration measurement to the list
    } else {
      // Add the measurement to the list
      setMeasurements([...measurements, newMeasurement]);
    }
    
    setIsDrawing(false);
    setCurrentMeasurement(null);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          setBackgroundImage(img);
          
          toast({
            title: "Imagen cargada",
            description: "La imagen se ha cargado correctamente. Puede comenzar a tomar medidas.",
          });
          
          // Switch to calibration mode
          setCalibrationMode(true);
          setActiveTool("measure");
          setActiveTab("measure");
        };
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleClear = () => {
    setMeasurements([]);
    
    toast({
      title: "Mediciones borradas",
      description: "Todas las mediciones han sido eliminadas.",
    });
  };
  
  const handleStartCalibration = () => {
    setCalibrationMode(true);
    setActiveTool("measure");
    setActiveTab("measure");
    
    toast({
      title: "Modo de calibración activado",
      description: `Dibuje una línea en la imagen con una medida conocida de ${calibrationLength} ${unit}`,
    });
  };
  
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'property-measurement.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Imagen descargada",
      description: "La imagen con las mediciones ha sido descargada.",
    });
  };
  
  const handleCalibrationLengthChange = (value: number[]) => {
    setCalibrationLength(value[0]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Medición Digital</CardTitle>
        <CardDescription>
          Cargue una imagen y tome medidas precisas para sus estimaciones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="draw">Dibujo</TabsTrigger>
            <TabsTrigger value="measure">Medición</TabsTrigger>
          </TabsList>
          
          <TabsContent value="draw" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button 
                variant={activeTool === "line" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveTool("line")}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Línea
              </Button>
              <Button 
                variant={activeTool === "eraser" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveTool("eraser")}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Borrador
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClear}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar Todo
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="measure" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button 
                variant={activeTool === "measure" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveTool("measure")}
              >
                <Ruler className="h-4 w-4 mr-2" />
                Medir
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleStartCalibration}
              >
                <Maximize className="h-4 w-4 mr-2" />
                Calibrar
              </Button>
            </div>
            
            {calibrationMode && (
              <div className="mb-4 p-3 border rounded-md bg-muted">
                <Label>Longitud conocida ({unit})</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[calibrationLength]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={handleCalibrationLengthChange}
                    className="flex-1"
                  />
                  <span className="font-medium">{calibrationLength} {unit}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Dibuje una línea en la imagen con una medida conocida de {calibrationLength} {unit}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 border rounded-md overflow-hidden">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="w-full h-auto bg-white cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Cancel if mouse leaves the canvas
          />
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Cargar Imagen
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!backgroundImage && measurements.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </div>
        
        {measurements.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Mediciones ({measurements.length})</h3>
            <div className="text-sm space-y-1">
              {measurements.map(m => (
                <div key={m.id} className="px-2 py-1 bg-muted rounded-sm flex justify-between">
                  <span>Medida {m.id.slice(-4)}</span>
                  <span className="font-medium">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Escala: {scale.toFixed(2)} píxeles por {unit}
        </div>
      </CardFooter>
    </Card>
  );
}