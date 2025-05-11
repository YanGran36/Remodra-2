import { JWT } from 'google-auth-library';
import { google, sheets_v4 } from 'googleapis';
import { db } from "@db";
import { clients, Client, googleSheetsConfig, GoogleSheetsConfig } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Definir credenciales y configuración
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// Ya no usamos un ID de hoja fijo, ahora se busca por contratista

// Función para intentar limpiar y parsear una clave JSON
const tryParseServiceAccountKey = (input: string): any => {
  if (!input) {
    throw new Error('La clave de servicio está vacía');
  }

  console.log('Intentando parsear clave de servicio, longitud:', input.length);
  
  // 1. Caso especial: la entrada parece ser solo la private_key sin el objeto JSON completo
  if (input.includes('MIIE') && !input.includes('{') && !input.includes('}')) {
    console.log('Detectada entrada que parece ser únicamente la clave privada. Construyendo objeto JSON...');
    
    // Construir un JSON completo con la clave privada
    const privateKey = input.trim();
    const formattedKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    
    // Crear un objeto de cuenta de servicio con la clave privada
    return {
      "type": "service_account",
      "project_id": "contractor-hub",
      "private_key_id": "private_key_" + Date.now(),
      "private_key": formattedKey,
      "client_email": "contractor-hub-service@contractor-hub.iam.gserviceaccount.com",
      "client_id": "client_id_" + Date.now(),
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/contractor-hub-service%40contractor-hub.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    };
  }
  
  // 2. Caso más sencillo: la cadena ya es un JSON válido
  try {
    return JSON.parse(input);
  } catch (e) {
    // Si falla, continuamos con más intentos
    console.log('Primer intento de parseo falló, intentando limpiar la cadena...');
  }

  // 3. Limpiar la cadena de caracteres problemáticos
  let cleaned = input.trim();

  // Eliminar comillas envolventes si existen
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
    
    // Intentar nuevamente después de eliminar comillas
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.log('Segundo intento de parseo falló después de eliminar comillas...');
    }
  }

  // 4. Probar reemplazando caracteres de escape y comillas problemáticas
  try {
    // Detectar si hay secuencias de escape problemáticas
    const normalized = cleaned
      .replace(/\\"/g, '"')        // Reemplazar \" por "
      .replace(/\\n/g, '\n')       // Reemplazar \n literal por salto de línea
      .replace(/\\r/g, '\r')       // Reemplazar \r literal por retorno de carro
      .replace(/\\\\/g, '\\')      // Reemplazar \\ por \
      .replace(/\\t/g, '\t');      // Reemplazar \t literal por tabulación
    
    return JSON.parse(normalized);
  } catch (e) {
    console.log('Tercer intento con normalización simple falló...');
  }

  // 5. Intento adicional: considerar que podría estar doblemente escapada
  try {
    const doubleUnescaped = cleaned
      .replace(/\\\\/g, '\\')
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r');
    
    return JSON.parse(doubleUnescaped);
  } catch (e) {
    console.log('Cuarto intento con doble escape falló...');
  }

  // 6. Intento con búsqueda manual de llaves
  try {
    // Buscar el primer '{' y el último '}'
    const startBrace = cleaned.indexOf('{');
    const endBrace = cleaned.lastIndexOf('}');
    
    if (startBrace !== -1 && endBrace !== -1 && startBrace < endBrace) {
      const jsonSubstring = cleaned.substring(startBrace, endBrace + 1);
      return JSON.parse(jsonSubstring);
    }
  } catch (e) {
    console.log('Quinto intento con búsqueda manual falló...');
  }

  // 7. Verificar si parece una clave codificada en base64
  if (/^[A-Za-z0-9+/=]+$/.test(cleaned)) {
    try {
      console.log('Intentando decodificar como base64...');
      const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
      if (decoded.includes('{') && decoded.includes('}')) {
        return JSON.parse(decoded);
      }
    } catch (e) {
      console.log('Intento de decodificación base64 falló...');
    }
  }

  // Mostrar más información para ayudar a depurar
  console.error('No se pudo parsear la clave. Primeros 50 caracteres:', input.substring(0, 50));
  console.error('Últimos 50 caracteres:', input.substring(input.length - 50));
  
  // Si llegamos aquí, todos los intentos fallaron
  throw new Error('No se pudo parsear la clave de servicio después de múltiples intentos. Por favor, verifica el formato de la clave JSON.');
};

// Clave de servicio codificada en base64 para mayor seguridad y facilidad de manejo
const HARDCODED_SERVICE_KEY = "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAibGVhZC1jYXB0dXJlLTQ1MzUwMSIsCiAgInByaXZhdGVfa2V5X2lkIjogImEyN2VhMjgzYjEzYzk2MTUyMDZmNDYyZGU5NDFiYWQyZDRiNDcxMzAiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQzN0WGZCbjNQWGVxNHJcbmtQM1dGS3VUNXh5bEdJRHR4UEYzTXdxM0lpTitMcVhGZ1ZRY3RyaGJPaXhraGR5NUN3Q1lUMFY0U3cyNEM3K1FcbnAwOEprOVhVUHppQ25vamw5UVZpdGZVTHhZM3RySnBUNlVNaVJpU2krYzVmd2ltRU5QQXowcVNacCt2UnNhdG1cbmtOU1QrZ2psRE0zRWl5Qk5Uc0FyRk1VUWJBZ1hIais1aXo4WlVNbTZ5bmFOUUFDWjZEMFZKWEwzOXMwUDlxajBcbmxUM0piNFJGMDlUSlphU3NWVTY1bGxIcFYxakNJVER3emdIMDY4Ti85M0xBeGMwVEFKSy92eUVIV0dNN0wzdmpcbmU4VHBiY0NMSDNIMWNEcU9jRnhrcEoxNjUzMjk3NFU3b1NyQUZzVG1HZDdiRDJMUUxPOTNzMHJOMkNpUTVrejJcbjFsd3pRYmE5QWdNQkFBRUNnZ0VBQXYxQUl6V2ZhTzR5SENIRmN0QzdTZjgzN2JTWkt0N2o2OFBScUFSb2wzRUpcblJrNUNCMUpoMG1DWXdGT1c1S2k1K1BPeFEwc0lqVkNEbjkrL2VMRTVpTFVCMk1zUVp6UHBkb1c2cEtQK1RBYjJcbitMVDRrM3ZMNkFTVyt4WlFIcUVCRjViSVJVZk5hb2dYTEV6Z205Zk9nZ3VnNCt3OGJMalBVdVFpMC9XVWRiaWRcbkwrQVBVcXNxQ2U5cVlBcC9hek5QVEpUNXZkYWJFWHZCVGFJYkxaRTg2aUxlMEZlemJlMHE2TmF3MHM2VzBSSTZcbmtrYVRzY0NKYitTTDE4cmNEWkJoR2RKQ2JqQ2pxVE8wVEdFdGJIVTZkd0RVa0Q2bURqb2l1c2FxaUNBYnk5aytcblJUcEFGMlViSG1DT0lreUpKWW9KK0pZbmYzWEpnekNiM2V4bEdvSzJjUUtCZ1FEeE1qZzJsWWcwREpTUkgzOGlcbmZNbmM0dGI0RGE0OXZLVFBmV1RVVmIySDNOdzBrVk9JMnM0Z0t5VDVueVozRHZHNDhiblh4WFlKMkh2OTROYmlcbjRwcVlaa1BUVTlpYWJPTXhUQ2F2U3MvWDhzbG1qemdZSmlzdVhJRjBCR1hYTjdmWVhhU0MxejB2K3ZPZW5RcjNcbmcvTmJ6MEV6TzBQZXB3NXFhTlNBRExFNFZ3S0JnUURDKy90MXRoUkdHY3JaMkNGbnllSU1mVlRXQ2VOVE1XcnFcbk9YM04rSzlIRXl4bkxYc0ZpTXBqMlNZOVBFLzgzRG1LZ1FMNzBxVXA1akNmQzBOeitsUSs5V0xhWFUwR0F1RW5cbkNzaDAzZTZpb2t5OCtra08vZ1dUQmJDVVZ2UHdGc1dxaTZwVnM3L1I2Lzd6VUdPZHNUN2hNUFl6YW9ST3JCSWNcbkl5cHNjd3N0Q3dLQmdRRGwwZ0k2RUhVOWt4Y2t5S3d0UWxaZUFFN3hBS2diNzFuaTB3cDJRRlJkMXBhRUNFMWVcblE0N1FuQXVaUm9veU82MGJta2lJVG9CUWxWUmY3aE1URVBSWmJtZ0dQd2hPN0ozMlpTY2ZNOXVqV3BXSkFjSmpcblVFc28yOEFGdWdNSDlQRmFXcS9jZEJhN1Z4VTI5MUJ4MCtyWWVqMFlBY3FEcHc1WFdoZlJBMGNCOVFLQmdIcGRcbnV5VFhYUWZWWGZteTZ0d0ExWTB6Qm8vQTZ0b2w5RXdFUXBDRjFqSkx0UjBYYk5JL1U0eXdGWkJ1am1CSk1ROWNcbkFheGFPTzcvbUZubnJyQlZWSk9pV2lSaVUxbEhhMWVlSzhrMEVuUWNXUDVzTUhkcE1jUmYyTDV2aDIyUVRRTEhcbjNlRWxDbWZLckZpMGhaL01RWUwvd0RMcVVSZ3lZcmNuMXBMeTYvdWJBb0dBTVI5U3VjNXhkU3lVaFRIL1pPTVFcbmNreEIxNURFbkhJcVBvSCt1L0l2em1COEJjeEpYMGJldDVqSFc3eURqMWxCNnRjbnNjUkdQMTAwbXJ6YlBjOVFcbjBlRE1ENDN3eUdXRXdZUHZRZFVhVHNNL0VHM2VvOE95d011WW5OSkdibTkyakZ2NTJxWXJ0ZWNTVTBvbGlJM1RcblR1TTlIaGxiRlhBV2tLYnpTNUNwTkFBPVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAiY2xpZW50X2VtYWlsIjogImNsb2NraW4tY2xvY2tvdXRAbGVhZC1jYXB0dXJlLTQ1MzUwMS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMDY0NDIwODc2ODg1NzU5NzM2MTEiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2Nsb2NraW4tY2xvY2tvdXQlNDBsZWFkLWNhcHR1cmUtNDUzNTAxLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAidW5pdmVyc2VfZG9tYWluIjogImdvb2dsZWFwaXMuY29tIgp9Cg==";

// Crear y autorizar un cliente JWT para la API de Google
const getJWTClient = async (): Promise<JWT> => {
  try {
    console.log('Inicializando cliente JWT con clave hardcoded...');
    
    // Decodificar la clave de servicio base64
    const serviceAccountKeyStr = Buffer.from(HARDCODED_SERVICE_KEY, 'base64').toString('utf-8');
    
    // Parsear la clave JSON
    const serviceAccountKey = JSON.parse(serviceAccountKeyStr);
    
    // Verificar que la clave tenga los campos necesarios
    if (!serviceAccountKey.client_email || !serviceAccountKey.private_key) {
      throw new Error('La clave de servicio decodificada no contiene los campos requeridos');
    }

    console.log('Clave de servicio procesada correctamente, configurando cliente JWT...');
    console.log('Email de cliente encontrado:', serviceAccountKey.client_email);
    console.log('Longitud de la private_key:', serviceAccountKey.private_key.length);
    
    const jwtClient = new JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: SCOPES,
    });

    // Autorizar el cliente
    console.log('Autorizando cliente JWT...');
    await jwtClient.authorize();
    console.log('Cliente JWT autorizado correctamente');
    return jwtClient;
  } catch (error: any) {
    console.error('Error al autorizar el cliente JWT:', error);
    
    // Agregar más información para depuración
    if (error.message.includes('private_key')) {
      console.error('Problema detectado con la clave privada. Por favor asegúrate de que la clave privada incluye los saltos de línea (\\n)');
    }
    
    if (error.message.includes('invalid_grant') || error.message.includes('unauthorized_client')) {
      console.error('Problema de autorización. Verifica que la cuenta de servicio tenga los permisos correctos y esté activa');
    }
    
    throw new Error(`Error de autenticación con Google: ${error.message}`);
  }
};

// Obtener API de Google Sheets 
const getSheetsAPI = async (): Promise<sheets_v4.Sheets> => {
  const auth = await getJWTClient();
  return google.sheets({ version: 'v4', auth });
};

// Obtener la configuración de Google Sheets de un contratista
const getGoogleSheetsConfig = async (contractorId: number): Promise<GoogleSheetsConfig | null> => {
  try {
    const [config] = await db
      .select()
      .from(googleSheetsConfig)
      .where(and(
        eq(googleSheetsConfig.contractorId, contractorId),
        eq(googleSheetsConfig.enabled, true)
      ));
    
    return config || null;
  } catch (error: any) {
    console.error('Error al obtener configuración de Google Sheets:', error);
    return null;
  }
};

// Registrar o actualizar la configuración de Google Sheets para un contratista
export const registerSheetsConfig = async (contractorId: number, spreadsheetId: string, spreadsheetName?: string): Promise<GoogleSheetsConfig> => {
  try {
    // Verificar si ya existe una configuración para este contratista
    const existingConfig = await getGoogleSheetsConfig(contractorId);
    
    if (existingConfig) {
      // Actualizar configuración existente
      const [updatedConfig] = await db.update(googleSheetsConfig)
        .set({
          spreadsheetId,
          spreadsheetName: spreadsheetName || `Hoja de ${contractorId}`,
          enabled: true,
          updatedAt: new Date()
        })
        .where(eq(googleSheetsConfig.id, existingConfig.id))
        .returning();
      
      return updatedConfig;
    } else {
      // Crear nueva configuración
      const [newConfig] = await db.insert(googleSheetsConfig)
        .values({
          contractorId,
          spreadsheetId,
          spreadsheetName: spreadsheetName || `Hoja de ${contractorId}`,
          enabled: true,
          autoSync: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newConfig;
    }
  } catch (error: any) {
    console.error('Error al registrar configuración de Google Sheets:', error);
    throw new Error(`Error al registrar configuración: ${error.message}`);
  }
};

// Función auxiliar para extraer el ID de la hoja de una URL de Google Sheets
const extractSpreadsheetId = (input: string): string => {
  // Si es solo un ID (formato típico: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input.trim())) {
    return input.trim();
  }
  
  // Si es una URL, extraer el ID
  const urlPattern = /\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})(?:\/|$|\?|#)/;
  const match = input.match(urlPattern);
  
  if (match && match[1]) {
    console.log('ID de hoja extraído correctamente de URL:', match[1]);
    return match[1];
  }
  
  // Si no coincide con los patrones, devolver el input original
  console.log('No se pudo extraer ID de hoja, usando valor original:', input);
  return input;
};

// Verificar y crear hojas necesarias si no existen
export const initializeSheets = async (contractorId: number, spreadsheetId: string, spreadsheetName?: string): Promise<void> => {
  try {
    const sheets = await getSheetsAPI();
    
    // Extraer el ID correcto de la hoja de la URL o el string proporcionado
    const cleanedSpreadsheetId = extractSpreadsheetId(spreadsheetId);
    console.log('Usando ID de hoja de cálculo:', cleanedSpreadsheetId);
    
    // Registrar la hoja en la configuración del contratista
    await registerSheetsConfig(contractorId, cleanedSpreadsheetId, spreadsheetName);
    
    // Verificar si ya existe la hoja de clientes
    const response = await sheets.spreadsheets.get({
      spreadsheetId: cleanedSpreadsheetId,
    });
    
    const existingSheets = response.data.sheets?.map(sheet => sheet.properties?.title);
    const requiredSheets = ['Clients', 'Projects', 'Estimates', 'Invoices'];
    
    // Crear las hojas que faltan
    const requests = [];
    for (const sheetName of requiredSheets) {
      if (!existingSheets?.includes(sheetName)) {
        requests.push({
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        });
      }
    }
    
    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          requests,
        },
      });
      console.log(`Hojas creadas: ${requests.map(r => r.addSheet.properties.title).join(', ')}`);
    }
    
    // Configurar encabezados para la hoja de clientes si es nueva
    if (!existingSheets?.includes('Clients')) {
      const headers = [
        'ID', 'ContractorID', 'FirstName', 'LastName', 'Email', 
        'Phone', 'Address', 'City', 'State', 'ZipCode', 
        'Notes', 'CreatedAt', 'UpdatedAt'
      ];
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Clients!A1:M1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
      console.log('Encabezados de Clients configurados');
    }
    
    // Actualizar la fecha de última sincronización
    await db.update(googleSheetsConfig)
      .set({ 
        lastSync: new Date()
      })
      .where(and(
        eq(googleSheetsConfig.contractorId, contractorId),
        eq(googleSheetsConfig.spreadsheetId, spreadsheetId)
      ));
      
    console.log(`Hoja de cálculo inicializada para el contratista ${contractorId}`);
  } catch (error: any) {
    console.error('Error al inicializar las hojas de cálculo:', error);
    throw new Error(`Error al inicializar Google Sheets: ${error.message}`);
  }
};

// Exportar clientes a Google Sheets
export const exportClientsToSheets = async (contractorId: number): Promise<string> => {
  try {
    // Obtener la configuración de Google Sheets para el contratista
    const config = await getGoogleSheetsConfig(contractorId);
    if (!config) {
      throw new Error('No hay configuración de Google Sheets para este contratista. Por favor, inicialice primero.');
    }
    
    const sheets = await getSheetsAPI();
    
    // Extraer el ID correcto de la hoja de la URL o el string almacenado
    const cleanedSpreadsheetId = extractSpreadsheetId(config.spreadsheetId);
    console.log('Exportando a hoja de cálculo con ID:', cleanedSpreadsheetId);
    
    // Obtener clientes del contratista desde la base de datos
    const clientsData = await db.query.clients.findMany({
      where: eq(clients.contractorId, contractorId)
    });
    
    if (clientsData.length === 0) {
      return 'No hay clientes para exportar';
    }
    
    // Formatear datos para Google Sheets
    const rows = clientsData.map(client => [
      client.id,
      client.contractorId,
      client.firstName || '',
      client.lastName || '',
      client.email || '',
      client.phone || '',
      client.address || '',
      client.city || '',
      client.state || '',
      client.zip || '',
      client.notes || '',
      client.createdAt ? new Date(client.createdAt).toISOString() : '',
      '' // No hay updatedAt en el esquema de clientes
    ]);
    
    // Obtener el número de filas existentes (para no sobrescribir encabezados)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: cleanedSpreadsheetId,
      range: 'Clients!A:A',
    });
    
    const startRow = 2; // Comenzar después de los encabezados
    
    // Limpiar datos existentes (excepto encabezados)
    if (response.data.values && response.data.values.length > 1) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: cleanedSpreadsheetId,
        range: `Clients!A${startRow}:M1000`, // Limpiar desde la fila 2 hasta la 1000
      });
    }
    
    // Escribir nuevos datos
    await sheets.spreadsheets.values.update({
      spreadsheetId: cleanedSpreadsheetId,
      range: `Clients!A${startRow}:M${startRow + rows.length - 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: rows,
      },
    });
    
    // Actualizar la fecha de última sincronización
    await db.update(googleSheetsConfig)
      .set({ lastSync: new Date() })
      .where(eq(googleSheetsConfig.id, config.id));
    
    return `${rows.length} clientes exportados a Google Sheets exitosamente`;
  } catch (error: any) {
    console.error('Error al exportar clientes a Google Sheets:', error);
    throw new Error(`Error al exportar a Google Sheets: ${error.message}`);
  }
};

// Importar clientes desde Google Sheets a la base de datos
export const importClientsFromSheets = async (contractorId: number): Promise<string> => {
  try {
    // Obtener la configuración de Google Sheets para el contratista
    const config = await getGoogleSheetsConfig(contractorId);
    if (!config) {
      throw new Error('No hay configuración de Google Sheets para este contratista. Por favor, inicialice primero.');
    }
    
    const sheets = await getSheetsAPI();
    
    // Extraer el ID correcto de la hoja de la URL o el string almacenado
    const cleanedSpreadsheetId = extractSpreadsheetId(config.spreadsheetId);
    console.log('Importando desde hoja de cálculo con ID:', cleanedSpreadsheetId);
    
    // Obtener datos de la hoja de clientes
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: cleanedSpreadsheetId,
      range: 'Clients!A2:M1000', // Desde la fila 2 (sin encabezados) hasta la 1000
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      return 'No hay datos para importar desde Google Sheets';
    }
    
    // Filtrar solo los clientes del contratista especificado
    const clientsData = response.data.values
      .filter(row => row[1] === contractorId.toString() || Number(row[1]) === contractorId);
    
    if (clientsData.length === 0) {
      return 'No hay clientes del contratista especificado en Google Sheets';
    }
    
    // Importar clientes a la base de datos
    const importedClients = [];
    
    for (const row of clientsData) {
      // Convertir datos de fila a objeto de cliente
      const clientData = {
        // No incluimos el ID para crear nuevos registros
        contractorId,
        firstName: row[2] || null,
        lastName: row[3] || null,
        email: row[4] || null,
        phone: row[5] || null,
        address: row[6] || null,
        city: row[7] || null,
        state: row[8] || null,
        zip: row[9] || null,  // Corregido de zipCode a zip
        notes: row[10] || null,
        createdAt: new Date()
        // No hay updatedAt en el esquema de clientes
      };
      
      // Insertar en la base de datos
      const [newClient] = await db.insert(clients).values(clientData).returning();
      importedClients.push(newClient);
    }
    
    // Actualizar la fecha de última sincronización
    await db.update(googleSheetsConfig)
      .set({ lastSync: new Date() })
      .where(eq(googleSheetsConfig.id, config.id));
    
    return `${importedClients.length} clientes importados desde Google Sheets`;
  } catch (error: any) {
    console.error('Error al importar clientes desde Google Sheets:', error);
    throw new Error(`Error al importar desde Google Sheets: ${error.message}`);
  }
};

// Sincronizar cambios bidireccionales entre la base de datos y Google Sheets
export const syncClientsWithSheets = async (contractorId: number): Promise<string> => {
  try {
    // Verificar si hay una configuración activa para el contratista
    const config = await getGoogleSheetsConfig(contractorId);
    if (!config) {
      throw new Error('No hay configuración de Google Sheets para este contratista. Por favor, inicialice primero.');
    }
    
    // Primero exportamos a Sheets para asegurarnos que está actualizado
    await exportClientsToSheets(contractorId);
    
    // Luego importamos cambios de Sheets (nuevos clientes)
    const importResult = await importClientsFromSheets(contractorId);
    
    // Actualizar la fecha de última sincronización
    await db.update(googleSheetsConfig)
      .set({ lastSync: new Date() })
      .where(eq(googleSheetsConfig.id, config.id));
    
    return `Sincronización completada: ${importResult}`;
  } catch (error: any) {
    console.error('Error al sincronizar clientes con Google Sheets:', error);
    throw new Error(`Error en la sincronización: ${error.message}`);
  }
};