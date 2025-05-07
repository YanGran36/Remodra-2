import OpenAI from "openai";
import { log } from "./vite";

// Inicializar el cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface JobCostAnalysisParams {
  serviceType: string;
  materials: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  }>;
  laborHours?: number;
  propertySize?: {
    squareFeet?: number;
    linearFeet?: number;
    units?: number;
  };
  location?: string;
  difficulty?: "easy" | "medium" | "complex";
  additionalInfo?: string;
}

export interface JobCostAnalysisResult {
  recommendedTotal: number;
  breakdown: {
    materials: {
      total: number;
      items: Array<{
        name: string;
        estimatedCost: number;
        notes?: string;
      }>;
    };
    labor: {
      total: number;
      estimatedHours: number;
      hourlyRate: number;
      notes?: string;
    };
    overhead: {
      total: number;
      percentage: number;
      notes?: string;
    };
    profit: {
      total: number;
      percentage: number;
      notes?: string;
    };
    recommendations: string[];
    competitiveAnalysis?: {
      lowRange: number;
      highRange: number;
      notes: string;
    };
    potentialIssues: string[];
  };
  summary: string;
}

// La función principal para analizar y estimar costos de trabajo
export async function analyzeJobCost(params: JobCostAnalysisParams): Promise<JobCostAnalysisResult> {
  try {
    log("Analizando costos del trabajo con OpenAI", "openai");

    // Preparar los datos para enviar a la API
    const prompt = `
    Eres un consultor experto en análisis de costos para contratistas de construcción. Analiza los siguientes detalles de un trabajo y proporciona una estimación detallada y análisis de costos. Devuelve tu respuesta ÚNICAMENTE en formato JSON para facilitar su procesamiento por un sistema informático.

    INFORMACIÓN DEL TRABAJO:
    - Tipo de servicio: ${params.serviceType}
    - Materiales: ${JSON.stringify(params.materials)}
    ${params.laborHours ? `- Horas de trabajo estimadas: ${params.laborHours}` : ''}
    ${params.propertySize?.squareFeet ? `- Tamaño de la propiedad (pies cuadrados): ${params.propertySize.squareFeet}` : ''}
    ${params.propertySize?.linearFeet ? `- Tamaño de la propiedad (pies lineales): ${params.propertySize.linearFeet}` : ''}
    ${params.propertySize?.units ? `- Unidades: ${params.propertySize.units}` : ''}
    ${params.location ? `- Ubicación: ${params.location}` : ''}
    ${params.difficulty ? `- Dificultad del trabajo: ${params.difficulty}` : ''}
    ${params.additionalInfo ? `- Información adicional: ${params.additionalInfo}` : ''}

    INSTRUCCIONES:
    1. Analiza los costos de materiales proporcionados y sugiere ajustes si son necesarios.
    2. Estima los costos de mano de obra basados en las horas estimadas (si se proporcionan) o en los requisitos típicos para este tipo de trabajo.
    3. Calcula gastos generales (overhead) y márgenes de ganancia típicos para este tipo de contratista.
    4. Proporciona un análisis competitivo de rango bajo, medio y alto de lo que otros contratistas podrían cobrar.
    5. Identifica posibles problemas o costos ocultos que podrían surgir.
    6. Proporciona recomendaciones para optimizar los costos sin sacrificar la calidad.

    Por favor, proporciona tu respuesta en FORMATO JSON ÚNICAMENTE con la siguiente estructura:
    {
      "recommendedTotal": número,
      "breakdown": {
        "materials": {
          "total": número,
          "items": [
            {
              "name": "string",
              "estimatedCost": número,
              "notes": "string (opcional)"
            }
          ]
        },
        "labor": {
          "total": número,
          "estimatedHours": número,
          "hourlyRate": número,
          "notes": "string (opcional)"
        },
        "overhead": {
          "total": número,
          "percentage": número,
          "notes": "string (opcional)"
        },
        "profit": {
          "total": número,
          "percentage": número,
          "notes": "string (opcional)"
        },
        "recommendations": ["string"],
        "competitiveAnalysis": {
          "lowRange": número,
          "highRange": número,
          "notes": "string"
        },
        "potentialIssues": ["string"]
      },
      "summary": "string"
    }
    `;

    // Llamada a la API de OpenAI
    // la nueva versión del modelo es "gpt-4o" que fue lanzada el 13 de mayo, 2024. usar "gpt-4o" en lugar de "gpt-4"
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // La última versión disponible
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    // Procesar la respuesta
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No se recibió respuesta de la API de OpenAI");
    }

    try {
      const result = JSON.parse(content) as JobCostAnalysisResult;
      return result;
    } catch (parseError) {
      console.error("Error al parsear la respuesta JSON:", parseError);
      throw new Error("Error al procesar la respuesta de OpenAI");
    }
  } catch (error) {
    console.error("Error al analizar costos con OpenAI:", error);
    throw error;
  }
}

export async function generateJobDescription(params: JobCostAnalysisParams): Promise<string> {
  try {
    log("Generando descripción del trabajo con OpenAI", "openai");

    // Preparar los datos para enviar a la API
    const prompt = `
    Eres un experto en construcción y contratación. Crea una descripción profesional y detallada del trabajo para el siguiente proyecto:

    INFORMACIÓN DEL TRABAJO:
    - Tipo de servicio: ${params.serviceType}
    - Materiales principales: ${params.materials.map(m => m.name).join(", ")}
    ${params.propertySize?.squareFeet ? `- Tamaño de la propiedad (pies cuadrados): ${params.propertySize.squareFeet}` : ''}
    ${params.propertySize?.linearFeet ? `- Tamaño de la propiedad (pies lineales): ${params.propertySize.linearFeet}` : ''}
    ${params.propertySize?.units ? `- Unidades: ${params.propertySize.units}` : ''}
    ${params.location ? `- Ubicación: ${params.location}` : ''}
    ${params.difficulty ? `- Dificultad del trabajo: ${params.difficulty}` : ''}
    ${params.additionalInfo ? `- Información adicional: ${params.additionalInfo}` : ''}

    La descripción debe ser detallada, profesional y orientada al cliente. Debe incluir:
    1. Una visión general del trabajo
    2. Los materiales que se utilizarán y sus beneficios
    3. El proceso de instalación o construcción
    4. Los beneficios para el cliente
    5. Garantías o aseguramiento de calidad

    Usa un tono profesional pero accesible. No incluyas precios específicos.
    Limita la respuesta a aproximadamente 200-300 palabras.
    `;

    // Llamada a la API de OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // la nueva versión del modelo es "gpt-4o" que fue lanzada el 13 de mayo, 2024. utilizar esta versión
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    // Procesar la respuesta
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No se recibió respuesta de la API de OpenAI");
    }

    return content;
  } catch (error) {
    console.error("Error al generar descripción del trabajo con OpenAI:", error);
    throw error;
  }
}