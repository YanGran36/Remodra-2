import { db } from ".";

async function dropAchievementTables() {
  console.log("Eliminando tablas del sistema de logros...");
  
  try {
    // Eliminar tablas en orden inverso para respetar las dependencias de clave foránea
    await db.execute(`DROP TABLE IF EXISTS contractor_streaks CASCADE;`);
    await db.execute(`DROP TABLE IF EXISTS achievement_rewards CASCADE;`);
    await db.execute(`DROP TABLE IF EXISTS contractor_achievements CASCADE;`);
    await db.execute(`DROP TABLE IF EXISTS achievements CASCADE;`);
    
    console.log("Tablas del sistema de logros eliminadas con éxito.");
  } catch (error) {
    console.error("Error al eliminar las tablas:", error);
    throw error;
  }
}

// Execute the drop function
dropAchievementTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Eliminación fallida:", error);
    process.exit(1);
  });