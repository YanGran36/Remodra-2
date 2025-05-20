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

// Define materials by service type (precio base = 0, se actualiza con la configuración)
export const MATERIALS_BY_SERVICE = {
  roof: [
    { id: "asphalt_shingles", name: "Asphalt Shingles", unit: "sq.ft", unitPrice: 0 },
    { id: "metal_roofing", name: "Metal Roofing", unit: "sq.ft", unitPrice: 0 },
    { id: "tile_roofing", name: "Tile Roofing", unit: "sq.ft", unitPrice: 0 },
    { id: "slate_roofing", name: "Slate Roofing", unit: "sq.ft", unitPrice: 0 }
  ],
  siding: [
    { id: "vinyl_siding", name: "Vinyl Siding", unit: "sq.ft", unitPrice: 0 },
    { id: "fiber_cement", name: "Fiber Cement", unit: "sq.ft", unitPrice: 0 },
    { id: "wood_siding", name: "Wood Siding", unit: "sq.ft", unitPrice: 0 },
    { id: "metal_siding", name: "Metal Siding", unit: "sq.ft", unitPrice: 0 }
  ],
  deck: [
    { id: "pressure_treated", name: "Pressure Treated Wood", unit: "sq.ft", unitPrice: 0 },
    { id: "cedar_deck", name: "Cedar", unit: "sq.ft", unitPrice: 0 },
    { id: "composite_deck", name: "Composite", unit: "sq.ft", unitPrice: 0 },
    { id: "pvc_deck", name: "PVC", unit: "sq.ft", unitPrice: 0 }
  ],
  fence: [
    { id: "wood_fence", name: "Wood Fence", unit: "ln.ft", unitPrice: 0 },
    { id: "vinyl_fence", name: "Vinyl Fence", unit: "ln.ft", unitPrice: 0 },
    { id: "chain_link", name: "Chain Link Fence", unit: "ln.ft", unitPrice: 0 },
    { id: "aluminum_fence", name: "Aluminum Fence", unit: "ln.ft", unitPrice: 0 }
  ],
  windows: [
    { id: "single_hung", name: "Single Hung Window", unit: "unit", unitPrice: 0 },
    { id: "double_hung", name: "Double Hung Window", unit: "unit", unitPrice: 0 },
    { id: "casement", name: "Casement Window", unit: "unit", unitPrice: 0 },
    { id: "sliding", name: "Sliding Window", unit: "unit", unitPrice: 0 }
  ],
  gutters: [
    { id: "aluminum_gutters", name: "Aluminum Gutters", unit: "ln.ft", unitPrice: 0 },
    { id: "vinyl_gutters", name: "Vinyl Gutters", unit: "ln.ft", unitPrice: 0 },
    { id: "copper_gutters", name: "Copper Gutters", unit: "ln.ft", unitPrice: 0 },
    { id: "steel_gutters", name: "Steel Gutters", unit: "ln.ft", unitPrice: 0 }
  ]
};

// Define additional options by service type (precios base = 0, se actualizan con la configuración)
export const OPTIONS_BY_SERVICE = {
  roof: [
    { id: "roof_vents", name: "Roof Vents", unit: "unit", unitPrice: 0 },
    { id: "skylight", name: "Skylight", unit: "unit", unitPrice: 0 },
    { id: "chimney_flashing", name: "Chimney Flashing", unit: "unit", unitPrice: 0 },
    { id: "drip_edge", name: "Drip Edge", unit: "ln.ft", unitPrice: 0 },
    { id: "roof_removal", name: "Old Roof Removal", unit: "sq.ft", unitPrice: 0 }
  ],
  siding: [
    { id: "insulation", name: "Insulation", unit: "sq.ft", unitPrice: 0 },
    { id: "trim_pieces", name: "Trim Pieces", unit: "ln.ft", unitPrice: 0 },
    { id: "corner_posts", name: "Corner Posts", unit: "unit", unitPrice: 0 },
    { id: "j_channel", name: "J-Channel", unit: "ln.ft", unitPrice: 0 },
    { id: "siding_removal", name: "Old Siding Removal", unit: "sq.ft", unitPrice: 0 }
  ],
  deck: [
    { id: "deck_railing", name: "Deck Railing", unit: "ln.ft", unitPrice: 0 },
    { id: "deck_stairs", name: "Deck Stairs", unit: "step", unitPrice: 0 },
    { id: "post_caps", name: "Post Caps", unit: "unit", unitPrice: 0 },
    { id: "deck_lighting", name: "Deck Lighting", unit: "unit", unitPrice: 0 },
    { id: "deck_seal", name: "Sealing & Finishing", unit: "sq.ft", unitPrice: 0 }
  ],
  fence: [
    { id: "fence_gate", name: "Fence Gate", unit: "unit", unitPrice: 0 },
    { id: "post_caps", name: "Post Caps", unit: "unit", unitPrice: 0 },
    { id: "lattice", name: "Lattice", unit: "sq.ft", unitPrice: 0 },
    { id: "fence_stain", name: "Fence Stain", unit: "gallon", unitPrice: 0 },
    { id: "fence_removal", name: "Old Fence Removal", unit: "ln.ft", unitPrice: 0 }
  ],
  windows: [
    { id: "window_grids", name: "Window Grids", unit: "unit", unitPrice: 0 },
    { id: "window_screens", name: "Window Screens", unit: "unit", unitPrice: 0 },
    { id: "window_trim", name: "Window Trim", unit: "unit", unitPrice: 0 },
    { id: "low_e_glass", name: "Low-E Glass", unit: "unit", unitPrice: 0 },
    { id: "window_removal", name: "Old Window Removal", unit: "unit", unitPrice: 0 }
  ],
  gutters: [
    { id: "downspouts", name: "Downspouts", unit: "unit", unitPrice: 0 },
    { id: "gutter_guards", name: "Gutter Guards", unit: "ln.ft", unitPrice: 0 },
    { id: "splash_blocks", name: "Splash Blocks", unit: "unit", unitPrice: 0 },
    { id: "gutter_corners", name: "Gutter Corners", unit: "unit", unitPrice: 0 },
    { id: "gutter_removal", name: "Old Gutter Removal", unit: "ln.ft", unitPrice: 0 }
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
  // Primero buscamos en los materiales configurados por coincidencia exacta de ID
  let configuredMaterial = configuredMaterials.find(m => 
    m.id === materialId
  );

  // Si no encontramos coincidencia exacta, buscamos por categoría y nombre similar
  if (!configuredMaterial) {
    configuredMaterial = configuredMaterials.find(m => 
      m.category === serviceType && 
      (m.name.toLowerCase().includes(materialId.replace(/_/g, ' ')) || 
       materialId.includes(m.id))
    );
  }

  // Búsqueda final por categoría
  if (!configuredMaterial) {
    configuredMaterial = configuredMaterials.find(m => 
      m.category === serviceType &&
      m.name.toLowerCase().includes(getMaterial(serviceType, materialId)?.name.toLowerCase() || '')
    );
  }
  
  // Si encontramos un precio configurado, lo usamos
  if (configuredMaterial) {
    console.log('Material configurado encontrado:', configuredMaterial.name, configuredMaterial.unitPrice);
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

// Versión que usa precios configurados para opciones
export function getOptionWithConfiguredPrice(
  serviceType: string, 
  optionId: string, 
  configuredMaterials: MaterialPrice[] | undefined
) {
  // Protección contra materiales no definidos
  if (!configuredMaterials || configuredMaterials.length === 0) {
    return getOption(serviceType, optionId);
  }
  
  try {
    // Primero buscamos en los materiales configurados que puedan ser opciones
    let configuredOption = configuredMaterials.find(m => 
      m.id === optionId && m.category === serviceType
    );

    // Búsqueda alternativa por nombre
    if (!configuredOption) {
      const defaultOption = getOption(serviceType, optionId);
      if (defaultOption) {
        configuredOption = configuredMaterials.find(m => 
          m.category === serviceType && 
          m.name && defaultOption.name && 
          m.name.toLowerCase().includes(defaultOption.name.toLowerCase())
        );
      }
    }
    
    // Si encontramos un precio configurado, lo usamos
    if (configuredOption) {
      console.log('Opción configurada encontrada:', configuredOption.name, configuredOption.unitPrice);
      return {
        id: configuredOption.id || optionId,
        name: configuredOption.name || 'Opción',
        unit: configuredOption.unit || 'unit',
        unitPrice: configuredOption.unitPrice || 0
      };
    }
  } catch (error) {
    console.warn('Error al buscar precio configurado:', error);
    // En caso de error, no fallamos, simplemente devolvemos la opción por defecto
  }
  
  // Si no hay configuración o hubo un error, usamos el predeterminado
  return getOption(serviceType, optionId);
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
  
  // Valores predeterminados por tipo de servicio si no hay configuración (reseteados a cero)
  const defaultPrices: Record<string, any> = {
    roof: { unitPrice: 0, unit: 'sqft', laborRate: 0, laborMethod: 'by_area' },
    fence: { unitPrice: 0, unit: 'ft', laborRate: 0, laborMethod: 'by_length' },
    deck: { unitPrice: 0, unit: 'sqft', laborRate: 0, laborMethod: 'by_area' },
    gutters: { unitPrice: 0, unit: 'ft', laborRate: 0, laborMethod: 'by_length' },
    windows: { unitPrice: 0, unit: 'unit', laborRate: 0, laborMethod: 'fixed' },
    siding: { unitPrice: 0, unit: 'sqft', laborRate: 0, laborMethod: 'by_area' },
  };
  
  return defaultPrices[serviceType] || { unitPrice: 0, unit: 'ft', laborRate: 0, laborMethod: 'by_length' };
}

// Funciones de cálculo básicas para cotizaciones
export function calculateArea(length: number, width: number): number {
  return length * width;
}

export function calculatePerimeter(length: number, width: number): number {
  return 2 * (length + width);
}