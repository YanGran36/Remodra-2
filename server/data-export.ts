import { db } from "@db";
import fs from "fs";
import path from "path";
import { clients, Client } from "@shared/schema";
import { eq } from "drizzle-orm";

// Directorio donde se guardarán los archivos exportados
const EXPORT_DIR = path.join(process.cwd(), "data-exports");

// Asegurar que el directorio de exportación existe
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// Exportar clientes a JSON por contratista
export async function exportClientsToJSON(contractorId: number): Promise<string> {
  try {
    // Obtener todos los clientes del contratista
    const clientsData = await db.query.clients.findMany({
      where: eq(clients.contractorId, contractorId)
    });

    if (!clientsData || clientsData.length === 0) {
      return "No hay clientes para exportar";
    }

    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const fileName = `clients_${contractorId}_${timestamp}.json`;
    const filePath = path.join(EXPORT_DIR, fileName);

    // Escribir datos al archivo
    fs.writeFileSync(filePath, JSON.stringify(clientsData, null, 2));

    return `Datos exportados exitosamente a ${fileName}`;
  } catch (error) {
    console.error("Error al exportar clientes:", error);
    throw new Error(`Error al exportar clientes: ${error.message}`);
  }
}

// Importar clientes desde un archivo JSON
export async function importClientsFromJSON(filePath: string, contractorId: number): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo ${filePath} no existe`);
    }

    // Leer y parsear el archivo
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const clientsData = JSON.parse(fileContent) as Omit<Client, "id">[];

    // Validar que los datos sean para el contratista correcto
    for (const client of clientsData) {
      if (client.contractorId !== contractorId) {
        throw new Error("Los datos no pertenecen al contratista especificado");
      }
    }

    // Importar clientes (omitiendo IDs para crear nuevos registros)
    const importedClients = [];
    for (const client of clientsData) {
      const { id, ...clientData } = client as any;
      const [newClient] = await db.insert(clients).values(clientData).returning();
      importedClients.push(newClient);
    }

    return `${importedClients.length} clientes importados exitosamente`;
  } catch (error) {
    console.error("Error al importar clientes:", error);
    throw new Error(`Error al importar clientes: ${error.message}`);
  }
}

// Exportar clientes a CSV por contratista
export async function exportClientsToCSV(contractorId: number): Promise<string> {
  try {
    // Obtener todos los clientes del contratista
    const clientsData = await db.query.clients.findMany({
      where: eq(clients.contractorId, contractorId)
    });

    if (!clientsData || clientsData.length === 0) {
      return "No hay clientes para exportar";
    }

    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const fileName = `clients_${contractorId}_${timestamp}.csv`;
    const filePath = path.join(EXPORT_DIR, fileName);

    // Obtener encabezados del CSV (nombres de columnas)
    const headers = Object.keys(clientsData[0]).join(",");
    
    // Convertir datos a filas CSV
    const rows = clientsData.map(client => {
      return Object.values(client)
        .map(value => {
          // Manejar valores que puedan contener comas
          if (typeof value === "string" && (value.includes(",") || value.includes("\n"))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
    });

    // Combinar encabezados y filas
    const csvContent = [headers, ...rows].join("\n");

    // Escribir al archivo
    fs.writeFileSync(filePath, csvContent);

    return `Datos exportados exitosamente a ${fileName}`;
  } catch (error) {
    console.error("Error al exportar clientes a CSV:", error);
    throw new Error(`Error al exportar clientes a CSV: ${error.message}`);
  }
}

// Importar clientes desde un archivo CSV
export async function importClientsFromCSV(filePath: string, contractorId: number): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo ${filePath} no existe`);
    }

    // Leer el archivo
    const fileContent = fs.readFileSync(filePath, "utf-8");
    
    // Dividir en líneas
    const lines = fileContent.split("\n").filter(line => line.trim());
    
    // Obtener encabezados
    const headers = lines[0].split(",");
    
    // Procesar cada línea (excepto la de encabezados)
    const importedClients = [];
    for (let i = 1; i < lines.length; i++) {
      // Manejo básico de CSV (no maneja bien comillas dentro de comillas)
      const values = lines[i].split(",");
      
      // Crear objeto de cliente
      const client: Record<string, any> = {};
      headers.forEach((header, index) => {
        let value = values[index];
        // Intentar convertir a número si es posible
        if (!isNaN(Number(value)) && value.trim() !== "") {
          value = Number(value);
        }
        client[header] = value;
      });
      
      // Asegurarse que el cliente pertenezca al contratista correcto
      client.contractorId = contractorId;
      
      // Omitir el ID para crear un nuevo registro
      const { id, ...clientData } = client;
      
      // Insertar en la base de datos
      const [newClient] = await db.insert(clients).values(clientData).returning();
      importedClients.push(newClient);
    }

    return `${importedClients.length} clientes importados exitosamente desde CSV`;
  } catch (error) {
    console.error("Error al importar clientes desde CSV:", error);
    throw new Error(`Error al importar clientes desde CSV: ${error.message}`);
  }
}