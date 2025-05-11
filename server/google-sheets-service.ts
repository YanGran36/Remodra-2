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
  
  // 1. Caso más sencillo: la cadena ya es un JSON válido
  try {
    return JSON.parse(input);
  } catch (e) {
    // Si falla, continuamos con más intentos
    console.log('Primer intento de parseo falló, intentando limpiar la cadena...');
  }

  // 2. Limpiar la cadena de caracteres problemáticos
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

  // 3. Probar reemplazando caracteres de escape y comillas problemáticas
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

  // 4. Intento adicional: considerar que podría estar doblemente escapada
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

  // 5. Intento con búsqueda manual de llaves
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

  // 6. Último recurso: intentar con eval (sólo para claves de servicio en entorno controlado)
  try {
    // Nota: eval es generalmente peligroso, pero en este caso específico
    // estamos usando para parsear una clave de servicio en un entorno controlado
    const obj = eval('(' + cleaned + ')');
    if (obj && typeof obj === 'object' && obj.client_email && obj.private_key) {
      return obj;
    }
  } catch (e) {
    console.log('Último intento con eval falló...');
  }

  // Mostrar más información para ayudar a depurar
  console.error('No se pudo parsear la clave. Primeros 50 caracteres:', input.substring(0, 50));
  console.error('Últimos 50 caracteres:', input.substring(input.length - 50));
  
  // Si llegamos aquí, todos los intentos fallaron
  throw new Error('No se pudo parsear la clave de servicio después de múltiples intentos. Por favor, verifica el formato de la clave JSON.');
};

// Crear y autorizar un cliente JWT para la API de Google
const getJWTClient = async (): Promise<JWT> => {
  try {
    // Obtener la clave de la cuenta de servicio desde la variable de entorno
    const serviceAccountKeyStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKeyStr) {
      throw new Error('No se encontró la clave de cuenta de servicio de Google (GOOGLE_SERVICE_ACCOUNT_KEY)');
    }

    console.log('Procesando clave de servicio de Google...');
    
    // Intentar parsear la clave con nuestra función robusta
    const serviceAccountKey = tryParseServiceAccountKey(serviceAccountKeyStr);
    
    // Verificar que la clave tenga los campos necesarios
    if (!serviceAccountKey.client_email || !serviceAccountKey.private_key) {
      console.error('Campos encontrados en la clave:', Object.keys(serviceAccountKey).join(', '));
      throw new Error('La clave de servicio no contiene los campos requeridos (client_email y private_key)');
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

// Verificar y crear hojas necesarias si no existen
export const initializeSheets = async (contractorId: number, spreadsheetId: string, spreadsheetName?: string): Promise<void> => {
  try {
    const sheets = await getSheetsAPI();
    
    // Registrar la hoja en la configuración del contratista
    await registerSheetsConfig(contractorId, spreadsheetId, spreadsheetName);
    
    // Verificar si ya existe la hoja de clientes
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
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
      spreadsheetId: config.spreadsheetId,
      range: 'Clients!A:A',
    });
    
    const startRow = 2; // Comenzar después de los encabezados
    
    // Limpiar datos existentes (excepto encabezados)
    if (response.data.values && response.data.values.length > 1) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: config.spreadsheetId,
        range: `Clients!A${startRow}:M1000`, // Limpiar desde la fila 2 hasta la 1000
      });
    }
    
    // Escribir nuevos datos
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId,
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
    
    // Obtener datos de la hoja de clientes
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
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