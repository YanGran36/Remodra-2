import { db } from "./index";
import { sql } from "drizzle-orm";

async function migrateTimeclockTable() {
  console.log("Iniciando migración de la tabla de timeclock...");

  try {
    // Crear la tabla usando IF NOT EXISTS para evitar errores si ya existe
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS timeclock_entries (
        id SERIAL PRIMARY KEY,
        contractor_id INTEGER NOT NULL REFERENCES contractors(id),
        employee_name TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        date DATE NOT NULL,
        location TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log("✅ Tabla timeclock_entries creada exitosamente");
  } catch (error) {
    console.error("❌ Error al crear la tabla timeclock_entries:", error);
    throw error;
  }
}

// Ejecutar migración
migrateTimeclockTable()
  .then(() => {
    console.log("✅ Migración de timeclock completada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error en la migración de timeclock:", error);
    process.exit(1);
  });
