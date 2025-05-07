// Definir los tipos de servicio disponibles
export const SERVICE_TYPES = [
  { value: "roof", label: "Techo" },
  { value: "siding", label: "Revestimiento" },
  { value: "deck", label: "Terraza" },
  { value: "fence", label: "Cerca" },
  { value: "windows", label: "Ventanas" },
  { value: "gutters", label: "Canaletas" }
];

// Definir los materiales por tipo de servicio
export const MATERIALS_BY_SERVICE = {
  roof: [
    { id: "asphalt_shingles", name: "Tejas de Asfalto", unit: "sq.ft", unitPrice: 4.25 },
    { id: "metal_roofing", name: "Techo Metálico", unit: "sq.ft", unitPrice: 9.50 },
    { id: "tile_roofing", name: "Techo de Tejas", unit: "sq.ft", unitPrice: 12.00 },
    { id: "slate_roofing", name: "Techo de Pizarra", unit: "sq.ft", unitPrice: 15.75 }
  ],
  siding: [
    { id: "vinyl_siding", name: "Revestimiento de Vinilo", unit: "sq.ft", unitPrice: 4.00 },
    { id: "fiber_cement", name: "Fibrocemento", unit: "sq.ft", unitPrice: 7.50 },
    { id: "wood_siding", name: "Revestimiento de Madera", unit: "sq.ft", unitPrice: 8.75 },
    { id: "metal_siding", name: "Revestimiento Metálico", unit: "sq.ft", unitPrice: 6.25 }
  ],
  deck: [
    { id: "pressure_treated", name: "Madera Tratada a Presión", unit: "sq.ft", unitPrice: 8.50 },
    { id: "cedar_deck", name: "Cedro", unit: "sq.ft", unitPrice: 12.75 },
    { id: "composite_deck", name: "Compuesto", unit: "sq.ft", unitPrice: 16.00 },
    { id: "pvc_deck", name: "PVC", unit: "sq.ft", unitPrice: 18.50 }
  ],
  fence: [
    { id: "wood_fence", name: "Cerca de Madera", unit: "ln.ft", unitPrice: 22.00 },
    { id: "vinyl_fence", name: "Cerca de Vinilo", unit: "ln.ft", unitPrice: 28.50 },
    { id: "chain_link", name: "Cerca de Eslabones", unit: "ln.ft", unitPrice: 15.00 },
    { id: "aluminum_fence", name: "Cerca de Aluminio", unit: "ln.ft", unitPrice: 32.00 }
  ],
  windows: [
    { id: "single_hung", name: "Ventana de Guillotina Simple", unit: "unit", unitPrice: 225.00 },
    { id: "double_hung", name: "Ventana de Guillotina Doble", unit: "unit", unitPrice: 325.00 },
    { id: "casement", name: "Ventana Batiente", unit: "unit", unitPrice: 375.00 },
    { id: "sliding", name: "Ventana Corrediza", unit: "unit", unitPrice: 300.00 }
  ],
  gutters: [
    { id: "aluminum_gutters", name: "Canaletas de Aluminio", unit: "ln.ft", unitPrice: 7.50 },
    { id: "vinyl_gutters", name: "Canaletas de Vinilo", unit: "ln.ft", unitPrice: 5.75 },
    { id: "copper_gutters", name: "Canaletas de Cobre", unit: "ln.ft", unitPrice: 18.00 },
    { id: "steel_gutters", name: "Canaletas de Acero", unit: "ln.ft", unitPrice: 9.25 }
  ]
};

// Definir las opciones adicionales por tipo de servicio
export const OPTIONS_BY_SERVICE = {
  roof: [
    { id: "roof_vents", name: "Ventilación de Techo", unit: "unit", unitPrice: 65.00 },
    { id: "skylight", name: "Claraboya", unit: "unit", unitPrice: 350.00 },
    { id: "chimney_flashing", name: "Tapajuntas de Chimenea", unit: "unit", unitPrice: 120.00 },
    { id: "drip_edge", name: "Borde de Goteo", unit: "ln.ft", unitPrice: 2.50 },
    { id: "roof_removal", name: "Remoción de Techo Viejo", unit: "sq.ft", unitPrice: 1.50 }
  ],
  siding: [
    { id: "insulation", name: "Aislamiento", unit: "sq.ft", unitPrice: 1.75 },
    { id: "trim_pieces", name: "Piezas de Acabado", unit: "ln.ft", unitPrice: 3.50 },
    { id: "corner_posts", name: "Postes de Esquina", unit: "unit", unitPrice: 25.00 },
    { id: "j_channel", name: "Canal J", unit: "ln.ft", unitPrice: 2.00 },
    { id: "siding_removal", name: "Remoción de Revestimiento Viejo", unit: "sq.ft", unitPrice: 1.25 }
  ],
  deck: [
    { id: "deck_railing", name: "Barandilla", unit: "ln.ft", unitPrice: 32.00 },
    { id: "deck_stairs", name: "Escaleras", unit: "step", unitPrice: 45.00 },
    { id: "post_caps", name: "Tapas de Poste", unit: "unit", unitPrice: 15.00 },
    { id: "deck_lighting", name: "Iluminación", unit: "unit", unitPrice: 35.00 },
    { id: "deck_seal", name: "Sellado y Acabado", unit: "sq.ft", unitPrice: 3.25 }
  ],
  fence: [
    { id: "fence_gate", name: "Puerta de Cerca", unit: "unit", unitPrice: 150.00 },
    { id: "post_caps", name: "Tapas de Poste", unit: "unit", unitPrice: 12.00 },
    { id: "lattice", name: "Celosía", unit: "sq.ft", unitPrice: 5.50 },
    { id: "fence_stain", name: "Tinte para Cerca", unit: "gallon", unitPrice: 38.00 },
    { id: "fence_removal", name: "Remoción de Cerca Vieja", unit: "ln.ft", unitPrice: 8.00 }
  ],
  windows: [
    { id: "window_grids", name: "Rejillas de Ventana", unit: "unit", unitPrice: 45.00 },
    { id: "window_screens", name: "Mallas de Ventana", unit: "unit", unitPrice: 35.00 },
    { id: "window_trim", name: "Acabado de Ventana", unit: "unit", unitPrice: 65.00 },
    { id: "low_e_glass", name: "Vidrio Low-E", unit: "unit", unitPrice: 120.00 },
    { id: "window_removal", name: "Remoción de Ventana Vieja", unit: "unit", unitPrice: 75.00 }
  ],
  gutters: [
    { id: "downspouts", name: "Bajantes", unit: "unit", unitPrice: 25.00 },
    { id: "gutter_guards", name: "Protectores de Canaletas", unit: "ln.ft", unitPrice: 4.25 },
    { id: "splash_blocks", name: "Bloques de Salpicadura", unit: "unit", unitPrice: 15.00 },
    { id: "gutter_corners", name: "Esquinas de Canaletas", unit: "unit", unitPrice: 12.50 },
    { id: "gutter_removal", name: "Remoción de Canaletas Viejas", unit: "ln.ft", unitPrice: 3.00 }
  ]
};

// Información general por tipo de servicio
export const SERVICE_INFO = {
  roof: {
    description: "Estimado para instalación de techo nuevo, reparación o reemplazo.",
    helpText: "Ingrese las dimensiones del techo (largo y ancho) para calcular el área total en pies cuadrados.",
    recommendedMaterials: ["asphalt_shingles", "metal_roofing"],
    recommendedOptions: ["roof_vents", "drip_edge"],
    unitType: "sq.ft"
  },
  siding: {
    description: "Estimado para revestimiento exterior de la propiedad.",
    helpText: "Ingrese las dimensiones de la pared (largo y altura) para calcular el área total en pies cuadrados.",
    recommendedMaterials: ["vinyl_siding", "fiber_cement"],
    recommendedOptions: ["insulation", "trim_pieces"],
    unitType: "sq.ft"
  },
  deck: {
    description: "Estimado para construcción o reparación de terraza.",
    helpText: "Ingrese las dimensiones de la terraza (largo y ancho) para calcular el área total en pies cuadrados.",
    recommendedMaterials: ["pressure_treated", "composite_deck"],
    recommendedOptions: ["deck_railing", "deck_stairs"],
    unitType: "sq.ft"
  },
  fence: {
    description: "Estimado para instalación o reparación de cerca.",
    helpText: "Ingrese la longitud total de la cerca en pies lineales.",
    recommendedMaterials: ["wood_fence", "vinyl_fence"],
    recommendedOptions: ["fence_gate", "post_caps"],
    unitType: "ln.ft"
  },
  windows: {
    description: "Estimado para instalación o reemplazo de ventanas.",
    helpText: "Ingrese la cantidad de ventanas a instalar o reemplazar.",
    recommendedMaterials: ["double_hung", "casement"],
    recommendedOptions: ["window_screens", "low_e_glass"],
    unitType: "unit"
  },
  gutters: {
    description: "Estimado para instalación o reparación de canaletas.",
    helpText: "Ingrese la longitud total de las canaletas en pies lineales.",
    recommendedMaterials: ["aluminum_gutters", "vinyl_gutters"],
    recommendedOptions: ["downspouts", "gutter_guards"],
    unitType: "ln.ft"
  }
};

// Helper functions
export function getServiceLabel(serviceType: string): string {
  const service = SERVICE_TYPES.find(s => s.value === serviceType);
  return service ? service.label : serviceType;
}

export function getMaterial(serviceType: string, materialId: string) {
  const materials = MATERIALS_BY_SERVICE[serviceType as keyof typeof MATERIALS_BY_SERVICE] || [];
  return materials.find(m => m.id === materialId);
}

export function getOption(serviceType: string, optionId: string) {
  const options = OPTIONS_BY_SERVICE[serviceType as keyof typeof OPTIONS_BY_SERVICE] || [];
  return options.find(o => o.id === optionId);
}

export function getServiceInfo(serviceType: string) {
  return SERVICE_INFO[serviceType as keyof typeof SERVICE_INFO];
}

// Funciones de cálculo básicas para cotizaciones
export function calculateArea(length: number, width: number): number {
  return length * width;
}

export function calculatePerimeter(length: number, width: number): number {
  return 2 * (length + width);
}