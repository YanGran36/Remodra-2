import OpenAI from "openai";
import { log } from "./vite";

// Inicializar el cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Check if the API key exists
if (!process.env.OPENAI_API_KEY) {
  console.warn("¡ADVERTENCIA! La clave API de OpenAI no está definida en las variables de entorno.");
}

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
    console.log("Parámetros recibidos para análisis:", {
      serviceType: params.serviceType,
      materialsCount: params.materials?.length || 0,
      hasLaborHours: !!params.laborHours,
      hasLocation: !!params.location,
      hasDifficulty: !!params.difficulty,
      hasAdditionalInfo: !!params.additionalInfo
    });

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

    console.log("Enviando solicitud a OpenAI para análisis de costos...");

    // Llamada a la API de OpenAI
    try {
      // la nueva versión del modelo es "gpt-4o" que fue lanzada el 13 de mayo, 2024. usar "gpt-4o" en lugar de "gpt-4"
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // La última versión disponible
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      console.log("Respuesta recibida de OpenAI para análisis:", {
        status: "success",
        model: response.model,
        choicesCount: response.choices.length
      });

      // Procesar la respuesta
      const content = response.choices[0].message.content;
      if (!content) {
        console.error("Contenido vacío en la respuesta de análisis de OpenAI");
        throw new Error("No se recibió respuesta de la API de OpenAI");
      }

      try {
        const result = JSON.parse(content) as JobCostAnalysisResult;
        console.log("Análisis completado con éxito. Total recomendado:", result.recommendedTotal);
        return result;
      } catch (parseError) {
        console.error("Error al parsear la respuesta JSON:", parseError);
        console.error("Contenido recibido:", content);
        throw new Error("Error al procesar la respuesta de OpenAI");
      }
    } catch (error: unknown) {
      const openaiError = error as { message?: string };
      console.error("Error específico de OpenAI en análisis:", openaiError);
      
      // Check if it is an API key error
      if (openaiError.message && typeof openaiError.message === 'string' && openaiError.message.includes("api_key")) {
        throw new Error("Error de autenticación con OpenAI. Verifica la clave API.");
      }
      
      throw openaiError;
    }
  } catch (error) {
    console.error("Error al analizar costos con OpenAI:", error);
    throw error;
  }
}

export async function generateJobDescription(params: JobCostAnalysisParams): Promise<string> {
  try {
    log("Generating job description with OpenAI", "openai");
    console.log("Parameters received:", {
      serviceType: params.serviceType,
      materialsCount: params.materials?.length || 0,
      hasLocation: !!params.location,
      hasDifficulty: !!params.difficulty,
      hasAdditionalInfo: !!params.additionalInfo
    });

    // Prepare the data to send to the API
    const prompt = `
    You are a professional contractor. Create a concise, direct, and easy-to-understand description for this project:

    JOB INFORMATION:
    - Service type: ${params.serviceType}
    - Main materials: ${params.materials.map(m => m.name).join(", ")}
    ${params.propertySize?.squareFeet ? `- Property size (square feet): ${params.propertySize.squareFeet}` : ''}
    ${params.propertySize?.linearFeet ? `- Property size (linear feet): ${params.propertySize.linearFeet}` : ''}
    ${params.propertySize?.units ? `- Units: ${params.propertySize.units}` : ''}
    ${params.location ? `- Location: ${params.location}` : ''}
    ${params.difficulty ? `- Job difficulty: ${params.difficulty}` : ''}
    ${params.additionalInfo ? `- Additional information: ${params.additionalInfo}` : ''}

    The description should be:
    1. Short and direct (maximum 150 words)
    2. Structured in a bulleted list format (•)
    3. Easy to read for clients without technical knowledge
    4. Include exactly these 4 points, each as a separate paragraph with a bullet point (•):
      • What service will be performed exactly
      • What materials will be used and why they are good
      • Approximately how long the job will take
      • What main benefit the client will receive

    Use a professional but simple tone, as if you were speaking directly to a client. Do not include specific prices.
    `;

    console.log("Sending prompt to OpenAI:", prompt);

    // Call to the OpenAI API
    try {
      console.log("Starting OpenAI API call...");
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });
      console.log("Respuesta recibida de OpenAI:", {
        status: "success",
        model: response.model,
        choicesCount: response.choices.length
      });

      // Procesar la respuesta
      const content = response.choices[0].message.content;
      if (!content) {
        console.error("Contenido vacío en la respuesta de OpenAI");
        throw new Error("No se recibió respuesta de la API de OpenAI");
      }

      console.log("Descripción generada con éxito. Longitud:", content.length);
      return content;
    } catch (error: unknown) {
      const openaiError = error as { message?: string };
      console.error("Error específico de OpenAI:", openaiError);
      
      // Check if it is an API key error
      if (openaiError.message && typeof openaiError.message === 'string' && openaiError.message.includes("api_key")) {
        throw new Error("Error de autenticación con OpenAI. Verifica la clave API.");
      }
      
      throw error;
    }
  } catch (error) {
    console.error("Error al generar descripción del trabajo con OpenAI:", error);
    throw error;
  }
}