import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Ruler, 
  Square, 
  RotateCcw, 
  Trash2,
  MapPin,
  Home,
  Calculator,
  Save,
  Camera,
  Edit,
  Download
} from "lucide-react";

interface FencePoint {
  x: number;
  y: number;
  id: string;
}

interface Gate {
  x: number;
  y: number;
  width: number;
  id: string;
  type: 'gate' | 'double-gate';
  rotation: number; // degrees
}

interface Post {
  x: number;
  y: number;
  id: string;
  type: 'corner' | 'line' | 'gate';
}

interface FenceSection {
  start: FencePoint;
  end: FencePoint;
  length: number;
  posts: Post[];
  gates: Gate[];
}

interface FenceMeasurement {
  id: string;
  label: string;
  sections: FenceSection[];
  totalLength: number;
  totalPosts: number;
  totalGates: number;
  materialsList: {
    posts: number;
    panels: number;
    gates: number;
    hardware: string[];
  };
}

interface FenceMeasurementToolProps {
  onMeasurementsChange: (measurements: FenceMeasurement[]) => void;
  serviceUnit: string;
}

export default function FenceMeasurementTool({ 
  onMeasurementsChange, 
  serviceUnit 
}: FenceMeasurementToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<FencePoint[]>([]);
  const [measurements, setMeasurements] = useState<FenceMeasurement[]>([]);
  const [scale, setScale] = useState(10); // pixels per foot
  const [fenceHeight, setFenceHeight] = useState(6);
  const [postSpacing, setPostSpacing] = useState(8);
  const [gateMode, setGateMode] = useState(false);
  const [selectedGateWidth, setSelectedGateWidth] = useState(4);
  const [selectedGateType, setSelectedGateType] = useState<'gate' | 'double-gate'>('gate');
  const [selectedGateRotation, setSelectedGateRotation] = useState(0);
  const [gates, setGates] = useState<Gate[]>([]);
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [editingMeasurement, setEditingMeasurement] = useState<string | null>(null);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<string | null>(null);
  const [draggingGate, setDraggingGate] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState<{x: number, y: number} | null>(null);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDrawing) {
          setCurrentPoints([]);
          setIsDrawing(false);
        }
        if (selectedGate) {
          setSelectedGate(null);
        }
        if (draggingPoint) {
          setDraggingPoint(null);
        }
        if (draggingGate) {
          setDraggingGate(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, selectedGate, draggingPoint, draggingGate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Draw property grid (5ft squares)
    drawPropertyGrid(ctx, canvas.width, canvas.height);
    
    // Draw current fence line being drawn
    if (currentPoints.length > 0) {
      drawFenceLine(ctx, currentPoints, true);
    }

    // Draw completed measurements
    measurements.forEach(measurement => {
      measurement.sections.forEach(section => {
        drawFenceSection(ctx, section, false);
      });
    });

    // Draw gates
    gates.forEach(gate => {
      drawGate(ctx, gate);
    });

    // Draw mouse position if measuring
    if (mousePos && isDrawing && currentPoints.length > 0) {
      const lastPoint = currentPoints[currentPoints.length - 1];
      drawTempLine(ctx, lastPoint, mousePos);
    }
  }, [currentPoints, measurements, gates, mousePos, isDrawing]);

  const drawPropertyGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    
    const gridSize = 5 * scale; // 5ft grid
    
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

    // Property grid is ready for fence planning
  };

  const drawFenceLine = (ctx: CanvasRenderingContext2D, points: FencePoint[], isActive: boolean) => {
    if (points.length < 2) return;

    // Draw fence line
    ctx.strokeStyle = isActive ? "#3b82f6" : "#1f2937";
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Draw points and measurements
    points.forEach((point, index) => {
      // Draw point with drag handle
      ctx.fillStyle = isActive ? "#dc2626" : "#6b7280";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add white center for better visibility
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fill();

      // Draw measurement between points
      if (index > 0) {
        const prevPoint = points[index - 1];
        const distance = Math.sqrt(
          Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
        ) / scale;
        
        const midX = (point.x + prevPoint.x) / 2;
        const midY = (point.y + prevPoint.y) / 2;
        
        // Background for text
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        const text = `${distance.toFixed(1)}'`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(midX - textWidth/2 - 4, midY - 12, textWidth + 8, 20);
        
        // Distance text
        ctx.fillStyle = "#1f2937";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(text, midX, midY + 4);
      }
    });

    // Calculate and draw posts
    if (points.length >= 2) {
      const posts = calculatePosts(points);
      posts.forEach(post => {
        drawPost(ctx, post);
      });
    }
  };

  const drawFenceSection = (ctx: CanvasRenderingContext2D, section: FenceSection, isActive: boolean) => {
    const points = [section.start, section.end];
    drawFenceLine(ctx, points, isActive);
  };

  const drawPost = (ctx: CanvasRenderingContext2D, post: Post) => {
    ctx.fillStyle = post.type === 'corner' ? "#dc2626" : "#59a2f4";
    ctx.beginPath();
    ctx.arc(post.x, post.y, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Post marker
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawGate = (ctx: CanvasRenderingContext2D, gate: Gate) => {
    ctx.save();
    
    // Apply rotation around gate center
    ctx.translate(gate.x, gate.y);
    ctx.rotate((gate.rotation * Math.PI) / 180);
    
    // Gate opening
    ctx.strokeStyle = gate.type === 'double-gate' ? "#dc2626" : "#f59e0b";
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    
    const gateWidth = gate.width * scale;
    ctx.beginPath();
    ctx.moveTo(-gateWidth/2, 0);
    ctx.lineTo(gateWidth/2, 0);
    ctx.stroke();
    
    ctx.setLineDash([]); // Reset dash
    
    // Gate symbol - different for single vs double
    if (gate.type === 'double-gate') {
      // Double gate symbol (two arcs)
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-gateWidth/4, 0, gateWidth/4, 0, Math.PI);
      ctx.arc(gateWidth/4, 0, gateWidth/4, 0, Math.PI);
      ctx.stroke();
    } else {
      // Single gate symbol (one arc)
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-gateWidth/2, 0, gateWidth/2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Selection highlight if selected
    if (selectedGate === gate.id) {
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(-gateWidth/2 - 5, -10, gateWidth + 10, 20);
      ctx.setLineDash([]);
    }
    
    ctx.restore();
    
    // Gate label (not rotated)
    ctx.fillStyle = gate.type === 'double-gate' ? "#dc2626" : "#f59e0b";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    const gateLabel = gate.type === 'double-gate' ? `${gate.width}' Double Gate` : `${gate.width}' Gate`;
    ctx.fillText(gateLabel, gate.x, gate.y - 20);
  };

  const drawTempLine = (ctx: CanvasRenderingContext2D, from: FencePoint, to: {x: number, y: number}) => {
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Show temp distance
    const distance = Math.sqrt(
      Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
    ) / scale;
    
    const midX = (to.x + from.x) / 2;
    const midY = (to.y + from.y) / 2;
    
    ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${distance.toFixed(1)}'`, midX, midY);
  };

  const calculatePosts = (points: FencePoint[]): Post[] => {
    const posts: Post[] = [];
    
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const distance = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      ) / scale;
      
      const numPosts = Math.ceil(distance / postSpacing) + 1;
      
      for (let j = 0; j < numPosts; j++) {
        const ratio = j / (numPosts - 1);
        const postX = start.x + (end.x - start.x) * ratio;
        const postY = start.y + (end.y - start.y) * ratio;
        
        const postType = (j === 0 || j === numPosts - 1) ? 'corner' : 'line';
        
        posts.push({
          x: postX,
          y: postY,
          id: `post-${i}-${j}`,
          type: postType
        });
      }
    }
    
    return posts;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on an existing gate to select it
    const clickedGate = gates.find(gate => {
      const gateWidth = gate.width * scale;
      const distance = Math.sqrt(Math.pow(x - gate.x, 2) + Math.pow(y - gate.y, 2));
      return distance <= gateWidth / 2 + 10; // 10px tolerance
    });

    if (clickedGate) {
      setSelectedGate(selectedGate === clickedGate.id ? null : clickedGate.id);
      return;
    }

    // Handle double-click to finish fence
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    setLastClickTime(currentTime);

    if (timeDiff < 400 && isDrawing && currentPoints.length >= 2) {
      // Double-click detected - finish fence
      finishFence();
      return;
    }

    if (gateMode) {
      // Add gate with selected size and type
      const newGate: Gate = {
        x,
        y,
        width: selectedGateWidth,
        id: `gate-${Date.now()}`,
        type: selectedGateType,
        rotation: selectedGateRotation
      };
      setGates(prev => [...prev, newGate]);
      setGateMode(false);
      return;
    }

    const newPoint: FencePoint = {
      x,
      y,
      id: `point-${Date.now()}`
    };

    if (!isDrawing) {
      setIsDrawing(true);
      setCurrentPoints([newPoint]);
    } else {
      setCurrentPoints(prev => [...prev, newPoint]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });
  };

  const finishFence = () => {
    if (currentPoints.length < 2) return;

    const totalLength = currentPoints.reduce((sum, point, index) => {
      if (index === 0) return 0;
      const prevPoint = currentPoints[index - 1];
      const distance = Math.sqrt(
        Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
      ) / scale;
      return sum + distance;
    }, 0);

    const posts = calculatePosts(currentPoints);
    const sections: FenceSection[] = [];

    for (let i = 0; i < currentPoints.length - 1; i++) {
      const sectionLength = Math.sqrt(
        Math.pow(currentPoints[i + 1].x - currentPoints[i].x, 2) + 
        Math.pow(currentPoints[i + 1].y - currentPoints[i].y, 2)
      ) / scale;

      sections.push({
        start: currentPoints[i],
        end: currentPoints[i + 1],
        length: sectionLength,
        posts: posts.filter(p => 
          Math.abs(p.x - currentPoints[i].x) < 10 || 
          Math.abs(p.x - currentPoints[i + 1].x) < 10
        ),
        gates: gates.filter(g => 
          g.x >= Math.min(currentPoints[i].x, currentPoints[i + 1].x) &&
          g.x <= Math.max(currentPoints[i].x, currentPoints[i + 1].x)
        )
      });
    }

    const panels = Math.ceil(totalLength / 8); // 8ft panels
    const totalPosts = posts.length;
    const totalGates = gates.length;

    const measurementId = editingMeasurement || `fence-${Date.now()}`;
    const newMeasurement: FenceMeasurement = {
      id: measurementId,
      label: `Fence - ${totalLength.toFixed(1)} ft`,
      sections,
      totalLength,
      totalPosts,
      totalGates,
      materialsList: {
        posts: totalPosts,
        panels,
        gates: totalGates,
        hardware: [
          `${totalPosts} post anchors`,
          `${panels} panel brackets`,
          `${totalGates} gate hinges`,
          `${totalGates} gate latches`
        ]
      }
    };

    const updatedMeasurements = editingMeasurement 
      ? measurements.map(m => m.id === editingMeasurement ? newMeasurement : m)
      : [...measurements, newMeasurement];
    
    setMeasurements(updatedMeasurements);
    onMeasurementsChange(updatedMeasurements);

    // Reset
    setCurrentPoints([]);
    setIsDrawing(false);
    setEditingMeasurement(null);
    // Don't clear gates - they should persist
  };

  const clearAll = () => {
    setMeasurements([]);
    setCurrentPoints([]);
    setGates([]);
    setIsDrawing(false);
    setEditingMeasurement(null);
    setSelectedGate(null);
    onMeasurementsChange([]);
  };

  const editMeasurement = (measurementId: string) => {
    const measurement = measurements.find(m => m.id === measurementId);
    if (!measurement) return;

    // Convert measurement back to editable points
    const allPoints: FencePoint[] = [];
    measurement.sections.forEach(section => {
      allPoints.push(section.start);
      if (allPoints.length === 1 || allPoints[allPoints.length - 1].id !== section.end.id) {
        allPoints.push(section.end);
      }
    });

    setCurrentPoints(allPoints);
    setIsDrawing(true);
    setEditingMeasurement(measurementId);

    // Remove the measurement from completed list temporarily
    setMeasurements(prev => prev.filter(m => m.id !== measurementId));
  };

  const deleteGate = (gateId: string) => {
    setGates(prev => prev.filter(g => g.id !== gateId));
    if (selectedGate === gateId) {
      setSelectedGate(null);
    }
  };

  const deleteMeasurement = (measurementId: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== measurementId));
    const updatedMeasurements = measurements.filter(m => m.id !== measurementId);
    onMeasurementsChange(updatedMeasurements);
  };

  const captureScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a download link
    const link = document.createElement('a');
    link.download = `fence-plan-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const rotateSelectedGate = (direction: 'left' | 'right') => {
    if (!selectedGate) return;
    
    setGates(prev => prev.map(gate => {
      if (gate.id === selectedGate) {
        const newRotation = direction === 'right' 
          ? (gate.rotation + 45) % 360
          : (gate.rotation - 45 + 360) % 360;
        return { ...gate, rotation: newRotation };
      }
      return gate;
    }));
  };

  const updateSelectedGateSize = (newWidth: number) => {
    if (!selectedGate) return;
    
    setGates(prev => prev.map(gate => {
      if (gate.id === selectedGate) {
        return { ...gate, width: newWidth };
      }
      return gate;
    }));
  };

  const updateSelectedGateType = (newType: 'gate' | 'double-gate') => {
    if (!selectedGate) return;
    
    setGates(prev => prev.map(gate => {
      if (gate.id === selectedGate) {
        return { ...gate, type: newType };
      }
      return gate;
    }));
  };

  return (
    <div className="space-y-4">
      {/* Fence Planning Controls */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Home className="h-5 w-5" />
            Fence Installation Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fence Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Fence Height</Label>
              <Input 
                type="number" 
                value={fenceHeight}
                onChange={(e) => setFenceHeight(parseInt(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">Post Spacing (ft)</Label>
              <Input 
                type="number" 
                value={postSpacing}
                onChange={(e) => setPostSpacing(parseInt(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">Scale (px/ft)</Label>
              <Input 
                type="number" 
                value={scale}
                onChange={(e) => setScale(parseInt(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Gate Configuration */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <Label className="text-sm">Gate Width</Label>
              <div className="flex gap-1">
                {[3, 4, 5, 6, 8, 10, 12].map(width => (
                  <Button
                    key={width}
                    onClick={() => setSelectedGateWidth(width)}
                    variant={selectedGateWidth === width ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-2 text-xs"
                  >
                    {width}'
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">Gate Type & Rotation</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedGateType('gate')}
                    variant={selectedGateType === 'gate' ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    Single
                  </Button>
                  <Button
                    onClick={() => setSelectedGateType('double-gate')}
                    variant={selectedGateType === 'double-gate' ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    Double
                  </Button>
                </div>
                <div className="flex gap-1">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                    <Button
                      key={angle}
                      onClick={() => setSelectedGateRotation(angle)}
                      variant={selectedGateRotation === angle ? "default" : "outline"}
                      size="sm"
                      className="h-6 px-1 text-xs"
                    >
                      {angle}°
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Drawing Controls */}
          <div className="flex gap-2">
            <Button
              onClick={() => setGateMode(!gateMode)}
              variant={gateMode ? "default" : "outline"}
              size="sm"
            >
              <MapPin className="h-4 w-4 mr-1" />
              {gateMode ? `Exit Gate Mode (${selectedGateWidth}' ${selectedGateType === 'double-gate' ? 'Double' : 'Single'})` : "Add Gate"}
            </Button>
            
            <Button onClick={finishFence} variant="outline" size="sm" disabled={currentPoints.length < 2}>
              <Save className="h-4 w-4 mr-1" />
              Complete Fence
            </Button>
            
            <Button onClick={clearAll} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
            
            <Button onClick={captureScreenshot} variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-1" />
              Screenshot
            </Button>
          </div>

          {/* Gate Editor for Selected Gate */}
          {selectedGate && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-blue-800">Editing Selected Gate</Label>
                <Button
                  onClick={() => setSelectedGate(null)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Size</Label>
                  <div className="flex gap-1 flex-wrap">
                    {[3, 4, 5, 6, 8, 10, 12].map(width => (
                      <Button
                        key={width}
                        onClick={() => updateSelectedGateSize(width)}
                        variant={gates.find(g => g.id === selectedGate)?.width === width ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-1 text-xs"
                      >
                        {width}'
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs">Type</Label>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => updateSelectedGateType('gate')}
                      variant={gates.find(g => g.id === selectedGate)?.type === 'gate' ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-xs"
                    >
                      Single
                    </Button>
                    <Button
                      onClick={() => updateSelectedGateType('double-gate')}
                      variant={gates.find(g => g.id === selectedGate)?.type === 'double-gate' ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-xs"
                    >
                      Double
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs">Rotation</Label>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => rotateSelectedGate('left')}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      ↶ -45°
                    </Button>
                    <Button
                      onClick={() => rotateSelectedGate('right')}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      ↷ +45°
                    </Button>
                  </div>
                  <div className="text-xs text-center mt-1">
                    {gates.find(g => g.id === selectedGate)?.rotation || 0}°
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => deleteGate(selectedGate)}
                variant="destructive"
                size="sm"
                className="w-full mt-2 h-6 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Gate
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
            <strong>Instructions:</strong> Click to start drawing fence line. Each click adds a fence section. 
            <strong>Double-click to finish the fence.</strong> Click on existing gates to select and edit them.
          </div>
        </CardContent>
      </Card>

      {/* Drawing Canvas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Property Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            className="border border-gray-300 cursor-crosshair w-full"
            style={{ maxWidth: "800px", height: "600px" }}
          />
        </CardContent>
      </Card>

      {/* Materials Summary */}
      {measurements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calculator className="h-4 w-4" />
              Materials List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {measurements.map(measurement => (
              <div key={measurement.id} className="space-y-2 border-b pb-4 mb-4 last:border-b-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{measurement.label}</h4>
                  <Badge variant="secondary">{measurement.totalLength.toFixed(1)} ft</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Posts needed:</strong> {measurement.materialsList.posts}
                  </div>
                  <div>
                    <strong>Panels needed:</strong> {measurement.materialsList.panels}
                  </div>
                  <div>
                    <strong>Gates:</strong> {measurement.materialsList.gates}
                  </div>
                  <div>
                    <strong>Height:</strong> {fenceHeight} ft
                  </div>
                </div>
                
                <div>
                  <strong>Hardware:</strong>
                  <ul className="text-xs ml-4 mt-1">
                    {measurement.materialsList.hardware.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}