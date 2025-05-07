import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Circle, Rect, Text } from "react-konva";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Upload, Pencil, Ruler, Maximize, Square, Save, FileImage, Camera, Undo, Redo, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Point {
  x: number;
  y: number;
}

interface Line {
  points: number[];
  tool: string;
  id: string;
  color: string;
}

interface Measurement {
  id: string;
  points: number[];
  length: number; // in pixels
  realLength: number; // in real-world unit (feet, meters, etc.)
  unit: string;
  label: string;
}

interface DigitalMeasurementProps {
  initialScale?: number;
  unit?: string;
  onMeasurementsChange?: (measurements: Measurement[]) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

export default function DigitalMeasurement({
  initialScale = 1,
  unit = "ft",
  onMeasurementsChange,
  canvasWidth = 800,
  canvasHeight = 600
}: DigitalMeasurementProps) {
  const { toast } = useToast();
  const stageRef = useRef<any>(null);
  const [tool, setTool] = useState<string>("pen");
  const [lines, setLines] = useState<Line[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#FF5722");
  const [history, setHistory] = useState<Line[][]>([]);
  const [redoStack, setRedoStack] = useState<Line[][]>([]);
  const [backgroundImage, setBackgroundImage] = useState<any>(null);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationLength, setCalibrationLength] = useState<number>(10); // Default 10 feet
  const [scale, setScale] = useState<number>(initialScale); // pixels per unit
  const [activeTab, setActiveTab] = useState("draw");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save current state to history when lines change
  useEffect(() => {
    if (lines.length > 0 && !isDrawing) {
      setHistory(prevHistory => [...prevHistory, [...lines]]);
      setRedoStack([]);
    }
  }, [lines, isDrawing]);

  // Notify parent component when measurements change
  useEffect(() => {
    if (onMeasurementsChange) {
      onMeasurementsChange(measurements);
    }
  }, [measurements, onMeasurementsChange]);

  const handleMouseDown = (e: any) => {
    if (tool === "eraser") return; // Handle eraser differently

    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    
    if (tool === "pen" || tool === "line") {
      setLines([...lines, { points: [pos.x, pos.y], tool, id: Date.now().toString(), color: currentColor }]);
    } else if (tool === "measure" && !calibrationMode) {
      // Start a new measurement
      const newMeasurement: Measurement = {
        id: Date.now().toString(),
        points: [pos.x, pos.y, pos.x, pos.y], // initial and current point (same at start)
        length: 0,
        realLength: 0,
        unit,
        label: ""
      };
      setMeasurements([...measurements, newMeasurement]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    if (tool === "pen") {
      let lastLine = lines[lines.length - 1];
      if (lastLine) {
        // Add point to the last line
        lastLine.points = lastLine.points.concat([point.x, point.y]);
        // Replace last line
        const newLines = [...lines];
        newLines[lines.length - 1] = lastLine;
        setLines(newLines);
      }
    } else if (tool === "line") {
      let lastLine = lines[lines.length - 1];
      if (lastLine) {
        // For line, we only keep start and end points
        const startX = lastLine.points[0];
        const startY = lastLine.points[1];
        // Replace last line
        const newLines = [...lines];
        newLines[lines.length - 1] = {
          ...lastLine,
          points: [startX, startY, point.x, point.y]
        };
        setLines(newLines);
      }
    } else if (tool === "measure" && measurements.length > 0) {
      // Update the end point of the last measurement
      const newMeasurements = [...measurements];
      const lastMeasurement = newMeasurements[newMeasurements.length - 1];
      lastMeasurement.points[2] = point.x;
      lastMeasurement.points[3] = point.y;
      
      // Calculate length in pixels
      const dx = lastMeasurement.points[2] - lastMeasurement.points[0];
      const dy = lastMeasurement.points[3] - lastMeasurement.points[1];
      lastMeasurement.length = Math.sqrt(dx * dx + dy * dy);
      
      // Convert to real-world unit
      lastMeasurement.realLength = lastMeasurement.length / scale;
      
      setMeasurements(newMeasurements);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    
    // After completing a measurement, automatically enter text edit mode
    if (tool === "measure" && measurements.length > 0) {
      const lastMeasurement = measurements[measurements.length - 1];
      // You could open a dialog or focus a text input here
      if (lastMeasurement.realLength < 0.1) {
        // Remove tiny measurements (likely accidental clicks)
        setMeasurements(measurements.slice(0, -1));
      } else {
        // Round to 2 decimal places
        const newMeasurements = [...measurements];
        const lastMeasurement = newMeasurements[newMeasurements.length - 1];
        lastMeasurement.realLength = Math.round(lastMeasurement.realLength * 100) / 100;
        lastMeasurement.label = `${lastMeasurement.realLength.toFixed(2)} ${unit}`;
        setMeasurements(newMeasurements);
      }
    }
  };

  const handleEraserClick = (e: any) => {
    if (tool !== "eraser") return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    
    // Check if we hit a line or measurement
    // For simplicity, we'll just find the closest point on any line
    // A more sophisticated approach would check for proximity to line segments
    
    // Check lines
    const newLines = [...lines];
    let modified = false;
    
    for (let i = newLines.length - 1; i >= 0; i--) {
      const line = newLines[i];
      
      // For pen tool (multiple points)
      if (line.tool === "pen") {
        for (let j = 0; j < line.points.length; j += 2) {
          const dx = line.points[j] - pos.x;
          const dy = line.points[j + 1] - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 10) { // Eraser radius
            // Remove the line
            newLines.splice(i, 1);
            modified = true;
            break;
          }
        }
      } 
      // For line tool (just start and end)
      else if (line.tool === "line") {
        // Check start point
        let dx = line.points[0] - pos.x;
        let dy = line.points[1] - pos.y;
        let distanceStart = Math.sqrt(dx * dx + dy * dy);
        
        // Check end point
        dx = line.points[2] - pos.x;
        dy = line.points[3] - pos.y;
        let distanceEnd = Math.sqrt(dx * dx + dy * dy);
        
        if (distanceStart < 10 || distanceEnd < 10) {
          // Remove the line
          newLines.splice(i, 1);
          modified = true;
        }
      }
      
      if (modified) break; // Only remove one at a time
    }
    
    // Check measurements
    const newMeasurements = [...measurements];
    let measurementModified = false;
    
    for (let i = newMeasurements.length - 1; i >= 0; i--) {
      const measurement = newMeasurements[i];
      
      // Check start point
      let dx = measurement.points[0] - pos.x;
      let dy = measurement.points[1] - pos.y;
      let distanceStart = Math.sqrt(dx * dx + dy * dy);
      
      // Check end point
      dx = measurement.points[2] - pos.x;
      dy = measurement.points[3] - pos.y;
      let distanceEnd = Math.sqrt(dx * dx + dy * dy);
      
      if (distanceStart < 10 || distanceEnd < 10) {
        // Remove the measurement
        newMeasurements.splice(i, 1);
        measurementModified = true;
        break;
      }
    }
    
    if (modified) {
      setLines(newLines);
      setHistory(prevHistory => [...prevHistory, [...newLines]]);
      setRedoStack([]);
    }
    
    if (measurementModified) {
      setMeasurements(newMeasurements);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    setRedoStack([...redoStack, [...lines]]);
    setLines(previousState);
    setHistory(newHistory);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    
    setHistory([...history, [...lines]]);
    setLines(nextState);
    setRedoStack(newRedoStack);
  };

  const handleClear = () => {
    setHistory([...history, [...lines]]);
    setLines([]);
    setMeasurements([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.src = reader.result as string;
        img.onload = () => {
          // Calculate scaling to fit the canvas
          const aspectRatio = img.width / img.height;
          let newWidth, newHeight;
          
          if (img.width > img.height) {
            newWidth = canvasWidth;
            newHeight = canvasWidth / aspectRatio;
          } else {
            newHeight = canvasHeight;
            newWidth = canvasHeight * aspectRatio;
          }
          
          // Center the image
          const imageObj = {
            image: img,
            x: (canvasWidth - newWidth) / 2,
            y: (canvasHeight - newHeight) / 2,
            width: newWidth,
            height: newHeight
          };
          
          setBackgroundImage(imageObj);
          
          toast({
            title: "Imagen cargada",
            description: "La imagen se ha cargado correctamente. Puede comenzar a tomar medidas.",
          });
          
          // Switch to calibration mode
          setCalibrationMode(true);
          setTool("measure");
          setActiveTab("measure");
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartCalibration = () => {
    setCalibrationMode(true);
    setTool("measure");
    setActiveTab("measure");
    
    toast({
      title: "Modo de calibración activado",
      description: "Dibuje una línea en la imagen con una medida conocida",
    });
  };

  const handleSetCalibration = () => {
    if (measurements.length === 0) {
      toast({
        title: "Error de calibración",
        description: "Primero debe dibujar una línea de medición de referencia",
        variant: "destructive",
      });
      return;
    }
    
    const calibrationMeasurement = measurements[measurements.length - 1];
    const pixelLength = calibrationMeasurement.length;
    
    // Calculate pixels per unit
    const newScale = pixelLength / calibrationLength;
    setScale(newScale);
    
    // Recalculate all measurements with the new scale
    const newMeasurements = measurements.map(m => {
      const dx = m.points[2] - m.points[0];
      const dy = m.points[3] - m.points[1];
      const length = Math.sqrt(dx * dx + dy * dy);
      const realLength = length / newScale;
      return {
        ...m,
        length,
        realLength: Math.round(realLength * 100) / 100,
        label: `${(realLength).toFixed(2)} ${unit}`
      };
    });
    
    setMeasurements(newMeasurements);
    setCalibrationMode(false);
    
    toast({
      title: "Calibración completada",
      description: `Escala configurada a 1 ${unit} = ${newScale.toFixed(2)} píxeles`,
    });
  };

  const handleSaveImage = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL();
      const link = document.createElement('a');
      link.download = `mediciones-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Imagen guardada",
        description: "Las mediciones se han guardado como imagen",
      });
    }
  };

  const handleSaveMeasurements = () => {
    const data = {
      measurements,
      scale,
      unit,
      imageData: backgroundImage ? backgroundImage.image.src : null
    };
    
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `mediciones-${new Date().toISOString().slice(0, 10)}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Mediciones guardadas",
      description: "Los datos de medición se han guardado como archivo JSON",
    });
  };

  const calculateArea = () => {
    // Simple area calculation - assuming a rectangle defined by 4 points
    if (measurements.length < 4) {
      toast({
        title: "No hay suficientes mediciones",
        description: "Se necesitan al menos 4 puntos para calcular un área",
        variant: "destructive",
      });
      return;
    }
    
    // Take the last 4 measurements and assume they form a rectangle
    const lastFour = measurements.slice(-4);
    
    // Calculate width and height (assuming rectangular area)
    // This is a simplification - a more robust solution would detect polygons
    const width = lastFour[0].realLength;
    const height = lastFour[1].realLength;
    
    const area = width * height;
    toast({
      title: "Área calculada",
      description: `El área es aproximadamente ${area.toFixed(2)} ${unit}²`,
    });
  };

  // Function to trigger file input click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Medición Digital</CardTitle>
        <CardDescription>
          Dibuje, mida y calcule áreas sobre imágenes o en un lienzo en blanco
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="draw">Dibujo</TabsTrigger>
            <TabsTrigger value="measure">Medición</TabsTrigger>
            <TabsTrigger value="calculate">Cálculos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="draw" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={tool === "pen" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("pen")}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Lápiz
              </Button>
              <Button
                variant={tool === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("line")}
              >
                <Ruler className="h-4 w-4 mr-1" />
                Línea
              </Button>
              <Button
                variant={tool === "eraser" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("eraser")}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Borrador
              </Button>
              <div className="flex items-center space-x-2 ml-2">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: currentColor }}></div>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  className="w-8 h-8"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={history.length === 0}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="measure" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={tool === "measure" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("measure")}
              >
                <Ruler className="h-4 w-4 mr-1" />
                Medir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
              >
                <FileImage className="h-4 w-4 mr-1" />
                Cargar Imagen
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            {calibrationMode ? (
              <div className="space-y-4 p-3 border rounded-md bg-muted">
                <h3 className="text-sm font-medium">Calibración</h3>
                <p className="text-sm text-muted-foreground">
                  Dibuje una línea de referencia en la imagen y especifique su longitud real
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={calibrationLength}
                    onChange={(e) => setCalibrationLength(parseFloat(e.target.value))}
                    className="w-24"
                  />
                  <span>{unit}</span>
                  <Button onClick={handleSetCalibration} size="sm">
                    Calibrar
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleStartCalibration} variant="outline" size="sm">
                Calibrar Escala
              </Button>
            )}
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Mediciones Actuales</h3>
              {measurements.length > 0 ? (
                <div className="space-y-1">
                  {measurements.map((m, i) => (
                    <div key={m.id} className="text-sm flex justify-between items-center">
                      <span>Medida {i + 1}: {m.realLength.toFixed(2)} {unit}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newMeasurements = [...measurements];
                          newMeasurements.splice(i, 1);
                          setMeasurements(newMeasurements);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay mediciones aún</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="calculate" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={calculateArea} disabled={measurements.length < 2}>
                <Square className="h-4 w-4 mr-1" />
                Calcular Área
              </Button>
              <Button onClick={handleSaveMeasurements}>
                <Save className="h-4 w-4 mr-1" />
                Guardar Datos
              </Button>
              <Button onClick={handleSaveImage} variant="outline">
                <Camera className="h-4 w-4 mr-1" />
                Exportar Imagen
              </Button>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2">Escala Actual</h3>
              <p className="text-sm">1 {unit} = {scale.toFixed(2)} píxeles</p>
              {measurements.length > 0 && (
                <div className="mt-2">
                  <h3 className="text-sm font-medium mb-1">Sumario de Mediciones</h3>
                  <p className="text-sm">Total de longitudes: {
                    measurements.reduce((sum, m) => sum + m.realLength, 0).toFixed(2)
                  } {unit}</p>
                  {measurements.length >= 2 && (
                    <p className="text-sm">
                      Área aproximada: {
                        (measurements[0].realLength * measurements[1].realLength).toFixed(2)
                      } {unit}²
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div 
          style={{ 
            width: `${canvasWidth}px`, 
            height: `${canvasHeight}px`,
            margin: '0 auto',
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'hidden',
            background: '#f9f9f9'
          }}
          className="touch-none"
        >
          <Stage
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={tool === "eraser" ? handleEraserClick : handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={tool === "eraser" ? handleEraserClick : handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            ref={stageRef}
          >
            <Layer>
              {/* Background Image */}
              {backgroundImage && (
                <Rect
                  x={backgroundImage.x}
                  y={backgroundImage.y}
                  width={backgroundImage.width}
                  height={backgroundImage.height}
                  fillPatternImage={backgroundImage.image}
                  fillPatternRepeat="no-repeat"
                  fillPatternScale={{
                    x: backgroundImage.width / backgroundImage.image.width,
                    y: backgroundImage.height / backgroundImage.image.height
                  }}
                />
              )}
              
              {/* Drawing Lines */}
              {lines.map((line, i) => {
                if (line.tool === "pen") {
                  return (
                    <Line
                      key={line.id}
                      points={line.points}
                      stroke={line.color}
                      strokeWidth={5}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                    />
                  );
                } else if (line.tool === "line") {
                  return (
                    <Line
                      key={line.id}
                      points={line.points}
                      stroke={line.color}
                      strokeWidth={2}
                      lineCap="round"
                    />
                  );
                }
                return null;
              })}
              
              {/* Measurements */}
              {measurements.map((measurement, i) => (
                <React.Fragment key={measurement.id}>
                  <Line
                    points={measurement.points}
                    stroke={calibrationMode && i === measurements.length - 1 ? "#FF9800" : "#2196F3"}
                    strokeWidth={2}
                    dash={[5, 2]}
                  />
                  <Circle
                    x={measurement.points[0]}
                    y={measurement.points[1]}
                    radius={4}
                    fill={calibrationMode && i === measurements.length - 1 ? "#FF9800" : "#2196F3"}
                  />
                  <Circle
                    x={measurement.points[2]}
                    y={measurement.points[3]}
                    radius={4}
                    fill={calibrationMode && i === measurements.length - 1 ? "#FF9800" : "#2196F3"}
                  />
                  
                  {/* Label */}
                  <Text
                    x={(measurement.points[0] + measurement.points[2]) / 2}
                    y={(measurement.points[1] + measurement.points[3]) / 2 - 10}
                    text={measurement.label}
                    fontSize={12}
                    fill="#000"
                    align="center"
                    offset={{ x: 0, y: 0 }}
                    padding={4}
                    background="#FFFFFF99"
                  />
                </React.Fragment>
              ))}
            </Layer>
          </Stage>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {calibrationMode ? (
            <span className="text-orange-500 font-medium">Modo de Calibración: Dibuje una línea de referencia</span>
          ) : (
            <span>Escala: 1 {unit} = {scale.toFixed(2)} píxeles</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleClear}>
          Limpiar Todo
        </Button>
      </CardFooter>
    </Card>
  );
}