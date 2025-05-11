import { JWT } from 'google-auth-library';
import { google, sheets_v4 } from 'googleapis';
import { db } from "@db";
import { clients, Client } from "@shared/schema";
import { eq } from "drizzle-orm";

// Definir credenciales y configuración
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

// Crear y autorizar un cliente JWT para la API de Google
const getJWTClient = async (): Promise<JWT> => {
  try {
    // Parsear la clave de la cuenta de servicio desde la variable de entorno
    const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
    
    const jwtClient = new JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: SCOPES,
    });

    // Autorizar el cliente
    await jwtClient.authorize();
    return jwtClient;
  } catch (error) {
    console.error('Error al autorizar el cliente JWT:', error);
    throw new Error(`Error de autenticación con Google: ${error.message}`);
  }
};

// Obtener API de Google Sheets 
const getSheetsAPI = async (): Promise<sheets_v4.Sheets> => {
  const auth = await getJWTClient();
  return google.sheets({ version: 'v4', auth });
};

// Verificar y crear hojas necesarias si no existen
export const initializeSheets = async (): Promise<void> => {
  try {
    const sheets = await getSheetsAPI();
    
    // Verificar si ya existe la hoja de clientes
    const response = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
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
        spreadsheetId: GOOGLE_SHEETS_ID,
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
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: 'Clients!A1:M1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
      console.log('Encabezados de Clients configurados');
    }
  } catch (error) {
    console.error('Error al inicializar las hojas de cálculo:', error);
    throw new Error(`Error al inicializar Google Sheets: ${error.message}`);
  }
};

// Exportar clientes a Google Sheets
export const exportClientsToSheets = async (contractorId: number): Promise<string> => {
  try {
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
      client.zipCode || '',
      client.notes || '',
      client.createdAt ? new Date(client.createdAt).toISOString() : '',
      client.updatedAt ? new Date(client.updatedAt).toISOString() : ''
    ]);
    
    // Obtener el número de filas existentes (para no sobrescribir encabezados)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: 'Clients!A:A',
    });
    
    const startRow = 2; // Comenzar después de los encabezados
    
    // Limpiar datos existentes (excepto encabezados)
    if (response.data.values && response.data.values.length > 1) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: `Clients!A${startRow}:M1000`, // Limpiar desde la fila 2 hasta la 1000
      });
    }
    
    // Escribir nuevos datos
    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `Clients!A${startRow}:M${startRow + rows.length - 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: rows,
      },
    });
    
    return `${rows.length} clientes exportados a Google Sheets exitosamente`;
  } catch (error) {
    console.error('Error al exportar clientes a Google Sheets:', error);
    throw new Error(`Error al exportar a Google Sheets: ${error.message}`);
  }
};

// Importar clientes desde Google Sheets a la base de datos
export const importClientsFromSheets = async (contractorId: number): Promise<string> => {
  try {
    const sheets = await getSheetsAPI();
    
    // Obtener datos de la hoja de clientes
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
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
        zipCode: row[9] || null,
        notes: row[10] || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Insertar en la base de datos
      const [newClient] = await db.insert(clients).values(clientData).returning();
      importedClients.push(newClient);
    }
    
    return `${importedClients.length} clientes importados desde Google Sheets`;
  } catch (error) {
    console.error('Error al importar clientes desde Google Sheets:', error);
    throw new Error(`Error al importar desde Google Sheets: ${error.message}`);
  }
};

// Sincronizar cambios bidireccionales entre la base de datos y Google Sheets
export const syncClientsWithSheets = async (contractorId: number): Promise<string> => {
  try {
    // Primero exportamos a Sheets para asegurarnos que está actualizado
    await exportClientsToSheets(contractorId);
    
    // Luego importamos cambios de Sheets (nuevos clientes)
    const importResult = await importClientsFromSheets(contractorId);
    
    return `Sincronización completada: ${importResult}`;
  } catch (error) {
    console.error('Error al sincronizar clientes con Google Sheets:', error);
    throw new Error(`Error en la sincronización: ${error.message}`);
  }
};