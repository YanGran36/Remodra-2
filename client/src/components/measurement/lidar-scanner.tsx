import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Download, Upload, RotateCw, Zap, Maximize, Settings, Grid3X3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDraggable } from '@neodrag/react';

// Para simulación
import * as Rough from 'roughjs/bin/rough';

interface ScanResult {
  id: string;
  timestamp: number;
  depthMap: string; // base64 data URL
  pointCloud?: number[][]; // [x, y, z] points
  width: number;
  height: number;
  scanSetting: ScanSettings;
}

interface ScanSettings {
  resolution: number; // 1-100
  range: number; // in meters/feet
  accuracy: number; // 1-100
  density: number; // 1-100
}

interface LiDARScannerProps {
  onScanComplete?: (result: ScanResult) => void;
  width?: number;
  height?: number;
  unit?: string;
}

export default function LiDARScanner({
  onScanComplete,
  width = 800,
  height = 600,
  unit = "ft"
}: LiDARScannerProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("simulator");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [settings, setSettings] = useState<ScanSettings>({
    resolution: 70,
    range: 30,
    accuracy: 80,
    density: 60
  });
  
  // Simulation properties
  const [simulationObjects, setSimulationObjects] = useState<any[]>([]);
  const [editingObjectIndex, setEditingObjectIndex] = useState(-1);
  
  // Canvas for editing
  const editorCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Ref for draggable elements
  const draggableRef = useRef(null);
  const { isDragging } = useDraggable(draggableRef);

  // Initialize a room simulation
  useEffect(() => {
    if (activeTab === "simulator" && simulationObjects.length === 0) {
      // Create a default room layout
      const roomWidth = 20; // in feet
      const roomHeight = 15; // in feet
      
      // Scale to canvas size
      const scaleX = width / roomWidth;
      const scaleY = height / roomHeight;
      
      // Create walls (rectangles)
      const newObjects = [
        // Floor
        {
          type: 'rect',
          x: 0,
          y: 0,
          width: width,
          height: height,
          fill: '#f0f0f0',
          stroke: '#ccc',
          label: 'Floor',
          realWidth: roomWidth,
          realHeight: roomHeight
        },
        // Walls
        {
          type: 'rect',
          x: 0,
          y: 0,
          width: width,
          height: 20,
          fill: '#ddd',
          stroke: '#999',
          label: 'North Wall',
          realWidth: roomWidth,
          realHeight: 0.5
        },
        {
          type: 'rect',
          x: 0,
          y: height - 20,
          width: width,
          height: 20,
          fill: '#ddd',
          stroke: '#999',
          label: 'South Wall',
          realWidth: roomWidth,
          realHeight: 0.5
        },
        {
          type: 'rect',
          x: 0,
          y: 0,
          width: 20,
          height: height,
          fill: '#ddd',
          stroke: '#999',
          label: 'West Wall',
          realWidth: 0.5,
          realHeight: roomHeight
        },
        {
          type: 'rect',
          x: width - 20,
          y: 0,
          width: 20,
          height: height,
          fill: '#ddd',
          stroke: '#999',
          label: 'East Wall',
          realWidth: 0.5,
          realHeight: roomHeight
        },
        // Some furniture
        {
          type: 'rect',
          x: 100,
          y: 100,
          width: 200,
          height: 120,
          fill: '#8B4513',
          stroke: '#654321',
          label: 'Table',
          realWidth: 6,
          realHeight: 3.5
        },
        {
          type: 'rect',
          x: 500,
          y: 150,
          width: 180,
          height: 80,
          fill: '#A0522D',
          stroke: '#8B4513',
          label: 'Desk',
          realWidth: 5,
          realHeight: 2.5
        },
        {
          type: 'rect',
          x: 400,
          y: 400,
          width: 240,
          height: 140,
          fill: '#556B2F',
          stroke: '#2F4F4F',
          label: 'Couch',
          realWidth: 7,
          realHeight: 3
        }
      ];
      
      setSimulationObjects(newObjects);
      
      // Initial render
      drawSimulation();
    }
  }, [activeTab]);
  
  // Update canvas when simulation objects change
  useEffect(() => {
    if (activeTab === "simulator") {
      drawSimulation();
    }
  }, [simulationObjects, activeTab]);
  
  function drawSimulation() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw objects
    simulationObjects.forEach((obj, index) => {
      if (obj.type === 'rect') {
        // Regular rectangle
        ctx.fillStyle = obj.fill;
        ctx.strokeStyle = obj.stroke;
        ctx.lineWidth = 2;
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        
        // Label
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(obj.label || `Object ${index + 1}`, obj.x + 5, obj.y + 15);
        
        // Dimensions
        const dimensionText = `${obj.realWidth}${unit} × ${obj.realHeight}${unit}`;
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.fillText(dimensionText, obj.x + 5, obj.y + 30);
      }
    });
    
    // Draw a grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;
    
    // Vertical lines every 50 pixels
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines every 50 pixels
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
  
  // Function to generate a simulated LiDAR scan
  const generateSimulatedScan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Start scanning animation
    setIsScanning(true);
    
    // We'll show a progress animation
    let progress = 0;
    const totalFrames = 20;
    const scanningInterval = setInterval(() => {
      progress++;
      
      // Get canvas context
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Draw the scene
      drawSimulation();
      
      // Draw a scanning line
      const scanY = Math.floor((progress / totalFrames) * height);
      
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();
      
      // Add some laser dots
      ctx.fillStyle = '#ff0000';
      for (let x = 0; x < width; x += 10) {
        ctx.beginPath();
        ctx.arc(x, scanY, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // When finished, generate the depth map
      if (progress >= totalFrames) {
        clearInterval(scanningInterval);
        
        // Generate a simulated depth map
        const depthMapCanvas = document.createElement('canvas');
        depthMapCanvas.width = canvas.width;
        depthMapCanvas.height = canvas.height;
        const depthCtx = depthMapCanvas.getContext('2d');
        
        if (depthCtx) {
          // Create a grayscale depth map
          // In real LiDAR, closer objects are brighter
          
          // First, fill the background (furthest distance)
          depthCtx.fillStyle = '#222';
          depthCtx.fillRect(0, 0, width, height);
          
          // Draw each object with a shade based on an imaginary "distance"
          simulationObjects.forEach((obj) => {
            if (obj.type === 'rect') {
              // Skip the floor
              if (obj.label === 'Floor') return;
              
              // Generate random distance value to create depth effect
              const distance = Math.floor(Math.random() * 155) + 100; // 100-255 range
              const shade = 255 - distance; // Closer objects are brighter
              
              depthCtx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
              depthCtx.fillRect(obj.x, obj.y, obj.width, obj.height);
            }
          });
          
          // Add some noise to make it look more realistic
          const imageData = depthCtx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            // Add random noise
            const noise = Math.floor(Math.random() * 20) - 10;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
          }
          
          depthCtx.putImageData(imageData, 0, 0);
          
          // Convert to data URL
          const depthMapDataUrl = depthMapCanvas.toDataURL();
          
          // Create a scan result
          const scanResult: ScanResult = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            depthMap: depthMapDataUrl,
            width,
            height,
            scanSetting: { ...settings }
          };
          
          // Add to results
          setScanResults(prev => [...prev, scanResult]);
          setSelectedResult(scanResult);
          
          // Notify callback
          if (onScanComplete) {
            onScanComplete(scanResult);
          }
          
          toast({
            title: "Escaneo completado",
            description: "El mapa de profundidad ha sido generado exitosamente.",
          });
        }
        
        // Done scanning
        setIsScanning(false);
      }
    }, 100);
  };
  
  // Function to start the camera
  const startCamera = async () => {
    try {
      const video = videoRef.current;
      if (!video) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: width },
          height: { ideal: height },
          facingMode: "environment" // Prefer back camera
        } 
      });
      
      video.srcObject = stream;
      video.play();
      setIsCameraActive(true);
      
      toast({
        title: "Cámara activada",
        description: "La cámara está lista para escanear.",
      });
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        title: "Error al acceder a la cámara",
        description: "No se pudo iniciar la cámara. Verifique los permisos.",
        variant: "destructive",
      });
    }
  };
  
  // Function to stop the camera
  const stopCamera = () => {
    const video = videoRef.current;
    if (!video || !video.srcObject) return;
    
    const stream = video.srcObject as MediaStream;
    const tracks = stream.getTracks();
    
    tracks.forEach(track => track.stop());
    video.srcObject = null;
    setIsCameraActive(false);
  };
  
  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  // Function to take a "fake LiDAR" scan from the camera
  const takeCameraScan = () => {
    const video = videoRef.current;
    if (!video || !isCameraActive) return;
    
    setIsScanning(true);
    
    // Create a canvas and draw the video frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      // Draw the video frame
      tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      
      // Fake depth map processing
      // In a real application this would use ML/computer vision algorithms
      // to estimate depth from a single image
      
      // Convert to grayscale first
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;
      
      // Apply edge detection for fake depth
      const edgeCanvas = document.createElement('canvas');
      edgeCanvas.width = tempCanvas.width;
      edgeCanvas.height = tempCanvas.height;
      const edgeCtx = edgeCanvas.getContext('2d');
      
      if (edgeCtx) {
        // First, draw the original image
        edgeCtx.drawImage(tempCanvas, 0, 0);
        
        // Then, grayscale it and apply a simple sobel-like filter
        const edgeData = edgeCtx.getImageData(0, 0, edgeCanvas.width, edgeCanvas.height);
        const edgeD = edgeData.data;
        
        for (let y = 1; y < edgeCanvas.height - 1; y++) {
          for (let x = 1; x < edgeCanvas.width - 1; x++) {
            const idx = (y * edgeCanvas.width + x) * 4;
            
            // Convert to grayscale
            const r = edgeD[idx];
            const g = edgeD[idx + 1];
            const b = edgeD[idx + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Simple edge detection
            const idx_up = ((y - 1) * edgeCanvas.width + x) * 4;
            const idx_down = ((y + 1) * edgeCanvas.width + x) * 4;
            const idx_left = (y * edgeCanvas.width + (x - 1)) * 4;
            const idx_right = (y * edgeCanvas.width + (x + 1)) * 4;
            
            const gray_up = 0.299 * edgeD[idx_up] + 0.587 * edgeD[idx_up + 1] + 0.114 * edgeD[idx_up + 2];
            const gray_down = 0.299 * edgeD[idx_down] + 0.587 * edgeD[idx_down + 1] + 0.114 * edgeD[idx_down + 2];
            const gray_left = 0.299 * edgeD[idx_left] + 0.587 * edgeD[idx_left + 1] + 0.114 * edgeD[idx_left + 2];
            const gray_right = 0.299 * edgeD[idx_right] + 0.587 * edgeD[idx_right + 1] + 0.114 * edgeD[idx_right + 2];
            
            // Calculate gradient magnitude
            const gx = gray_right - gray_left;
            const gy = gray_down - gray_up;
            let edgeMagnitude = Math.sqrt(gx * gx + gy * gy);
            
            // Threshold and invert (edges are darker in our fake depth map)
            edgeMagnitude = edgeMagnitude > 20 ? 0 : 255 - gray;
            
            // Set the pixel
            edgeD[idx] = edgeMagnitude;
            edgeD[idx + 1] = edgeMagnitude;
            edgeD[idx + 2] = edgeMagnitude;
          }
        }
        
        edgeCtx.putImageData(edgeData, 0, 0);
        
        // Apply a "thermal" color map for visualization
        const depthCanvas = document.createElement('canvas');
        depthCanvas.width = tempCanvas.width;
        depthCanvas.height = tempCanvas.height;
        const depthCtx = depthCanvas.getContext('2d');
        
        if (depthCtx) {
          // Draw the edge map
          depthCtx.drawImage(edgeCanvas, 0, 0);
          
          // Apply a color map
          const depthData = depthCtx.getImageData(0, 0, depthCanvas.width, depthCanvas.height);
          const depthD = depthData.data;
          
          for (let i = 0; i < depthD.length; i += 4) {
            const v = depthD[i]; // grayscale value
            
            // Simple "thermal" color map (blue to red)
            if (v < 85) {
              depthD[i] = 0;
              depthD[i + 1] = 0;
              depthD[i + 2] = 255 - v * 3;
            } else if (v < 170) {
              depthD[i] = 0;
              depthD[i + 1] = (v - 85) * 3;
              depthD[i + 2] = 0;
            } else {
              depthD[i] = (v - 170) * 3;
              depthD[i + 1] = 255 - (v - 170) * 3;
              depthD[i + 2] = 0;
            }
          }
          
          depthCtx.putImageData(depthData, 0, 0);
          
          // Create a scan result
          const scanResult: ScanResult = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            depthMap: depthCanvas.toDataURL(),
            width: depthCanvas.width,
            height: depthCanvas.height,
            scanSetting: { ...settings }
          };
          
          // Add to results
          setScanResults(prev => [...prev, scanResult]);
          setSelectedResult(scanResult);
          
          // Notify callback
          if (onScanComplete) {
            onScanComplete(scanResult);
          }
          
          toast({
            title: "Escaneo completado",
            description: "El mapa de profundidad ha sido generado a partir de la imagen de la cámara.",
          });
        }
      }
    }
    
    // Simulate scanning delay
    setTimeout(() => {
      setIsScanning(false);
    }, 1500);
  };
  
  // Function to handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create a canvas and draw the image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0);
          
          // Same fake depth map processing as in takeCameraScan
          // ... (would duplicate the image processing code)
          
          // For brevity, let's just create a grayscale version
          const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
          
          tempCtx.putImageData(imageData, 0, 0);
          
          // Create a scan result
          const scanResult: ScanResult = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            depthMap: tempCanvas.toDataURL(),
            width: tempCanvas.width,
            height: tempCanvas.height,
            scanSetting: { ...settings }
          };
          
          // Add to results
          setScanResults(prev => [...prev, scanResult]);
          setSelectedResult(scanResult);
          
          // Notify callback
          if (onScanComplete) {
            onScanComplete(scanResult);
          }
          
          toast({
            title: "Escaneo completado",
            description: "El mapa de profundidad ha sido generado a partir de la imagen subida.",
          });
          
          setIsScanning(false);
        }
      };
      img.src = event.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  };

  // Function to download the selected scan
  const downloadScan = () => {
    if (!selectedResult) return;
    
    // Create a download link
    const link = document.createElement('a');
    link.href = selectedResult.depthMap;
    link.download = `depth-scan-${new Date(selectedResult.timestamp).toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Descarga iniciada",
      description: "El mapa de profundidad ha sido descargado.",
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Simulador de Escáner LiDAR</CardTitle>
        <CardDescription>
          Escanee espacios en 3D y genere mapas de profundidad para mediciones precisas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="simulator">Simulador</TabsTrigger>
            <TabsTrigger value="camera">Cámara</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>
          
          {/* Simulator Tab */}
          <TabsContent value="simulator" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                disabled={isScanning}
                onClick={generateSimulatedScan}
              >
                {isScanning ? (
                  <>
                    <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                    Escaneando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Iniciar Escaneo
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                disabled={isScanning}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Editar Simulación
              </Button>
            </div>
            
            <div 
              className="border rounded-md overflow-hidden"
              style={{ width: `${width}px`, height: `${height}px`, margin: '0 auto' }}
            >
              <canvas 
                ref={canvasRef}
                width={width}
                height={height}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="range">Rango ({settings.range} {unit})</Label>
                <Slider 
                  id="range"
                  min={1} 
                  max={100} 
                  step={1}
                  value={[settings.range]}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, range: value[0] }))}
                  disabled={isScanning}
                />
              </div>
              <div>
                <Label htmlFor="resolution">Resolución ({settings.resolution}%)</Label>
                <Slider 
                  id="resolution"
                  min={10} 
                  max={100} 
                  step={1}
                  value={[settings.resolution]}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, resolution: value[0] }))}
                  disabled={isScanning}
                />
              </div>
              <div>
                <Label htmlFor="accuracy">Precisión ({settings.accuracy}%)</Label>
                <Slider 
                  id="accuracy"
                  min={10} 
                  max={100} 
                  step={1}
                  value={[settings.accuracy]}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, accuracy: value[0] }))}
                  disabled={isScanning}
                />
              </div>
              <div>
                <Label htmlFor="density">Densidad ({settings.density}%)</Label>
                <Slider 
                  id="density"
                  min={10} 
                  max={100} 
                  step={1}
                  value={[settings.density]}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, density: value[0] }))}
                  disabled={isScanning}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Camera Tab */}
          <TabsContent value="camera" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {!isCameraActive ? (
                <Button onClick={startCamera}>
                  <Camera className="h-4 w-4 mr-2" />
                  Activar Cámara
                </Button>
              ) : (
                <>
                  <Button
                    disabled={isScanning}
                    onClick={takeCameraScan}
                  >
                    {isScanning ? (
                      <>
                        <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                        Escaneando...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Tomar Escaneo
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={stopCamera}
                  >
                    Desactivar Cámara
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir Imagen
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            <div 
              className="border rounded-md overflow-hidden relative"
              style={{ width: `${width}px`, height: `${height}px`, margin: '0 auto' }}
            >
              <video 
                ref={videoRef}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: isCameraActive ? 'block' : 'none'
                }}
                playsInline
              />
              
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center">
                    <RotateCw className="h-12 w-12 animate-spin mx-auto" />
                    <p className="mt-2 text-lg font-medium">Escaneando...</p>
                  </div>
                </div>
              )}
              
              {!isCameraActive && !isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">
                      Active la cámara o suba una imagen
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="text-sm font-medium mb-2">Notas sobre el Escaneo con Cámara</h3>
              <p className="text-sm text-muted-foreground">
                El escaneo con cámara utiliza técnicas de visión por computador para simular un mapa de profundidad 
                a partir de una imagen 2D. En un dispositivo real, se utilizaría un sensor LiDAR o un sistema de cámaras 
                estéreo para capturar datos 3D reales. Los resultados mostrados son aproximados.
              </p>
            </div>
          </TabsContent>
          
          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {scanResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">Escaneos Guardados</h3>
                  <div className="flex overflow-x-auto gap-2 pb-2">
                    {scanResults.map((result) => (
                      <div 
                        key={result.id} 
                        className={`border rounded-md p-1 cursor-pointer flex-shrink-0 ${
                          selectedResult?.id === result.id ? 'border-primary ring-2 ring-primary/20' : ''
                        }`}
                        onClick={() => setSelectedResult(result)}
                      >
                        <img 
                          src={result.depthMap} 
                          alt={`Scan from ${new Date(result.timestamp).toLocaleString()}`}
                          style={{ width: '100px', height: '75px', objectFit: 'cover' }}
                        />
                        <div className="text-xs text-center mt-1">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedResult && (
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-md font-medium">Detalle del Escaneo</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedResult.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={downloadScan}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden mb-4">
                      <img 
                        src={selectedResult.depthMap} 
                        alt="Depth Map" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '400px', 
                          margin: '0 auto', 
                          display: 'block'
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Resolución:</span> {selectedResult.scanSetting.resolution}%
                      </div>
                      <div>
                        <span className="font-medium">Rango:</span> {selectedResult.scanSetting.range} {unit}
                      </div>
                      <div>
                        <span className="font-medium">Precisión:</span> {selectedResult.scanSetting.accuracy}%
                      </div>
                      <div>
                        <span className="font-medium">Densidad:</span> {selectedResult.scanSetting.density}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <Maximize />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay resultados</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Realice un escaneo para ver los resultados aquí.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Este es un simulador para demostración. Para mediciones reales, utilice un dispositivo con LiDAR.
        </div>
        <Button variant="outline" size="sm" onClick={() => setActiveTab("simulator")}>
          <Settings className="h-4 w-4 mr-2" />
          Configuración
        </Button>
      </CardFooter>
    </Card>
  );
}