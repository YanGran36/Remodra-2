import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProjectAnalysisRequest {
  title: string;
  description?: string;
  clientName?: string;
  budget?: number | string;
  status?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  notes?: string | null;
}

interface ProjectAnalysisResponse {
  summary: string;
  description: string;
  analysis: {
    key_points: string[];
    risks: string[];
    recommendations: string[];
    timeline_assessment?: string;
    budget_assessment?: string;
  };
}

interface SharingContent {
  installers: string;
  clients: string;
  estimators: string;
}

/**
 * Analiza un proyecto y genera resúmenes, descripciones y análisis usando IA
 */
export async function analyzeProject(data: ProjectAnalysisRequest): Promise<ProjectAnalysisResponse> {
  try {
    const prompt = `
      Analiza el siguiente proyecto de construcción y genera un resumen conciso, 
      una descripción detallada y un análisis completo. Responde en español.
      
      PROYECTO:
      Título: ${data.title}
      ${data.description ? `Descripción: ${data.description}` : ''}
      ${data.clientName ? `Cliente: ${data.clientName}` : ''}
      ${data.budget ? `Presupuesto: $${data.budget}` : ''}
      ${data.status ? `Estado: ${data.status}` : ''}
      ${data.startDate ? `Fecha de inicio: ${data.startDate}` : ''}
      ${data.endDate ? `Fecha de finalización: ${data.endDate}` : ''}
      ${data.notes ? `Notas adicionales: ${data.notes}` : ''}
      
      INSTRUCCIONES:
      1. Genera un resumen conciso de 2-3 frases sobre el proyecto.
      2. Crea una descripción detallada de 3-4 párrafos que explique el alcance y los objetivos del proyecto.
      3. Realiza un análisis que incluya:
         - Puntos clave (5 puntos)
         - Posibles riesgos (3 puntos)
         - Recomendaciones (3 puntos)
         - Evaluación del cronograma (si hay fechas disponibles)
         - Evaluación del presupuesto (si hay presupuesto disponible)
      
      Responde en formato JSON con las siguientes claves:
      {
        "summary": "resumen conciso",
        "description": "descripción detallada",
        "analysis": {
          "key_points": ["punto 1", "punto 2", ...],
          "risks": ["riesgo 1", "riesgo 2", ...],
          "recommendations": ["recomendación 1", "recomendación 2", ...],
          "timeline_assessment": "evaluación del cronograma",
          "budget_assessment": "evaluación del presupuesto"
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No se recibió respuesta del modelo de IA");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error en el análisis de IA:", error);
    throw new Error(`Error en el análisis de IA: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Genera contenido personalizado para diferentes roles basado en la configuración de compartir
 */
export async function generateSharingContent(
  projectData: any,
  settings: { installers: boolean; clients: boolean; estimators: boolean }
): Promise<SharingContent> {
  try {
    const prompt = `
      Genera contenido personalizado para compartir información sobre un proyecto de construcción con diferentes roles.
      Adapta el contenido según los permisos de cada rol. Responde en español.
      
      PROYECTO:
      Título: ${projectData.title}
      ${projectData.description ? `Descripción: ${projectData.description}` : ''}
      ${projectData.aiProjectSummary ? `Resumen IA: ${projectData.aiProjectSummary}` : ''}
      ${projectData.aiGeneratedDescription ? `Descripción IA: ${projectData.aiGeneratedDescription}` : ''}
      ${projectData.budget ? `Presupuesto: $${projectData.budget}` : ''}
      ${projectData.status ? `Estado: ${projectData.status}` : ''}
      
      CONFIGURACIÓN DE PERMISOS:
      - Instaladores: ${settings.installers ? 'Tiene acceso' : 'No tiene acceso'} 
        (NO debe incluir información de precios o presupuestos)
      - Clientes: ${settings.clients ? 'Tiene acceso' : 'No tiene acceso'}
        (Debe incluir cuotas, facturas, documentos y proceso general)
      - Estimadores/Vendedores: ${settings.estimators ? 'Tiene acceso' : 'No tiene acceso'}
        (Puede ver TODA la información)
      
      Genera tres versiones diferentes del contenido, adaptadas a cada rol,
      centrándote en lo que es relevante para cada uno y respetando las restricciones de permisos.
      
      Responde en formato JSON con las siguientes claves:
      {
        "installers": "contenido para instaladores",
        "clients": "contenido para clientes",
        "estimators": "contenido para estimadores"
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No se recibió respuesta del modelo de IA");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error al generar contenido para compartir:", error);
    throw new Error(`Error al generar contenido para compartir: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}