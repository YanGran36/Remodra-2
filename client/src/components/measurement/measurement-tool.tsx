import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Ruler, RotateCcw, Save, Trash2, Plus } from "lucide-react";

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
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationDistance, setCalibrationDistance] = useState("");
  const [nextLabel, setNextLabel] = useState("");
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);

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

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    const gridSize = 20;
    
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
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

      // Draw distance labels with better positioning and visibility
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        
        const pixelDistance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        const realDistance = scale > 0 ? (pixelDistance / scale).toFixed(1) : pixelDistance.toFixed(0);
        
        // Calculate angle for text rotation
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        
        // Draw label background with better positioning
        const labelText = `${realDistance} ${measurement.unit}`;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        const textWidth = ctx.measureText(labelText).width;
        
        // Position label slightly offset from line center
        const offsetDistance = 15;
        const perpAngle = angle + Math.PI / 2;
        const labelX = midX + Math.cos(perpAngle) * offsetDistance;
        const labelY = midY + Math.sin(perpAngle) * offsetDistance;
        
        // Draw label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(labelX - textWidth/2 - 3, labelY - 8, textWidth + 6, 16);
        
        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, labelX, labelY + 3);
        
        // Draw dimension line extensions
        const extensionLength = 10;
        const extensionOffset = 5;
        
        // Extension lines at both ends
        ctx.strokeStyle = isActive ? '#1d4ed8' : '#059669';
        ctx.lineWidth = 1;
        
        // Start extension
        ctx.beginPath();
        ctx.moveTo(p1.x + Math.cos(perpAngle) * extensionOffset, p1.y + Math.sin(perpAngle) * extensionOffset);
        ctx.lineTo(p1.x + Math.cos(perpAngle) * (extensionOffset + extensionLength), p1.y + Math.sin(perpAngle) * (extensionOffset + extensionLength));
        ctx.stroke();
        
        // End extension
        ctx.beginPath();
        ctx.moveTo(p2.x + Math.cos(perpAngle) * extensionOffset, p2.y + Math.sin(perpAngle) * extensionOffset);
        ctx.lineTo(p2.x + Math.cos(perpAngle) * (extensionOffset + extensionLength), p2.y + Math.sin(perpAngle) * (extensionOffset + extensionLength));
        ctx.stroke();
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

      // Point number with compact design
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Small background for number (closer to point)
      const numberX = point.x + 8;
      const numberY = point.y - 8;
      
      ctx.beginPath();
      ctx.arc(numberX, numberY, 7, 0, 2 * Math.PI);
      ctx.fillStyle = isActive ? '#1d4ed8' : '#059669';
      ctx.fill();
      
      // Number text
      ctx.fillStyle = 'white';
      ctx.fillText((index + 1).toString(), numberX, numberY);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setMousePos({ x, y });
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
    onMeasurementsChange([]);
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
            
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Enter known distance"
                value={calibrationDistance}
                onChange={(e) => setCalibrationDistance(e.target.value)}
                className="w-40"
                step="0.1"
              />
              <span className="text-sm text-muted-foreground">{serviceUnit}</span>
              <Button 
                onClick={startCalibration} 
                variant="outline" 
                size="sm"
                disabled={!calibrationDistance || parseFloat(calibrationDistance) <= 0}
              >
                {isCalibrating ? "Click 2 points..." : "Calibrate Scale"}
              </Button>
            </div>
            
            {/* Quick calibration presets */}
            <div className="flex items-center space-x-2">
              <Label className="text-sm">Quick presets:</Label>
              <Button 
                onClick={() => { setCalibrationDistance("10"); startCalibration(); }} 
                variant="ghost" 
                size="sm"
                className="text-xs"
              >
                10 {serviceUnit}
              </Button>
              <Button 
                onClick={() => { setCalibrationDistance("20"); startCalibration(); }} 
                variant="ghost" 
                size="sm"
                className="text-xs"
              >
                20 {serviceUnit}
              </Button>
              <Button 
                onClick={() => { setCalibrationDistance("50"); startCalibration(); }} 
                variant="ghost" 
                size="sm"
                className="text-xs"
              >
                50 {serviceUnit}
              </Button>
              <Button 
                onClick={() => { setCalibrationDistance("100"); startCalibration(); }} 
                variant="ghost" 
                size="sm"
                className="text-xs"
              >
                100 {serviceUnit}
              </Button>
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