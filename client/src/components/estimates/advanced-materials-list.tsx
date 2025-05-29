import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, Package, DollarSign, Edit3, Trash2 } from "lucide-react";

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: string;
  serviceType: string;
  notes?: string;
}

interface AdvancedMaterialsListProps {
  services: any[];
  onMaterialsChange: (materials: MaterialItem[]) => void;
}

export default function AdvancedMaterialsList({ services, onMaterialsChange }: AdvancedMaterialsListProps) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);

  // Generate materials from services when they change
  useEffect(() => {
    const generatedMaterials: MaterialItem[] = [];

    services.forEach((service, serviceIndex) => {
      if (service.serviceType === "fence") {
        const linearFeet = service.measurements?.linearFeet || 0;
        const gates = service.measurements?.units || 0;

        if (linearFeet > 0) {
          // Posts & Foundation
          const posts = Math.ceil(linearFeet / 8);
          generatedMaterials.push({
            id: `fence-posts-${serviceIndex}`,
            name: "Fence Posts (6x6 PT)",
            quantity: posts,
            unit: "pieces",
            unitPrice: 25.00,
            total: posts * 25.00,
            category: "Posts & Foundation",
            serviceType: "fence",
            notes: "8ft spacing"
          });

          generatedMaterials.push({
            id: `concrete-${serviceIndex}`,
            name: "Concrete Mix",
            quantity: posts * 2,
            unit: "bags",
            unitPrice: 4.50,
            total: posts * 2 * 4.50,
            category: "Posts & Foundation",
            serviceType: "fence"
          });

          generatedMaterials.push({
            id: `post-anchors-${serviceIndex}`,
            name: "Post Anchors",
            quantity: posts,
            unit: "pieces",
            unitPrice: 3.00,
            total: posts * 3.00,
            category: "Posts & Foundation",
            serviceType: "fence"
          });

          // Panels & Hardware
          const panels = Math.ceil(linearFeet / 8);
          generatedMaterials.push({
            id: `fence-panels-${serviceIndex}`,
            name: "Fence Panels (8ft)",
            quantity: panels,
            unit: "pieces",
            unitPrice: 45.00,
            total: panels * 45.00,
            category: "Panels & Hardware",
            serviceType: "fence"
          });

          generatedMaterials.push({
            id: `rails-${serviceIndex}`,
            name: "Rails (2x4 PT)",
            quantity: panels * 2,
            unit: "pieces",
            unitPrice: 8.00,
            total: panels * 2 * 8.00,
            category: "Panels & Hardware",
            serviceType: "fence"
          });

          generatedMaterials.push({
            id: `screws-${serviceIndex}`,
            name: "Deck Screws",
            quantity: Math.ceil(linearFeet / 10),
            unit: "lbs",
            unitPrice: 12.00,
            total: Math.ceil(linearFeet / 10) * 12.00,
            category: "Panels & Hardware",
            serviceType: "fence"
          });

          // Optional Post Caps
          generatedMaterials.push({
            id: `post-caps-${serviceIndex}`,
            name: "Post Caps (Optional)",
            quantity: posts,
            unit: "pieces",
            unitPrice: 8.00,
            total: posts * 8.00,
            category: "Finishing (Optional)",
            serviceType: "fence"
          });
        }

        // Gates - Independent items
        if (gates > 0) {
          generatedMaterials.push({
            id: `gate-hardware-${serviceIndex}`,
            name: "Gate Hardware Set",
            quantity: gates,
            unit: "sets",
            unitPrice: 85.00,
            total: gates * 85.00,
            category: "Gates",
            serviceType: "fence",
            notes: "Adjustable price per gate type"
          });

          generatedMaterials.push({
            id: `gate-frames-${serviceIndex}`,
            name: "Gate Frame & Panel",
            quantity: gates,
            unit: "pieces",
            unitPrice: 120.00,
            total: gates * 120.00,
            category: "Gates",
            serviceType: "fence",
            notes: "Custom sized"
          });
        }
      }

      if (service.serviceType === "deck") {
        const squareFeet = service.measurements?.squareFeet || 0;
        
        if (squareFeet > 0) {
          // Deck materials
          generatedMaterials.push({
            id: `deck-boards-${serviceIndex}`,
            name: "Deck Boards",
            quantity: Math.ceil(squareFeet * 1.1), // 10% waste
            unit: "sq ft",
            unitPrice: 3.50,
            total: Math.ceil(squareFeet * 1.1) * 3.50,
            category: "Decking",
            serviceType: "deck"
          });

          const joists = Math.ceil(squareFeet / 16);
          generatedMaterials.push({
            id: `deck-joists-${serviceIndex}`,
            name: "Deck Joists (2x8)",
            quantity: joists,
            unit: "pieces",
            unitPrice: 15.00,
            total: joists * 15.00,
            category: "Structure",
            serviceType: "deck"
          });
        }
      }

      if (service.serviceType === "roof") {
        const squareFeet = service.measurements?.squareFeet || 0;
        
        if (squareFeet > 0) {
          const squares = Math.ceil(squareFeet / 100); // Roofing squares
          
          generatedMaterials.push({
            id: `shingles-${serviceIndex}`,
            name: "Asphalt Shingles",
            quantity: squares,
            unit: "squares",
            unitPrice: 120.00,
            total: squares * 120.00,
            category: "Roofing",
            serviceType: "roof"
          });

          generatedMaterials.push({
            id: `underlayment-${serviceIndex}`,
            name: "Roofing Underlayment",
            quantity: squares,
            unit: "squares",
            unitPrice: 45.00,
            total: squares * 45.00,
            category: "Roofing",
            serviceType: "roof"
          });
        }
      }

      if (service.serviceType === "windows") {
        const units = service.measurements?.units || 0;
        
        if (units > 0) {
          generatedMaterials.push({
            id: `windows-${serviceIndex}`,
            name: "Window Units",
            quantity: units,
            unit: "pieces",
            unitPrice: 450.00,
            total: units * 450.00,
            category: "Windows",
            serviceType: "windows"
          });

          generatedMaterials.push({
            id: `window-trim-${serviceIndex}`,
            name: "Window Trim Kit",
            quantity: units,
            unit: "kits",
            unitPrice: 35.00,
            total: units * 35.00,
            category: "Windows",
            serviceType: "windows"
          });
        }
      }

      if (service.serviceType === "gutters") {
        const linearFeet = service.measurements?.linearFeet || 0;
        
        if (linearFeet > 0) {
          generatedMaterials.push({
            id: `gutters-${serviceIndex}`,
            name: "Seamless Gutters",
            quantity: linearFeet,
            unit: "linear ft",
            unitPrice: 8.50,
            total: linearFeet * 8.50,
            category: "Gutters",
            serviceType: "gutters"
          });

          const downspouts = Math.ceil(linearFeet / 35);
          generatedMaterials.push({
            id: `downspouts-${serviceIndex}`,
            name: "Downspouts",
            quantity: downspouts,
            unit: "pieces",
            unitPrice: 25.00,
            total: downspouts * 25.00,
            category: "Gutters",
            serviceType: "gutters"
          });
        }
      }
    });

    // Remove duplicates and merge similar items
    const mergedMaterials = mergeSimilarMaterials(generatedMaterials);
    setMaterials(mergedMaterials);
    onMaterialsChange(mergedMaterials);
  }, [services]);

  const mergeSimilarMaterials = (materials: MaterialItem[]): MaterialItem[] => {
    const merged: { [key: string]: MaterialItem } = {};

    materials.forEach(material => {
      const key = `${material.name}-${material.unitPrice}`;
      
      if (merged[key]) {
        // Merge quantities
        merged[key].quantity += material.quantity;
        merged[key].total += material.total;
      } else {
        merged[key] = { ...material };
      }
    });

    return Object.values(merged);
  };

  const updateMaterial = (id: string, updates: Partial<MaterialItem>) => {
    const updatedMaterials = materials.map(material => {
      if (material.id === id) {
        const updated = { ...material, ...updates };
        if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return material;
    });
    
    setMaterials(updatedMaterials);
    onMaterialsChange(updatedMaterials);
  };

  const deleteMaterial = (id: string) => {
    const updatedMaterials = materials.filter(m => m.id !== id);
    setMaterials(updatedMaterials);
    onMaterialsChange(updatedMaterials);
  };

  const addCustomMaterial = () => {
    const newMaterial: MaterialItem = {
      id: `custom-${Date.now()}`,
      name: "Custom Material",
      quantity: 1,
      unit: "pieces",
      unitPrice: 0.00,
      total: 0.00,
      category: "Custom",
      serviceType: "custom"
    };
    
    const updatedMaterials = [...materials, newMaterial];
    setMaterials(updatedMaterials);
    onMaterialsChange(updatedMaterials);
    setEditingMaterial(newMaterial.id);
  };

  // Group materials by category
  const groupedMaterials = materials.reduce((groups, material) => {
    const category = material.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(material);
    return groups;
  }, {} as { [key: string]: MaterialItem[] });

  const totalCost = materials.reduce((sum, material) => sum + material.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Advanced Materials List
        </CardTitle>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <DollarSign className="h-4 w-4 mr-1" />
            Total: ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Badge>
          <Button onClick={addCustomMaterial} variant="outline" size="sm">
            Add Custom Material
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedMaterials).map(([category, categoryMaterials]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-semibold text-primary border-b pb-2">
              {category}
            </h3>
            <div className="space-y-2">
              {categoryMaterials.map(material => (
                <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  {editingMaterial === material.id ? (
                    <div className="flex-1 grid grid-cols-5 gap-2">
                      <Input
                        value={material.name}
                        onChange={(e) => updateMaterial(material.id, { name: e.target.value })}
                        placeholder="Material name"
                      />
                      <Input
                        type="number"
                        value={material.quantity}
                        onChange={(e) => updateMaterial(material.id, { quantity: parseInt(e.target.value) || 0 })}
                        placeholder="Qty"
                      />
                      <Input
                        value={material.unit}
                        onChange={(e) => updateMaterial(material.id, { unit: e.target.value })}
                        placeholder="Unit"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={material.unitPrice}
                        onChange={(e) => updateMaterial(material.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        placeholder="Price"
                      />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => setEditingMaterial(null)}>
                          ✓
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteMaterial(material.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{material.name}</span>
                          {material.notes && (
                            <Badge variant="secondary" className="text-xs">
                              {material.notes}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {material.quantity} {material.unit} × ${material.unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          ${material.total.toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingMaterial(material.id)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <Separator />
          </div>
        ))}
        
        {materials.length === 0 && (
          <div className="text-center py-8">
            <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No materials calculated yet</p>
            <p className="text-sm text-gray-400">Add services with measurements to generate materials</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}