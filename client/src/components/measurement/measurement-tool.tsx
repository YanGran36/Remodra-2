import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Ruler, RotateCcw, Save, Trash2, Plus, Square, PaintBucket, Minus, CornerDownRight } from "lucide-react";

interface Point {
  x: number;
  y: number;
  id: string;
}

interface Measurement {
  id: string;
  label: string;
  points: Point[];
  distance: number;
  unit: string;
}

interface MeasurementToolProps {
  onMeasurementsChange: (measurements: Measurement[]) => void;
  serviceUnit: string;
}

export default function MeasurementTool({ onMeasurementsChange, serviceUnit }: MeasurementToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [scale, setScale] = useState(1); // pixels per foot
  const [zoomLevel, setZoomLevel] = useState(1); // zoom multiplier
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationDistance, setCalibrationDistance] = useState("");
  const [nextLabel, setNextLabel] = useState("");
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [selectedShape, setSelectedShape] = useState<string>("freeform");
  const [gates, setGates] = useState<{x: number, y: number, id: string, width: number}[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for zoom transformations
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);

    // Draw 5ft grid background
    drawFiveFootGrid(ctx, canvas.width / zoomLevel, canvas.height / zoomLevel);

    // Draw completed measurements
    measurements.forEach(measurement => {
      drawMeasurement(ctx, measurement, false);
    });

    // Draw current measurement being created
    if (currentPoints.length > 0) {
      const tempMeasurement: Measurement = {
        id: 'temp',
        label: 'Current',
        points: currentPoints,
        distance: 0,
        unit: serviceUnit
      };
      drawMeasurement(ctx, tempMeasurement, true);

      // Draw preview line to mouse position
      if (mousePos && currentPoints.length > 0) {
        const lastPoint = currentPoints[currentPoints.length - 1];
        
        // Preview line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Show preview distance
        const pixelDistance = Math.sqrt((mousePos.x - lastPoint.x) ** 2 + (mousePos.y - lastPoint.y) ** 2);
        const realDistance = scale > 0 ? (pixelDistance / scale).toFixed(1) : pixelDistance.toFixed(0);
        
        const midX = (lastPoint.x + mousePos.x) / 2;
        const midY = (lastPoint.y + mousePos.y) / 2;
        
        // Preview label
        ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
        ctx.font = 'bold 12px Arial';
        const previewText = `${realDistance} ${serviceUnit}`;
        const textWidth = ctx.measureText(previewText).width;
        ctx.fillRect(midX - textWidth/2 - 3, midY - 10, textWidth + 6, 20);
        
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(previewText, midX, midY + 3);
      }

      // Draw closing line preview for area services when we have 3+ points
      if (serviceUnit === 'sqft' && currentPoints.length >= 3) {
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#22c55e'; // Green for area closing
        ctx.lineWidth = 2;
        ctx.beginPath();
        const firstPoint = currentPoints[0];
        ctx.moveTo(mousePos.x, mousePos.y);
        ctx.lineTo(firstPoint.x, firstPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Show "Close Area" text
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 12px Arial';
        const midX = (mousePos.x + firstPoint.x) / 2;
        const midY = (mousePos.y + firstPoint.y) / 2;
        ctx.fillText('Close Area', midX + 5, midY - 10);
      }
    }
  }, [measurements, currentPoints, serviceUnit, mousePos, scale]);

  const drawFiveFootGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Calculate grid size - each square represents 5 feet
    const fiveFeetGridSize = scale > 0 ? scale * 5 : 40; // Default 40px if no scale set
    
    // Draw minor grid lines (1 foot subdivisions)
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    const oneFootGridSize = fiveFeetGridSize / 5;
    
    for (let x = 0; x <= width; x += oneFootGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += oneFootGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw major grid lines (5 foot markers)
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += fiveFeetGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += fiveFeetGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Add grid labels every 20 feet
    if (scale > 0 && zoomLevel >= 0.5) {
      ctx.fillStyle = '#888888';
      ctx.font = `${Math.max(8, 10 * zoomLevel)}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      const labelInterval = fiveFeetGridSize * 4; // Every 20 feet
      for (let x = labelInterval; x <= width; x += labelInterval) {
        const feet = Math.round((x / scale));
        ctx.fillText(`${feet}ft`, x + 2, 2);
      }
      for (let y = labelInterval; y <= height; y += labelInterval) {
        const feet = Math.round((y / scale));
        ctx.fillText(`${feet}ft`, 2, y + 2);
      }
    }
  };

  const drawMeasurement = (ctx: CanvasRenderingContext2D, measurement: Measurement, isActive: boolean) => {
    const { points } = measurement;
    
    if (points.length === 0) return;

    // Draw lines between points first (behind points)
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.strokeStyle = isActive ? '#3b82f6' : '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw distance labels with cleaner, more precise positioning
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        
        const pixelDistance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        const realDistance = scale > 0 ? (pixelDistance / scale).toFixed(1) : pixelDistance.toFixed(0);
        
        // Only show distance if line is long enough to be meaningful
        if (pixelDistance > 20) {
          const labelText = `${realDistance} ${measurement.unit}`;
          ctx.font = '11px Arial';
          ctx.textAlign = 'center';
          const textWidth = ctx.measureText(labelText).width;
          
          // Position label closer to the line, with subtle offset
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const perpAngle = angle + Math.PI / 2;
          const offsetDistance = 8; // Reduced offset
          const labelX = midX + Math.cos(perpAngle) * offsetDistance;
          const labelY = midY + Math.sin(perpAngle) * offsetDistance;
          
          // Subtle label background
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(labelX - textWidth/2 - 2, labelY - 6, textWidth + 4, 12);
          
          // Border for better visibility
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(labelX - textWidth/2 - 2, labelY - 6, textWidth + 4, 12);
          
          // Label text
          ctx.fillStyle = '#374151';
          ctx.fillText(labelText, labelX, labelY + 2);
        }
      }
    }

    // Draw points on top with better precision
    points.forEach((point, index) => {
      // Crosshair for precise positioning
      ctx.strokeStyle = isActive ? '#1d4ed8' : '#059669';
      ctx.lineWidth = 1;
      
      // Horizontal crosshair line
      ctx.beginPath();
      ctx.moveTo(point.x - 8, point.y);
      ctx.lineTo(point.x + 8, point.y);
      ctx.stroke();
      
      // Vertical crosshair line
      ctx.beginPath();
      ctx.moveTo(point.x, point.y - 8);
      ctx.lineTo(point.x, point.y + 8);
      ctx.stroke();
      
      // Center dot
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = isActive ? '#1d4ed8' : '#059669';
      ctx.fill();
      
      // Outer ring
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.strokeStyle = isActive ? '#1d4ed8' : '#059669';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Smaller, less intrusive point numbers
      if (points.length > 2) { // Only show numbers for complex shapes
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const numberX = point.x + 8;
        const numberY = point.y - 8;
        
        // Subtle number background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(numberX, numberY, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = isActive ? '#1d4ed8' : '#059669';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Number text
        ctx.fillStyle = isActive ? '#1d4ed8' : '#059669';
        ctx.fillText((index + 1).toString(), numberX, numberY);
      }
    });
  };

  const drawGate = (ctx: CanvasRenderingContext2D, gate: {x: number, y: number, id: string, width: number}) => {
    // Draw gate symbol - a small rectangle with opening lines
    ctx.strokeStyle = '#ff6b35'; // Orange for gates
    ctx.lineWidth = 3;
    
    // Gate opening lines
    const gatePixelWidth = gate.width * scale;
    ctx.beginPath();
    ctx.moveTo(gate.x - gatePixelWidth/2, gate.y - 10);
    ctx.lineTo(gate.x - gatePixelWidth/2, gate.y + 10);
    ctx.moveTo(gate.x + gatePixelWidth/2, gate.y - 10);
    ctx.lineTo(gate.x + gatePixelWidth/2, gate.y + 10);
    ctx.stroke();
    
    // Gate icon
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(gate.x - 8, gate.y - 4, 16, 8);
    
    // Gate label
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`🚪 ${gate.width}ft`, gate.x, gate.y - 15);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Adjust for zoom level
    const x = ((e.clientX - rect.left) * scaleX) / zoomLevel;
    const y = ((e.clientY - rect.top) * scaleY) / zoomLevel;

    setMousePos({ x, y });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      if (direction === 'in') {
        return Math.min(prev * 1.2, 3); // Max 3x zoom
      } else {
        return Math.max(prev / 1.2, 0.3); // Min 0.3x zoom
      }
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check for double click
    const currentTime = Date.now();
    const isDoubleClick = currentTime - lastClickTime < 300; // 300ms for double click
    setLastClickTime(currentTime);

    if (isDoubleClick && !isCalibrating && currentPoints.length >= 2) {
      // Double click finishes the measurement
      finishMeasurement();
      return;
    }

    const newPoint: Point = {
      x,
      y,
      id: Date.now().toString()
    };

    if (isCalibrating) {
      if (currentPoints.length === 0) {
        setCurrentPoints([newPoint]);
      } else if (currentPoints.length === 1) {
        const points = [...currentPoints, newPoint];
        setCurrentPoints(points);
        
        // Calculate scale after two points
        const pixelDistance = Math.sqrt(
          (points[1].x - points[0].x) ** 2 + (points[1].y - points[0].y) ** 2
        );
        
        if (calibrationDistance && parseFloat(calibrationDistance) > 0) {
          const realDistance = parseFloat(calibrationDistance);
          setScale(pixelDistance / realDistance);
          setIsCalibrating(false);
          setCurrentPoints([]);
          setCalibrationDistance("");
        }
      }
    } else {
      setCurrentPoints(prev => [...prev, newPoint]);
    }
  };

  const calculatePolygonArea = (points: Point[]): number => {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;
    
    // Convert from pixels to real units
    return scale > 0 ? area / (scale * scale) : area;
  };

  const calculatePerimeter = (points: Point[]): number => {
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const pixelDistance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      totalDistance += scale > 0 ? pixelDistance / scale : pixelDistance;
    }
    return totalDistance;
  };

  const finishMeasurement = () => {
    if (currentPoints.length < 2) return;

    let finalValue = 0;
    let measurementType = "linear";

    // Determine if this should be area or linear measurement based on service unit
    const isAreaService = serviceUnit === 'sqft';
    const isLinearService = serviceUnit === 'ft';
    
    if (isAreaService && currentPoints.length >= 3) {
      // For area services (roof, deck, etc.), calculate area if it's a closed polygon
      finalValue = calculatePolygonArea(currentPoints);
      measurementType = "area";
    } else {
      // For linear services (fence, gutters) or lines, calculate perimeter/length
      finalValue = calculatePerimeter(currentPoints);
      measurementType = "linear";
    }

    const defaultLabel = measurementType === "area" 
      ? `Area ${measurements.length + 1}` 
      : `Line ${measurements.length + 1}`;

    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      label: nextLabel || defaultLabel,
      points: [...currentPoints],
      distance: finalValue,
      unit: serviceUnit
    };

    const updatedMeasurements = [...measurements, newMeasurement];
    setMeasurements(updatedMeasurements);
    setCurrentPoints([]);
    setNextLabel("");
    onMeasurementsChange(updatedMeasurements);
  };

  const clearAll = () => {
    setMeasurements([]);
    setCurrentPoints([]);
    setGates([]);
    setNextLabel("");
    onMeasurementsChange([]);
  };

  const createQuickRectangle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const width = 100;
    const height = 80;
    
    const rectanglePoints: Point[] = [
      { x: centerX - width/2, y: centerY - height/2, id: Date.now().toString() + "_1" },
      { x: centerX + width/2, y: centerY - height/2, id: Date.now().toString() + "_2" },
      { x: centerX + width/2, y: centerY + height/2, id: Date.now().toString() + "_3" },
      { x: centerX - width/2, y: centerY + height/2, id: Date.now().toString() + "_4" },
    ];
    
    setCurrentPoints(rectanglePoints);
    setSelectedShape("rectangle");
  };

  const createQuickPerimeter = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const margin = 50;
    const perimeterPoints: Point[] = [
      { x: margin, y: margin, id: Date.now().toString() + "_1" },
      { x: canvas.width - margin, y: margin, id: Date.now().toString() + "_2" },
      { x: canvas.width - margin, y: canvas.height - margin, id: Date.now().toString() + "_3" },
      { x: margin, y: canvas.height - margin, id: Date.now().toString() + "_4" },
    ];
    
    setCurrentPoints(perimeterPoints);
    setSelectedShape("freeform");
  };

  const addGateToFence = (x: number, y: number) => {
    const gateWidth = 4; // Default 4 feet gate
    const newGate = {
      x,
      y,
      id: Date.now().toString(),
      width: gateWidth
    };
    
    setGates(prev => [...prev, newGate]);
  };

  const deleteMeasurement = (id: string) => {
    const updatedMeasurements = measurements.filter(m => m.id !== id);
    setMeasurements(updatedMeasurements);
    onMeasurementsChange(updatedMeasurements);
  };

  const startCalibration = () => {
    setIsCalibrating(true);
    setCurrentPoints([]);
  };

  const quickCalibrate = (distance: number) => {
    setCalibrationDistance(distance.toString());
    setIsCalibrating(true);
    setCurrentPoints([]);
  };

  const getTotalArea = () => {
    return measurements.reduce((total, m) => {
      if (serviceUnit === 'sqft' && m.points.length >= 3) {
        // Calculate area for polygons (simplified)
        return total + m.distance;
      }
      return total + m.distance;
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Ruler className="h-5 w-5" />
            <span>Measurement Tool</span>
          </CardTitle>
          <CardDescription>
            Click points on the drawing area to measure distances. {isCalibrating ? "Calibrating scale..." : "Ready to measure"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scale Calibration */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Label>Scale Status:</Label>
              <Badge variant={scale > 0 ? "default" : "secondary"}>
                {scale > 0 ? `1 px = ${(1/scale).toFixed(3)} ${serviceUnit}` : "Not calibrated"}
              </Badge>
              {scale > 0 && (
                <Button 
                  onClick={() => setScale(0)} 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600"
                >
                  Reset Scale
                </Button>
              )}
            </div>
            
            {/* Smart Calibration Presets */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 space-y-3">
              <Label className="text-sm font-medium text-blue-800">Quick Calibration</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => quickCalibrate(12)} 
                  variant="outline" 
                  size="sm"
                  className="h-12 flex flex-col items-center gap-1 bg-white hover:bg-blue-50"
                >
                  <span className="font-medium text-blue-700">12 {serviceUnit}</span>
                  <span className="text-xs text-blue-600">Standard Room</span>
                </Button>
                <Button 
                  onClick={() => quickCalibrate(24)} 
                  variant="outline" 
                  size="sm"
                  className="h-12 flex flex-col items-center gap-1 bg-white hover:bg-blue-50"
                >
                  <span className="font-medium text-blue-700">24 {serviceUnit}</span>
                  <span className="text-xs text-blue-600">Large Room</span>
                </Button>
                <Button 
                  onClick={() => quickCalibrate(8)} 
                  variant="outline" 
                  size="sm"
                  className="h-12 flex flex-col items-center gap-1 bg-white hover:bg-blue-50"
                >
                  <span className="font-medium text-blue-700">8 {serviceUnit}</span>
                  <span className="text-xs text-blue-600">Wall Height</span>
                </Button>
                <Button 
                  onClick={() => quickCalibrate(6)} 
                  variant="outline" 
                  size="sm"
                  className="h-12 flex flex-col items-center gap-1 bg-white hover:bg-blue-50"
                >
                  <span className="font-medium text-blue-700">6 {serviceUnit}</span>
                  <span className="text-xs text-blue-600">Door/Window</span>
                </Button>
              </div>
            </div>

            {/* Custom Calibration */}
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              <Label className="text-xs font-medium text-slate-700">Custom Distance</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter distance"
                  value={calibrationDistance}
                  onChange={(e) => setCalibrationDistance(e.target.value)}
                  className="text-sm flex-1"
                  step="0.1"
                />
                <span className="text-sm text-muted-foreground self-center px-1">{serviceUnit}</span>
                <Button 
                  onClick={isCalibrating ? () => setIsCalibrating(false) : startCalibration} 
                  variant={isCalibrating ? "destructive" : "default"}
                  size="sm"
                  disabled={!calibrationDistance || parseFloat(calibrationDistance) <= 0}
                  className="px-4"
                >
                  {isCalibrating ? "Cancel" : "Set"}
                </Button>
              </div>
              
              {isCalibrating && (
                <div className="text-xs text-blue-600 bg-blue-50 rounded p-2 border border-blue-200">
                  📏 Click two points that are exactly <strong>{calibrationDistance} {serviceUnit}</strong> apart
                </div>
              )}
            </div>
          </div>

          {/* Measurement Label */}
          <div className="flex items-center space-x-2">
            <Label>Label:</Label>
            <Input
              placeholder="e.g., North Wall, Roof Length..."
              value={nextLabel}
              onChange={(e) => setNextLabel(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Zoom Controls */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 space-y-2">
            <Label className="text-sm font-medium text-green-800">Zoom & View</Label>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleZoom('out')}
                variant="outline"
                size="sm"
                className="flex-1 bg-white hover:bg-green-50"
              >
                <Minus className="h-4 w-4 mr-1" />
                Zoom Out
              </Button>
              <div className="text-sm font-medium text-green-700 min-w-16 text-center">
                {Math.round(zoomLevel * 100)}%
              </div>
              <Button
                onClick={() => handleZoom('in')}
                variant="outline"
                size="sm"
                className="flex-1 bg-white hover:bg-green-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Zoom In
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={finishMeasurement}
              disabled={currentPoints.length < 2}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Measurement
            </Button>
            <Button
              onClick={() => setCurrentPoints([])}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Current
            </Button>
            <Button
              onClick={clearAll}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* Current Status */}
          {isCalibrating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 font-medium">
                🎯 Calibration Mode: Click {currentPoints.length === 0 ? "first" : "second"} point
              </p>
              <p className="text-blue-600 text-sm">
                {currentPoints.length === 0 
                  ? "Click anywhere on the canvas to mark the start of your known distance"
                  : `Click the end point of your ${calibrationDistance} ${serviceUnit} reference distance`
                }
              </p>
            </div>
          )}
          
          {!isCalibrating && scale === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 font-medium">⚠️ Scale not calibrated</p>
              <p className="text-yellow-600 text-sm">
                Enter a known distance and click "Calibrate Scale" to start measuring accurately
              </p>
            </div>
          )}
          
          {!isCalibrating && scale > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 font-medium">✅ Ready to measure</p>
              <p className="text-green-600 text-sm">
                Click points to create measurements. {serviceUnit === 'sqft' ? 'Create a closed area (3+ points) for square footage.' : 'Create lines for linear measurements.'} Double-click to finish.
              </p>
              {currentPoints.length > 0 && (
                <p className="text-blue-600 text-xs mt-1">
                  Current points: {currentPoints.length} | 
                  {serviceUnit === 'sqft' && currentPoints.length >= 3 ? ' Ready for area calculation' : ' Building measurement'} | 
                  Double-click to finish
                </p>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-muted-foreground">
            <p><strong>How to use:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li><strong>Calibrate:</strong> Enter a known distance and click two points to set scale</li>
              <li><strong>Measure:</strong> Click multiple points to create measurements</li>
              <li><strong>Finish:</strong> Double-click to complete the measurement</li>
              <li><strong>Areas:</strong> For {serviceUnit === 'sqft' ? 'square footage services, create closed shapes (3+ points)' : 'linear services, create lines or paths'}</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Shape Library */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <div className="p-1 bg-blue-100 rounded-md">
              <Square className="h-4 w-4 text-blue-600" />
            </div>
            Smart Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Shape Selection with better layout */}
          <div className="grid grid-cols-4 gap-2">
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedShape === "freeform" 
                  ? "border-blue-500 bg-blue-50 shadow-sm" 
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
              onClick={() => setSelectedShape("freeform")}
            >
              <div className="flex flex-col items-center gap-1">
                <PaintBucket className={`h-5 w-5 ${selectedShape === "freeform" ? "text-blue-600" : "text-slate-500"}`} />
                <span className="text-xs font-medium text-slate-700">Custom</span>
              </div>
            </div>
            
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedShape === "rectangle" 
                  ? "border-green-500 bg-green-50 shadow-sm" 
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
              onClick={() => setSelectedShape("rectangle")}
            >
              <div className="flex flex-col items-center gap-1">
                <Square className={`h-5 w-5 ${selectedShape === "rectangle" ? "text-green-600" : "text-slate-500"}`} />
                <span className="text-xs font-medium text-slate-700">Rectangle</span>
              </div>
            </div>
            
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedShape === "fence" 
                  ? "border-orange-500 bg-orange-50 shadow-sm" 
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
              onClick={() => setSelectedShape("fence")}
            >
              <div className="flex flex-col items-center gap-1">
                <Minus className={`h-5 w-5 ${selectedShape === "fence" ? "text-orange-600" : "text-slate-500"}`} />
                <span className="text-xs font-medium text-slate-700">Fence</span>
              </div>
            </div>
            
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedShape === "L-shape" 
                  ? "border-purple-500 bg-purple-50 shadow-sm" 
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
              onClick={() => setSelectedShape("L-shape")}
            >
              <div className="flex flex-col items-center gap-1">
                <CornerDownRight className={`h-5 w-5 ${selectedShape === "L-shape" ? "text-purple-600" : "text-slate-500"}`} />
                <span className="text-xs font-medium text-slate-700">L-Shape</span>
              </div>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => createQuickRectangle()}
              className="flex-1 h-9 text-xs bg-white hover:bg-slate-50"
            >
              📐 Quick Rectangle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createQuickPerimeter()}
              className="flex-1 h-9 text-xs bg-white hover:bg-slate-50"
            >
              🏠 Property Outline
            </Button>
          </div>

          {/* Fence Gates Section */}
          {(selectedShape === "fence" || serviceUnit === 'ft') && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm">🚪</span>
                </div>
                <p className="text-orange-800 font-medium text-sm">Gate Markers</p>
              </div>
              <p className="text-orange-700 text-xs mb-3">
                Click on fence lines to mark gate locations
              </p>
              
              {gates.length > 0 && (
                <div className="space-y-2">
                  <div className="text-orange-700 text-xs font-medium">Gates Added:</div>
                  <div className="max-h-20 overflow-y-auto space-y-1">
                    {gates.map((gate, index) => (
                      <div key={gate.id} className="flex items-center justify-between bg-white rounded px-2 py-1 text-xs">
                        <span className="text-slate-700">Gate {index + 1}: {gate.width}ft</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setGates(gates.filter(g => g.id !== gate.id))}
                          className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawing Canvas */}
      <Card>
        <CardContent className="p-4">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePos(null)}
            className="border border-gray-300 cursor-crosshair w-full"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </CardContent>
      </Card>

      {/* Measurements Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Measurements Summary</CardTitle>
          <CardDescription>
            Total: {getTotalArea().toFixed(2)} {serviceUnit}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {measurements.map((measurement) => (
              <div key={measurement.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">{measurement.label}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {measurement.distance.toFixed(2)} {measurement.unit}
                  </span>
                </div>
                <Button
                  onClick={() => deleteMeasurement(measurement.id)}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {measurements.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No measurements yet. Start by calibrating the scale and then click points to measure.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}