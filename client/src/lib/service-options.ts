// Importamos los tipos primero
import { ServicePrice, MaterialPrice } from '@/hooks/use-pricing';

// Define available service types
export const SERVICE_TYPES = [
  { value: "roof", label: "Roof", icon: "roof" },
  { value: "siding", label: "Siding", icon: "siding" },
  { value: "deck", label: "Deck", icon: "deck" },
  { value: "fence", label: "Fence", icon: "fence" },
  { value: "windows", label: "Windows", icon: "windows" },
  { value: "gutters", label: "Gutters", icon: "gutters" }
];

// Define labor rates by service type
export const LABOR_RATES_BY_SERVICE = {
  roof: { hourlyRate: 65, baseHours: 8 },
  siding: { hourlyRate: 55, baseHours: 6 },
  deck: { hourlyRate: 60, baseHours: 10 },
  fence: { hourlyRate: 50, baseHours: 6 },
  windows: { hourlyRate: 70, baseHours: 4 },
  gutters: { hourlyRate: 45, baseHours: 5 }
};

// Define materials by service type
export const MATERIALS_BY_SERVICE = {
  roof: [
    { id: "asphalt_shingles", name: "Asphalt Shingles", unit: "sq.ft", unitPrice: 4.25 },
    { id: "metal_roofing", name: "Metal Roofing", unit: "sq.ft", unitPrice: 9.50 },
    { id: "tile_roofing", name: "Tile Roofing", unit: "sq.ft", unitPrice: 12.00 },
    { id: "slate_roofing", name: "Slate Roofing", unit: "sq.ft", unitPrice: 15.75 }
  ],
  siding: [
    { id: "vinyl_siding", name: "Vinyl Siding", unit: "sq.ft", unitPrice: 4.00 },
    { id: "fiber_cement", name: "Fiber Cement", unit: "sq.ft", unitPrice: 7.50 },
    { id: "wood_siding", name: "Wood Siding", unit: "sq.ft", unitPrice: 8.75 },
    { id: "metal_siding", name: "Metal Siding", unit: "sq.ft", unitPrice: 6.25 }
  ],
  deck: [
    { id: "pressure_treated", name: "Pressure Treated Wood", unit: "sq.ft", unitPrice: 8.50 },
    { id: "cedar_deck", name: "Cedar", unit: "sq.ft", unitPrice: 12.75 },
    { id: "composite_deck", name: "Composite", unit: "sq.ft", unitPrice: 16.00 },
    { id: "pvc_deck", name: "PVC", unit: "sq.ft", unitPrice: 18.50 }
  ],
  fence: [
    { id: "wood_fence", name: "Wood Fence", unit: "ln.ft", unitPrice: 22.00 },
    { id: "vinyl_fence", name: "Vinyl Fence", unit: "ln.ft", unitPrice: 28.50 },
    { id: "chain_link", name: "Chain Link Fence", unit: "ln.ft", unitPrice: 15.00 },
    { id: "aluminum_fence", name: "Aluminum Fence", unit: "ln.ft", unitPrice: 32.00 }
  ],
  windows: [
    { id: "single_hung", name: "Single Hung Window", unit: "unit", unitPrice: 225.00 },
    { id: "double_hung", name: "Double Hung Window", unit: "unit", unitPrice: 325.00 },
    { id: "casement", name: "Casement Window", unit: "unit", unitPrice: 375.00 },
    { id: "sliding", name: "Sliding Window", unit: "unit", unitPrice: 300.00 }
  ],
  gutters: [
    { id: "aluminum_gutters", name: "Aluminum Gutters", unit: "ln.ft", unitPrice: 7.50 },
    { id: "vinyl_gutters", name: "Vinyl Gutters", unit: "ln.ft", unitPrice: 5.75 },
    { id: "copper_gutters", name: "Copper Gutters", unit: "ln.ft", unitPrice: 18.00 },
    { id: "steel_gutters", name: "Steel Gutters", unit: "ln.ft", unitPrice: 9.25 }
  ]
};

// Define additional options by service type
export const OPTIONS_BY_SERVICE = {
  roof: [
    { id: "roof_vents", name: "Roof Vents", unit: "unit", unitPrice: 65.00 },
    { id: "skylight", name: "Skylight", unit: "unit", unitPrice: 350.00 },
    { id: "chimney_flashing", name: "Chimney Flashing", unit: "unit", unitPrice: 120.00 },
    { id: "drip_edge", name: "Drip Edge", unit: "ln.ft", unitPrice: 2.50 },
    { id: "roof_removal", name: "Old Roof Removal", unit: "sq.ft", unitPrice: 1.50 }
  ],
  siding: [
    { id: "insulation", name: "Insulation", unit: "sq.ft", unitPrice: 1.75 },
    { id: "trim_pieces", name: "Trim Pieces", unit: "ln.ft", unitPrice: 3.50 },
    { id: "corner_posts", name: "Corner Posts", unit: "unit", unitPrice: 25.00 },
    { id: "j_channel", name: "J-Channel", unit: "ln.ft", unitPrice: 2.00 },
    { id: "siding_removal", name: "Old Siding Removal", unit: "sq.ft", unitPrice: 1.25 }
  ],
  deck: [
    { id: "deck_railing", name: "Deck Railing", unit: "ln.ft", unitPrice: 32.00 },
    { id: "deck_stairs", name: "Deck Stairs", unit: "step", unitPrice: 45.00 },
    { id: "post_caps", name: "Post Caps", unit: "unit", unitPrice: 15.00 },
    { id: "deck_lighting", name: "Deck Lighting", unit: "unit", unitPrice: 35.00 },
    { id: "deck_seal", name: "Sealing & Finishing", unit: "sq.ft", unitPrice: 3.25 }
  ],
  fence: [
    { id: "fence_gate", name: "Fence Gate", unit: "unit", unitPrice: 150.00 },
    { id: "post_caps", name: "Post Caps", unit: "unit", unitPrice: 12.00 },
    { id: "lattice", name: "Lattice", unit: "sq.ft", unitPrice: 5.50 },
    { id: "fence_stain", name: "Fence Stain", unit: "gallon", unitPrice: 38.00 },
    { id: "fence_removal", name: "Old Fence Removal", unit: "ln.ft", unitPrice: 8.00 }
  ],
  windows: [
    { id: "window_grids", name: "Window Grids", unit: "unit", unitPrice: 45.00 },
    { id: "window_screens", name: "Window Screens", unit: "unit", unitPrice: 35.00 },
    { id: "window_trim", name: "Window Trim", unit: "unit", unitPrice: 65.00 },
    { id: "low_e_glass", name: "Low-E Glass", unit: "unit", unitPrice: 120.00 },
    { id: "window_removal", name: "Old Window Removal", unit: "unit", unitPrice: 75.00 }
  ],
  gutters: [
    { id: "downspouts", name: "Downspouts", unit: "unit", unitPrice: 25.00 },
    { id: "gutter_guards", name: "Gutter Guards", unit: "ln.ft", unitPrice: 4.25 },
    { id: "splash_blocks", name: "Splash Blocks", unit: "unit", unitPrice: 15.00 },
    { id: "gutter_corners", name: "Gutter Corners", unit: "unit", unitPrice: 12.50 },
    { id: "gutter_removal", name: "Old Gutter Removal", unit: "ln.ft", unitPrice: 3.00 }
  ]
};

// General information by service type
export const SERVICE_INFO = {
  roof: {
    description: "Estimate for new roof installation, repair or replacement.",
    helpText: "Enter the roof dimensions (length and width) to calculate the total area in square feet.",
    recommendedMaterials: ["asphalt_shingles", "metal_roofing"],
    recommendedOptions: ["roof_vents", "drip_edge"],
    unitType: "sq.ft",
    icon: "🏠",
    color: "#3b82f6",
    benefits: ["Enhances property value", "Protects from weather elements", "Energy efficient options available"]
  },
  siding: {
    description: "Estimate for exterior siding installation or replacement.",
    helpText: "Enter the wall dimensions (length and height) to calculate the total area in square feet.",
    recommendedMaterials: ["vinyl_siding", "fiber_cement"],
    recommendedOptions: ["insulation", "trim_pieces"],
    unitType: "sq.ft",
    icon: "🏢",
    color: "#10b981",
    benefits: ["Improves curb appeal", "Increases energy efficiency", "Low maintenance options"]
  },
  deck: {
    description: "Estimate for deck construction or repair.",
    helpText: "Enter the deck dimensions (length and width) to calculate the total area in square feet.",
    recommendedMaterials: ["pressure_treated", "composite_deck"],
    recommendedOptions: ["deck_railing", "deck_stairs"],
    unitType: "sq.ft",
    icon: "🏞️",
    color: "#8b5cf6",
    benefits: ["Creates outdoor living space", "Increases property value", "Customizable to your lifestyle"]
  },
  fence: {
    description: "Estimate for fence installation or repair.",
    helpText: "Enter the total fence length in linear feet.",
    recommendedMaterials: ["wood_fence", "vinyl_fence"],
    recommendedOptions: ["fence_gate", "post_caps"],
    unitType: "ln.ft",
    icon: "🧱",
    color: "#ef4444",
    benefits: ["Enhances property security", "Defines property boundaries", "Provides privacy"]
  },
  windows: {
    description: "Estimate for window installation or replacement.",
    helpText: "Enter the number of windows to install or replace.",
    recommendedMaterials: ["double_hung", "casement"],
    recommendedOptions: ["window_screens", "low_e_glass"],
    unitType: "unit",
    icon: "🪟",
    color: "#f59e0b",
    benefits: ["Improves energy efficiency", "Enhances aesthetics", "Reduces outside noise"]
  },
  gutters: {
    description: "Estimate for gutter installation or repair.",
    helpText: "Enter the total gutter length in linear feet.",
    recommendedMaterials: ["aluminum_gutters", "vinyl_gutters"],
    recommendedOptions: ["downspouts", "gutter_guards"],
    unitType: "ln.ft",
    icon: "💧",
    color: "#6366f1",
    benefits: ["Prevents water damage", "Protects foundation", "Reduces soil erosion"]
  }
};

// Helper functions
export function getServiceLabel(serviceType: string): string {
  const service = SERVICE_TYPES.find(s => s.value === serviceType);
  return service ? service.label : serviceType;
}

// Versión original para compatibilidad
export function getMaterial(serviceType: string, materialId: string) {
  const materials = MATERIALS_BY_SERVICE[serviceType as keyof typeof MATERIALS_BY_SERVICE] || [];
  return materials.find(m => m.id === materialId);
}

// Versión avanzada que utiliza los precios configurados
export function getMaterialWithConfiguredPrice(
  serviceType: string, 
  materialId: string, 
  configuredMaterials: MaterialPrice[]
) {
  // Primero buscamos en los materiales configurados
  const configuredMaterial = configuredMaterials.find(m => 
    m.id === materialId || (m.category === serviceType && m.id.includes(materialId))
  );
  
  // Si encontramos un precio configurado, lo usamos
  if (configuredMaterial) {
    return {
      id: configuredMaterial.id,
      name: configuredMaterial.name,
      unit: configuredMaterial.unit,
      unitPrice: configuredMaterial.unitPrice
    };
  }
  
  // Si no, usamos el predeterminado
  return getMaterial(serviceType, materialId);
}

export function getOption(serviceType: string, optionId: string) {
  const options = OPTIONS_BY_SERVICE[serviceType as keyof typeof OPTIONS_BY_SERVICE] || [];
  return options.find(o => o.id === optionId);
}

export function getServiceInfo(serviceType: string) {
  return SERVICE_INFO[serviceType as keyof typeof SERVICE_INFO];
}

// Función para obtener el precio base de un servicio usando los precios configurados
export function getServiceBasePrice(
  serviceType: string, 
  configuredServices: ServicePrice[]
) {
  // Buscamos en los servicios configurados
  const configuredService = configuredServices.find(s => 
    s.serviceType === serviceType
  );
  
  // Si encontramos un precio configurado, lo usamos
  if (configuredService) {
    return {
      unitPrice: configuredService.unitPrice,
      unit: configuredService.unit,
      laborRate: configuredService.laborRate,
      laborMethod: configuredService.laborMethod
    };
  }
  
  // Valores predeterminados por tipo de servicio si no hay configuración
  const defaultPrices: Record<string, any> = {
    roof: { unitPrice: 8.7, unit: 'sqft', laborRate: 3.5, laborMethod: 'by_area' },
    fence: { unitPrice: 28, unit: 'ft', laborRate: 14, laborMethod: 'by_length' },
    deck: { unitPrice: 35, unit: 'sqft', laborRate: 15, laborMethod: 'by_area' },
    gutters: { unitPrice: 12, unit: 'ft', laborRate: 7, laborMethod: 'by_length' },
    windows: { unitPrice: 45, unit: 'unit', laborRate: 85, laborMethod: 'fixed' },
    siding: { unitPrice: 8, unit: 'sqft', laborRate: 4, laborMethod: 'by_area' },
  };
  
  return defaultPrices[serviceType] || { unitPrice: 10, unit: 'ft', laborRate: 5, laborMethod: 'by_length' };
}

// Funciones de cálculo básicas para cotizaciones
export function calculateArea(length: number, width: number): number {
  return length * width;
}

export function calculatePerimeter(length: number, width: number): number {
  return 2 * (length + width);
}