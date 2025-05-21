import { db } from "./index";
import { servicePricing, materialPricing } from "../shared/schema";
import { eq } from "drizzle-orm";
import { pool } from "./index";

/**
 * Script para eliminar todos los datos predeterminados de servicios y materiales
 * Esto permitirá que cada contratista agregue sus propios servicios y materiales
 * Utilizando SQL directo para evitar problemas con la estructura de las tablas
 */
async function clearDefaultData() {
  try {
    console.log("Comenzando limpieza de datos predeterminados...");

    // Obtener cliente directo para ejecutar SQL
    const client = await pool.connect();

    try {
      // Eliminar todos los servicios predeterminados
      console.log("Eliminando servicios predeterminados...");
      const servicesResult = await client.query('DELETE FROM "service_pricing" RETURNING *');
      console.log(`Servicios eliminados: ${servicesResult.rowCount}`);

      // Eliminar todos los materiales predeterminados
      console.log("Eliminando materiales predeterminados...");
      const materialsResult = await client.query('DELETE FROM "material_pricing" RETURNING *');
      console.log(`Materiales eliminados: ${materialsResult.rowCount}`);

      console.log("Limpieza de datos predeterminados completada exitosamente.");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al limpiar datos predeterminados:", error);
    process.exit(1);
  }
}

// Ejecutar el script inmediatamente
clearDefaultData()
  .then(() => {
    console.log("Proceso completado. Saliendo...");
    setTimeout(() => process.exit(0), 500);
  })
  .catch((err) => {
    console.error("Error al ejecutar el proceso:", err);
    process.exit(1);
  });

export { clearDefaultData };