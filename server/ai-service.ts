import OpenAI from "openai";

// Use the provided OpenAI API key or fallback
const apiKey = process.env.OPENAI_API_KEY || "sk-proj-...your-actual-openai-api-key...";
if (!apiKey || apiKey === "sk-proj-...your-actual-openai-api-key...") {
  console.warn("⚠️  OpenAI API key not configured. AI features will be disabled.");
}
const openai = new OpenAI({ apiKey });

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

interface JobDescriptionRequest {
  serviceType?: string;
  appointmentNotes: string;
  propertyDetails?: {
    squareFeet?: number;
    linearFeet?: number;
    units?: number;
  };
  clientName?: string;
}

interface JobDescriptionResponse {
  professionalDescription: string;
  scope: string[];
  materials: string[];
  timeEstimate: string;
  clientBenefits: string[];
}

/**
 * Analyzes a project and generates summaries, descriptions, and analysis using AI
 */
export async function analyzeProject(data: ProjectAnalysisRequest): Promise<ProjectAnalysisResponse> {
  if (!openai) {
    throw new Error("AI service is not configured. Please set a valid OPENAI_API_KEY.");
  }

  try {
    const prompt = `
      Analyze the following construction project and generate a concise summary, 
      a detailed description and a complete analysis. Response in English.
      
      PROJECT:
      Title: ${data.title}
      ${data.description ? `Description: ${data.description}` : ''}
      ${data.clientName ? `Client: ${data.clientName}` : ''}
      ${data.budget ? `Budget: $${data.budget}` : ''}
      ${data.status ? `Status: ${data.status}` : ''}
      ${data.startDate ? `Start date: ${data.startDate}` : ''}
      ${data.endDate ? `End date: ${data.endDate}` : ''}
      ${data.notes ? `Additional notes: ${data.notes}` : ''}
      
      INSTRUCTIONS:
      1. Generate a concise summary of 2-3 sentences about the project.
      2. Create a detailed description of 3-4 paragraphs explaining the scope and objectives of the project.
      3. Perform an analysis that includes:
         - Key points (5 points)
         - Potential risks (3 points)
         - Recommendations (3 points)
         - Timeline assessment (if dates are available)
         - Budget assessment (if budget is available)
      
      Respond in JSON format with the following keys:
      {
        "summary": "concise summary",
        "description": "detailed description",
        "analysis": {
          "key_points": ["point 1", "point 2", ...],
          "risks": ["risk 1", "risk 2", ...],
          "recommendations": ["recommendation 1", "recommendation 2", ...],
          "timeline_assessment": "timeline assessment",
          "budget_assessment": "budget assessment"
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
      throw new Error("No response received from the AI model");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error in AI analysis:", error);
    throw new Error(`Error in AI analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a professional job description based on appointment notes and service details
 */
export async function generateProfessionalJobDescription(data: JobDescriptionRequest): Promise<JobDescriptionResponse> {
  if (!openai) {
    throw new Error("AI service is not configured. Please set a valid OPENAI_API_KEY.");
  }

  try {
    console.log("Generating professional job description with AI", data);
    
    const prompt = `
      You are a professional construction estimator. Create a detailed, professional job description based on the following appointment notes and details. 
      Focus on making vague notes into a clear, compelling description that showcases professionalism.
      
      APPOINTMENT DETAILS:
      ${data.serviceType ? `Service Type: ${data.serviceType}` : ''}
      ${data.clientName ? `Client: ${data.clientName}` : ''}
      ${data.propertyDetails?.squareFeet ? `Square Feet: ${data.propertyDetails.squareFeet}` : ''}
      ${data.propertyDetails?.linearFeet ? `Linear Feet: ${data.propertyDetails.linearFeet}` : ''}
      ${data.propertyDetails?.units ? `Units: ${data.propertyDetails.units}` : ''}
      
      APPOINTMENT NOTES:
      ${data.appointmentNotes || "No notes provided"}
      
      INSTRUCTIONS:
      1. Transform these basic notes into a professional, detailed job description.
      2. Use industry-standard terminology and present the work in the most professional light.
      3. Structure your response to include:
         - A comprehensive description of work to be performed
         - Materials that will be used (infer from service type if not mentioned in notes)
         - Estimated timeframe for completion
         - Benefits the client will receive
      4. Make reasonable inferences where information is missing.
      5. Keep the tone professional but accessible to clients.
      
      Respond in JSON format with the following keys:
      {
        "professionalDescription": "A complete, well-written paragraph describing the entire job",
        "scope": ["scope item 1", "scope item 2", ...],
        "materials": ["material 1", "material 2", ...],
        "timeEstimate": "estimated time to complete",
        "clientBenefits": ["benefit 1", "benefit 2", ...]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response received from the AI model");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating professional job description:", error);
    throw new Error(`Error generating job description: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates personalized content for different roles based on sharing configuration
 */
export async function generateSharingContent(
  projectData: any,
  settings: { installers: boolean; clients: boolean; estimators: boolean }
): Promise<SharingContent> {
  if (!openai) {
    throw new Error("AI service is not configured. Please set a valid OPENAI_API_KEY.");
  }

  try {
    const prompt = `
      Generate personalized content to share information about a construction project with different roles.
      Adapt the content according to each role's permissions. Respond in English.
      
      PROJECT:
      Title: ${projectData.title}
      ${projectData.description ? `Description: ${projectData.description}` : ''}
      ${projectData.aiProjectSummary ? `AI Summary: ${projectData.aiProjectSummary}` : ''}
      ${projectData.aiGeneratedDescription ? `AI Description: ${projectData.aiGeneratedDescription}` : ''}
      ${projectData.budget ? `Budget: $${projectData.budget}` : ''}
      ${projectData.status ? `Status: ${projectData.status}` : ''}
      
      PERMISSIONS CONFIGURATION:
      - Installers: ${settings.installers ? 'Has access' : 'No access'} 
        (MUST NOT include pricing or budget information)
      - Clients: ${settings.clients ? 'Has access' : 'No access'}
        (Can include budget and pricing information)
      - Estimators: ${settings.estimators ? 'Has access' : 'No access'}
        (Can include all technical details and pricing)
      
      INSTRUCTIONS:
      Generate three different versions of the project information:
      1. For Installers: Focus on technical details, materials, and work scope. NO pricing information.
      2. For Clients: Include project overview, timeline, and value proposition. Can include budget.
      3. For Estimators: Include all technical details, pricing breakdown, and professional analysis.
      
      Respond in JSON format with the following keys:
      {
        "installers": "Content for installers (no pricing)",
        "clients": "Content for clients (can include pricing)",
        "estimators": "Content for estimators (full details)"
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response received from the AI model");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating sharing content:", error);
    throw new Error(`Error generating sharing content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}