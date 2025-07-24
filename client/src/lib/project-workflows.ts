// Project Workflow Definitions for Different Service Types
// This allows each service type to have its own kanban board stages

export interface WorkflowStage {
  id: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  isRequired: boolean;
  estimatedDays?: number;
  checkpoints?: string[];
}

export interface ServiceWorkflow {
  serviceType: string;
  serviceName: string;
  stages: WorkflowStage[];
  totalEstimatedDays: number;
}

// Core stages that apply to most projects (starting from project initiation)
const CORE_STAGES: WorkflowStage[] = [
  {
    id: "project_initiated",
    title: "Project Initiated",
    description: "Project has been created and planning begins",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    icon: "🚀",
    isRequired: true,
    estimatedDays: 2
  }
];

// Service-specific workflow definitions
export const SERVICE_WORKFLOWS: ServiceWorkflow[] = [
  {
    serviceType: "fence",
    serviceName: "Fence Installation",
    totalEstimatedDays: 14,
    stages: [
      ...CORE_STAGES,
      {
        id: "site_assessment",
        title: "Site Assessment",
        description: "Property survey, measurements, and site preparation",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "📏",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Property boundaries marked", "Utility lines located", "Access points identified"]
      },
      {
        id: "permits_approvals",
        title: "Permits & Approvals",
        description: "Obtaining necessary permits and HOA approvals",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        icon: "📜",
        isRequired: true,
        estimatedDays: 3,
        checkpoints: ["Building permit obtained", "HOA approval received", "Utility markouts completed"]
      },
      {
        id: "materials_ordered",
        title: "Materials Ordered",
        description: "Fence materials and hardware ordered and delivered",
        color: "text-teal-700",
        bgColor: "bg-teal-50",
        icon: "📦",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Posts and panels ordered", "Hardware and fasteners ready", "Tools and equipment prepared"]
      },
      {
        id: "installation_begins",
        title: "Installation Begins",
        description: "Fence installation work in progress",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🔨",
        isRequired: true,
        estimatedDays: 5,
        checkpoints: ["Posts set and aligned", "Panels installed", "Gates installed"]
      },
      {
        id: "quality_inspection",
        title: "Quality Inspection",
        description: "Final inspection and quality control check",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        icon: "🔍",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Structural integrity verified", "Finish quality checked", "Safety standards met"]
      },
      {
        id: "client_walkthrough",
        title: "Client Walkthrough",
        description: "Final walkthrough with client approval",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "👥",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Client satisfied with work", "Final payment received", "Warranty information provided"]
      }
    ]
  },
  {
    serviceType: "roof",
    serviceName: "Roofing",
    totalEstimatedDays: 21,
    stages: [
      ...CORE_STAGES,
      {
        id: "roof_inspection",
        title: "Roof Inspection",
        description: "Detailed roof assessment and damage evaluation",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "🔍",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Structural assessment completed", "Damage documented", "Repair plan finalized"]
      },
      {
        id: "insurance_coordination",
        title: "Insurance Coordination",
        description: "Working with insurance company for claims",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        icon: "🛡️",
        isRequired: false,
        estimatedDays: 5,
        checkpoints: ["Claim filed", "Adjuster visit scheduled", "Approval received"]
      },
      {
        id: "materials_selection",
        title: "Materials Selection",
        description: "Client selects roofing materials and colors",
        color: "text-purple-700",
        bgColor: "bg-purple-50",
        icon: "🎨",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Shingle type selected", "Color chosen", "Accessories selected"]
      },
      {
        id: "weather_preparation",
        title: "Weather Preparation",
        description: "Scheduling around weather conditions",
        color: "text-cyan-700",
        bgColor: "bg-cyan-50",
        icon: "🌤️",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Weather forecast checked", "Schedule adjusted", "Protection measures planned"]
      },
      {
        id: "roof_installation",
        title: "Roof Installation",
        description: "Complete roof replacement in progress",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🏠",
        isRequired: true,
        estimatedDays: 7,
        checkpoints: ["Old roof removed", "Underlayment installed", "Shingles installed", "Flashing completed"]
      },
      {
        id: "final_inspection",
        title: "Final Inspection",
        description: "Quality control and final walkthrough",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✅",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Workmanship verified", "Warranty documentation", "Client approval received"]
      }
    ]
  },
  {
    serviceType: "deck",
    serviceName: "Deck Construction",
    totalEstimatedDays: 18,
    stages: [
      ...CORE_STAGES,
      {
        id: "design_approval",
        title: "Design Approval",
        description: "Deck design finalized and approved by client",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "📐",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Design drawings completed", "Client approved design", "Materials list finalized"]
      },
      {
        id: "permits_obtained",
        title: "Permits Obtained",
        description: "Building permits and inspections scheduled",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        icon: "📜",
        isRequired: true,
        estimatedDays: 3,
        checkpoints: ["Building permit received", "Inspections scheduled", "Utility markouts done"]
      },
      {
        id: "site_preparation",
        title: "Site Preparation",
        description: "Site clearing and foundation preparation",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        icon: "🚧",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Site cleared", "Footings dug", "Concrete poured"]
      },
      {
        id: "deck_construction",
        title: "Deck Construction",
        description: "Deck framing and decking installation",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🔨",
        isRequired: true,
        estimatedDays: 8,
        checkpoints: ["Framing completed", "Decking installed", "Railings installed", "Stairs built"]
      },
      {
        id: "finishing_touches",
        title: "Finishing Touches",
        description: "Final details and staining/sealing",
        color: "text-purple-700",
        bgColor: "bg-purple-50",
        icon: "🎨",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Staining completed", "Hardware installed", "Cleanup finished"]
      }
    ]
  },
  {
    serviceType: "windows",
    serviceName: "Window Installation",
    totalEstimatedDays: 12,
    stages: [
      ...CORE_STAGES,
      {
        id: "window_selection",
        title: "Window Selection",
        description: "Client selects window styles and features",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "🪟",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Window styles chosen", "Measurements taken", "Order placed"]
      },
      {
        id: "windows_ordered",
        title: "Windows Ordered",
        description: "Custom windows manufactured and delivered",
        color: "text-teal-700",
        bgColor: "bg-teal-50",
        icon: "📦",
        isRequired: true,
        estimatedDays: 5,
        checkpoints: ["Windows manufactured", "Delivery scheduled", "Installation date set"]
      },
      {
        id: "installation_prep",
        title: "Installation Prep",
        description: "Site preparation and old window removal",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        icon: "🚧",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Old windows removed", "Openings prepared", "New windows staged"]
      },
      {
        id: "window_installation",
        title: "Window Installation",
        description: "New windows installed and sealed",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🔨",
        isRequired: true,
        estimatedDays: 3,
        checkpoints: ["Windows installed", "Caulking completed", "Interior trim installed"]
      },
      {
        id: "final_testing",
        title: "Final Testing",
        description: "Functionality testing and cleanup",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✅",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Windows tested", "Site cleaned", "Warranty provided"]
      }
    ]
  },
  {
    serviceType: "gutters",
    serviceName: "Gutter Installation",
    totalEstimatedDays: 8,
    stages: [
      ...CORE_STAGES,
      {
        id: "gutter_assessment",
        title: "Gutter Assessment",
        description: "Evaluate existing gutters and downspout needs",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "🔍",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Existing condition assessed", "Measurements taken", "Material needs calculated"]
      },
      {
        id: "materials_ordered",
        title: "Materials Ordered",
        description: "Gutters, downspouts, and hardware ordered",
        color: "text-teal-700",
        bgColor: "bg-teal-50",
        icon: "📦",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Gutters ordered", "Downspouts ordered", "Hardware ready"]
      },
      {
        id: "old_removal",
        title: "Old Gutter Removal",
        description: "Remove existing gutters and prepare fascia",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        icon: "🚧",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Old gutters removed", "Fascia prepared", "New hangers installed"]
      },
      {
        id: "new_installation",
        title: "New Installation",
        description: "Install new gutters and downspouts",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🔨",
        isRequired: true,
        estimatedDays: 3,
        checkpoints: ["Gutters installed", "Downspouts connected", "Seams sealed"]
      },
      {
        id: "testing_completion",
        title: "Testing & Completion",
        description: "Test water flow and final cleanup",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✅",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Water flow tested", "Site cleaned", "Warranty provided"]
      }
    ]
  },
  {
    serviceType: "siding",
    serviceName: "Siding Installation",
    totalEstimatedDays: 16,
    stages: [
      ...CORE_STAGES,
      {
        id: "siding_selection",
        title: "Siding Selection",
        description: "Client chooses siding material and color",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "🎨",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Material type selected", "Color chosen", "Accessories selected"]
      },
      {
        id: "materials_ordered",
        title: "Materials Ordered",
        description: "Siding materials and accessories ordered",
        color: "text-teal-700",
        bgColor: "bg-teal-50",
        icon: "📦",
        isRequired: true,
        estimatedDays: 3,
        checkpoints: ["Siding panels ordered", "Trim pieces ordered", "Fasteners ready"]
      },
      {
        id: "old_removal",
        title: "Old Siding Removal",
        description: "Remove existing siding and inspect sheathing",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        icon: "🚧",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Old siding removed", "Sheathing inspected", "Repairs made if needed"]
      },
      {
        id: "weather_barrier",
        title: "Weather Barrier",
        description: "Install house wrap and flashing",
        color: "text-purple-700",
        bgColor: "bg-purple-50",
        icon: "🛡️",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["House wrap installed", "Flashing installed", "Windows/doors protected"]
      },
      {
        id: "siding_installation",
        title: "Siding Installation",
        description: "Install new siding panels and trim",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🔨",
        isRequired: true,
        estimatedDays: 6,
        checkpoints: ["Siding panels installed", "Trim pieces installed", "Caulking completed"]
      },
      {
        id: "final_inspection",
        title: "Final Inspection",
        description: "Quality inspection and cleanup",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✅",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Quality inspection passed", "Site cleaned", "Warranty provided"]
      }
    ]
  },
  {
    serviceType: "flooring",
    serviceName: "Flooring Installation",
    totalEstimatedDays: 14,
    stages: [
      ...CORE_STAGES,
      {
        id: "flooring_selection",
        title: "Flooring Selection",
        description: "Client selects flooring material and style",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "🎨",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Flooring type selected", "Color/style chosen", "Underlayment selected"]
      },
      {
        id: "materials_ordered",
        title: "Materials Ordered",
        description: "Flooring materials and accessories ordered",
        color: "text-teal-700",
        bgColor: "bg-teal-50",
        icon: "📦",
        isRequired: true,
        estimatedDays: 3,
        checkpoints: ["Flooring ordered", "Underlayment ready", "Tools prepared"]
      },
      {
        id: "furniture_moved",
        title: "Furniture Moved",
        description: "Move furniture and prepare work area",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        icon: "🚚",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Furniture moved", "Area cleared", "Protection laid"]
      },
      {
        id: "old_removal",
        title: "Old Flooring Removal",
        description: "Remove existing flooring and prepare subfloor",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        icon: "🚧",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Old flooring removed", "Subfloor prepared", "Leveling completed"]
      },
      {
        id: "flooring_installation",
        title: "Flooring Installation",
        description: "Install new flooring material",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🔨",
        isRequired: true,
        estimatedDays: 5,
        checkpoints: ["Underlayment installed", "Flooring installed", "Transitions installed"]
      },
      {
        id: "final_touches",
        title: "Final Touches",
        description: "Cleanup and furniture replacement",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✅",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Site cleaned", "Furniture replaced", "Warranty provided"]
      }
    ]
  },
  {
    serviceType: "painting",
    serviceName: "Painting Services",
    totalEstimatedDays: 10,
    stages: [
      ...CORE_STAGES,
      {
        id: "color_selection",
        title: "Color Selection",
        description: "Client selects paint colors and finishes",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "🎨",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Colors selected", "Finishes chosen", "Paint ordered"]
      },
      {
        id: "preparation",
        title: "Surface Preparation",
        description: "Prepare surfaces for painting",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        icon: "🚧",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Furniture moved", "Surfaces cleaned", "Primer applied"]
      },
      {
        id: "painting_begins",
        title: "Painting Begins",
        description: "Paint application in progress",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🖌️",
        isRequired: true,
        estimatedDays: 5,
        checkpoints: ["First coat applied", "Second coat applied", "Touch-ups completed"]
      },
      {
        id: "final_inspection",
        title: "Final Inspection",
        description: "Quality check and cleanup",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✅",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Quality inspected", "Site cleaned", "Furniture replaced"]
      }
    ]
  },
  {
    serviceType: "electrical",
    serviceName: "Electrical Work",
    totalEstimatedDays: 12,
    stages: [
      ...CORE_STAGES,
      {
        id: "electrical_assessment",
        title: "Electrical Assessment",
        description: "Evaluate electrical needs and code requirements",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "⚡",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Electrical needs assessed", "Code requirements reviewed", "Permit requirements identified"]
      },
      {
        id: "permits_obtained",
        title: "Permits Obtained",
        description: "Obtain electrical permits and schedule inspections",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        icon: "📜",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Electrical permit obtained", "Inspections scheduled", "Materials ordered"]
      },
      {
        id: "electrical_installation",
        title: "Electrical Installation",
        description: "Install electrical components and wiring",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🔌",
        isRequired: true,
        estimatedDays: 6,
        checkpoints: ["Wiring installed", "Fixtures installed", "Panel work completed"]
      },
      {
        id: "inspection_passed",
        title: "Inspection Passed",
        description: "Electrical inspection completed and passed",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✅",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Rough-in inspection passed", "Final inspection passed", "Certificate received"]
      },
      {
        id: "final_testing",
        title: "Final Testing",
        description: "Test all electrical systems and cleanup",
        color: "text-purple-700",
        bgColor: "bg-purple-50",
        icon: "🔍",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["All systems tested", "Site cleaned", "Warranty provided"]
      }
    ]
  },
  {
    serviceType: "plumbing",
    serviceName: "Plumbing Services",
    totalEstimatedDays: 10,
    stages: [
      ...CORE_STAGES,
      {
        id: "plumbing_assessment",
        title: "Plumbing Assessment",
        description: "Evaluate plumbing needs and access requirements",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "🔧",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Plumbing needs assessed", "Access points identified", "Materials selected"]
      },
      {
        id: "materials_ordered",
        title: "Materials Ordered",
        description: "Order plumbing fixtures and materials",
        color: "text-teal-700",
        bgColor: "bg-teal-50",
        icon: "📦",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Fixtures ordered", "Pipes and fittings ready", "Tools prepared"]
      },
      {
        id: "plumbing_installation",
        title: "Plumbing Installation",
        description: "Install plumbing fixtures and connections",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🚰",
        isRequired: true,
        estimatedDays: 5,
        checkpoints: ["Pipes installed", "Fixtures connected", "Water tested"]
      },
      {
        id: "final_testing",
        title: "Final Testing",
        description: "Test all plumbing systems and cleanup",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✅",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Water pressure tested", "Leaks checked", "Site cleaned"]
      }
    ]
  },
  {
    serviceType: "concrete",
    serviceName: "Concrete Work",
    totalEstimatedDays: 15,
    stages: [
      ...CORE_STAGES,
      {
        id: "concrete_design",
        title: "Concrete Design",
        description: "Design concrete structure and specifications",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "📐",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Design finalized", "Specifications written", "Permits obtained"]
      },
      {
        id: "site_preparation",
        title: "Site Preparation",
        description: "Prepare site for concrete work",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        icon: "🚧",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Site cleared", "Excavation completed", "Forms built"]
      },
      {
        id: "concrete_pour",
        title: "Concrete Pour",
        description: "Pour and finish concrete",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🏗️",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Concrete poured", "Finishing completed", "Curing started"]
      },
      {
        id: "curing_period",
        title: "Curing Period",
        description: "Allow concrete to cure properly",
        color: "text-purple-700",
        bgColor: "bg-purple-50",
        icon: "⏰",
        isRequired: true,
        estimatedDays: 7,
        checkpoints: ["Curing maintained", "Forms removed", "Strength tested"]
      },
      {
        id: "final_inspection",
        title: "Final Inspection",
        description: "Inspect finished concrete work",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✅",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Quality inspected", "Site cleaned", "Warranty provided"]
      }
    ]
  },
  {
    serviceType: "landscaping",
    serviceName: "Landscaping",
    totalEstimatedDays: 12,
    stages: [
      ...CORE_STAGES,
      {
        id: "landscape_design",
        title: "Landscape Design",
        description: "Design landscape plan and plant selection",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "🌿",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Design completed", "Plants selected", "Materials chosen"]
      },
      {
        id: "site_preparation",
        title: "Site Preparation",
        description: "Prepare soil and install hardscaping",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        icon: "🚧",
        isRequired: true,
        estimatedDays: 3,
        checkpoints: ["Soil prepared", "Hardscaping installed", "Irrigation planned"]
      },
      {
        id: "planting_installation",
        title: "Planting & Installation",
        description: "Install plants and irrigation system",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🌱",
        isRequired: true,
        estimatedDays: 5,
        checkpoints: ["Plants installed", "Irrigation installed", "Mulch applied"]
      },
      {
        id: "final_touches",
        title: "Final Touches",
        description: "Final landscaping details and cleanup",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✅",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Final details completed", "Site cleaned", "Care instructions provided"]
      }
    ]
  },
  {
    serviceType: "hvac",
    serviceName: "HVAC Services",
    totalEstimatedDays: 14,
    stages: [
      ...CORE_STAGES,
      {
        id: "hvac_assessment",
        title: "HVAC Assessment",
        description: "Evaluate HVAC needs and system requirements",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "❄️",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["System needs assessed", "Sizing calculated", "Equipment selected"]
      },
      {
        id: "equipment_ordered",
        title: "Equipment Ordered",
        description: "Order HVAC equipment and materials",
        color: "text-teal-700",
        bgColor: "bg-teal-50",
        icon: "📦",
        isRequired: true,
        estimatedDays: 3,
        checkpoints: ["Equipment ordered", "Materials ready", "Installation scheduled"]
      },
      {
        id: "hvac_installation",
        title: "HVAC Installation",
        description: "Install HVAC system and ductwork",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🔧",
        isRequired: true,
        estimatedDays: 7,
        checkpoints: ["Equipment installed", "Ductwork completed", "Electrical connected"]
      },
      {
        id: "system_testing",
        title: "System Testing",
        description: "Test HVAC system and performance",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✅",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["System tested", "Performance verified", "Warranty activated"]
      }
    ]
  },
  {
    serviceType: "other",
    serviceName: "Other Services",
    totalEstimatedDays: 10,
    stages: [
      ...CORE_STAGES,
      {
        id: "service_planning",
        title: "Service Planning",
        description: "Plan and prepare for custom service",
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
        icon: "📋",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Service requirements defined", "Materials identified", "Timeline established"]
      },
      {
        id: "materials_preparation",
        title: "Materials Preparation",
        description: "Order and prepare necessary materials",
        color: "text-teal-700",
        bgColor: "bg-teal-50",
        icon: "📦",
        isRequired: true,
        estimatedDays: 2,
        checkpoints: ["Materials ordered", "Tools prepared", "Site ready"]
      },
      {
        id: "service_execution",
        title: "Service Execution",
        description: "Perform the requested service",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: "🔨",
        isRequired: true,
        estimatedDays: 4,
        checkpoints: ["Service performed", "Quality checked", "Adjustments made"]
      },
      {
        id: "completion_verification",
        title: "Completion Verification",
        description: "Verify service completion and cleanup",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✅",
        isRequired: true,
        estimatedDays: 1,
        checkpoints: ["Service verified", "Site cleaned", "Documentation completed"]
      }
    ]
  }
];

// Helper functions
export function getWorkflowForService(serviceType: string): ServiceWorkflow | null {
  return SERVICE_WORKFLOWS.find(workflow => workflow.serviceType === serviceType) || null;
}

export function getAllServiceTypes(): string[] {
  return SERVICE_WORKFLOWS.map(workflow => workflow.serviceType);
}

export function getWorkflowStages(serviceType: string): WorkflowStage[] {
  const workflow = getWorkflowForService(serviceType);
  return workflow ? workflow.stages : CORE_STAGES;
}

export function getDefaultWorkflow(): ServiceWorkflow {
  return SERVICE_WORKFLOWS[0]; // Return fence workflow as default
}

// Convert workflow stages to kanban columns format
export function workflowStagesToKanbanColumns(stages: WorkflowStage[]) {
  return stages.map(stage => ({
    id: stage.id,
    title: stage.title,
    color: stage.color,
    bgColor: stage.bgColor,
    icon: stage.icon,
    description: stage.description,
    projects: [] // Will be populated by the kanban component
  }));
} 