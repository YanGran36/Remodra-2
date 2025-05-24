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
    }
  }, [measurements, currentPoints, serviceUnit]);

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

    // Draw points
    points.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = isActive ? '#3b82f6' : '#10b981';
      ctx.fill();
      ctx.strokeStyle = isActive ? '#1d4ed8' : '#059669';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw point number
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText((index + 1).toString(), point.x, point.y + 4);
    });

    // Draw lines between points
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.strokeStyle = isActive ? '#3b82f6' : '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw distance labels
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        
        const pixelDistance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        const realDistance = scale > 0 ? (pixelDistance / scale).toFixed(1) : pixelDistance.toFixed(0);
        
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillRect(midX - 20, midY - 8, 40, 16);
        ctx.fillStyle = 'white';
        ctx.fillText(`${realDistance}${measurement.unit}`, midX, midY + 4);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

  const finishMeasurement = () => {
    if (currentPoints.length < 2) return;

    let totalDistance = 0;
    for (let i = 0; i < currentPoints.length - 1; i++) {
      const p1 = currentPoints[i];
      const p2 = currentPoints[i + 1];
      const pixelDistance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      totalDistance += scale > 0 ? pixelDistance / scale : pixelDistance;
    }

    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      label: nextLabel || `Measurement ${measurements.length + 1}`,
      points: [...currentPoints],
      distance: totalDistance,
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
          <div className="flex items-center space-x-2">
            <Label>Scale:</Label>
            <Badge variant={scale > 0 ? "default" : "secondary"}>
              {scale > 0 ? `1 px = ${(1/scale).toFixed(2)} ${serviceUnit}` : "Not calibrated"}
            </Badge>
            <Input
              type="number"
              placeholder="Known distance"
              value={calibrationDistance}
              onChange={(e) => setCalibrationDistance(e.target.value)}
              className="w-32"
            />
            <Button onClick={startCalibration} variant="outline" size="sm">
              Calibrate
            </Button>
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

          {/* Instructions */}
          <div className="text-sm text-muted-foreground">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>First calibrate the scale by clicking two points of known distance</li>
              <li>Click points to create measurement lines</li>
              <li>Add a label to describe what you're measuring</li>
              <li>Click "Save Measurement" to finalize</li>
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