import { db } from "../../db/index";
import { 
  achievements, 
  contractor_achievements, 
  achievement_rewards, 
  contractor_streaks 
} from "../../shared/schema-sqlite";
import { eq, and } from "drizzle-orm";

export interface AchievementCheckData {
  contractorId: number;
  category: string;
  code: string;
  progress: number;
}

/**
 * Obtiene todos los logros disponibles
 */
export async function getAllAchievements() {
  try {
    if (!db) {
      console.warn("Database not available, returning empty achievements");
      return [];
    }
    const allAchievements = await db.select().from(achievements);
    return allAchievements;
  } catch (error) {
    console.error("Error fetching all achievements:", error);
    return [];
  }
}

/**
 * Obtiene los logros de un contratista específico
 */
export async function getContractorAchievements(contractorId: number) {
  try {
    if (!db) {
      console.warn("Database not available, returning empty contractor achievements");
      return [];
    }
    const contractorAchievements = await db
      .select()
      .from(contractor_achievements)
      .where(eq(contractor_achievements.contractor_id, contractorId));
    
    return contractorAchievements;
  } catch (error) {
    console.error("Error fetching contractor achievements:", error);
    return [];
  }
}

/**
 * Obtiene los logros no leídos del contratista
 */
export async function getUnreadAchievements(contractorId: number) {
  try {
    if (!db) {
      console.warn("Database not available, returning empty unread achievements");
      return [];
    }
    
    const unreadAchievements = await db
      .select({
        id: contractor_achievements.id,
        achievementId: contractor_achievements.achievement_id,
        contractorId: contractor_achievements.contractor_id,
        progress: contractor_achievements.progress,
        isCompleted: contractor_achievements.is_completed,
        earnedAt: contractor_achievements.earned_at,
        notified: contractor_achievements.notified,
        achievement: {
          id: achievements.id,
          name: achievements.name,
          description: achievements.description,
          category: achievements.category,
          code: achievements.code,
          points: achievements.points,
          icon: achievements.icon
        }
      })
      .from(contractor_achievements)
      .innerJoin(achievements, eq(contractor_achievements.achievement_id, achievements.id))
      .where(
        and(
          eq(contractor_achievements.contractor_id, contractorId),
          eq(contractor_achievements.notified, false)
        )
      );
    
    return unreadAchievements;
  } catch (error) {
    console.error("Error fetching unread achievements:", error);
    return [];
  }
}

/**
 * Marca un logro como notificado
 */
export async function markAchievementAsNotified(contractorId: number, achievementId: number) {
  try {
    const [updated] = await db
      .update(contractor_achievements)
      .set({ 
        notified: true
      })
      .where(
        and(
          eq(contractor_achievements.contractor_id, contractorId),
          eq(contractor_achievements.achievement_id, achievementId)
        )
      )
      .returning();
      
    return updated;
  } catch (error) {
    console.error("Error marking achievement as notified:", error);
    throw new Error("Failed to mark achievement as notified");
  }
}

/**
 * Marca una recompensa como desbloqueada
 */
export async function unlockReward(contractorId: number, achievementId: number) {
  try {
    const [updated] = await db
      .update(contractor_achievements)
      .set({ 
        unlockedReward: true
      })
      .where(
        and(
          eq(contractor_achievements.contractor_id, contractorId),
          eq(contractor_achievements.achievement_id, achievementId)
        )
      )
      .returning();
      
    // Obtener la recompensa para aplicarla
    const reward = await db
      .select()
      .from(achievement_rewards)
      .where(eq(achievement_rewards.achievement_id, achievementId))
      .limit(1);
    
    if (reward.length > 0) {
      // Aquí se podría aplicar la recompensa según su tipo
      // Por ejemplo, si es un descuento, actualizaríamos la suscripción
      // Si es una característica, actualizaríamos las capacidades del contratista
      // Por ahora solo devolvemos la recompensa para mostrarla
      return { updated, reward: reward[0] };
    }
    
    return { updated };
  } catch (error) {
    console.error("Error unlocking reward:", error);
    throw new Error("Failed to unlock reward");
  }
}

/**
 * Verifica y actualiza el progreso de un logro específico
 */
export async function checkAndUpdateAchievement(data: AchievementCheckData) {
  try {
    // Obtener el logro por código
    const achievement = await db
      .select()
      .from(achievements)
      .where(eq(achievements.code, data.code))
      .limit(1);
    
    if (achievement.length === 0) {
      throw new Error(`Achievement with code ${data.code} not found`);
    }
    
    const achievementData = achievement[0];
    
    // Check if the contractor already has this achievement
    let contractorAchievement = await db
      .select()
      .from(contractor_achievements)
      .where(and(
        eq(contractor_achievements.contractor_id, data.contractorId),
        eq(contractor_achievements.achievement_id, achievementData.id)
      ))
      .limit(1);
    
    let isNewlyCompleted = false;
    
    if (contractorAchievement.length > 0) {
      const existingAchievement = contractorAchievement[0];
      
      // Si ya existe, actualizamos el progreso
      if (existingAchievement.is_completed) {
        // Si ya está completado, no hacemos nada
        return { contractorAchievement: existingAchievement, isNewlyCompleted: false };
      }
      
      // Si no está completado, actualizamos el progreso
      const isCompleted = data.progress >= achievementData.required_count;
      
      const [updated] = await db
        .update(contractor_achievements)
        .set({
          progress: data.progress,
          is_completed: isCompleted,
          earned_at: isCompleted ? Date.now() : existingAchievement.earned_at
        })
        .where(
          and(
            eq(contractor_achievements.contractor_id, data.contractorId),
            eq(contractor_achievements.achievement_id, achievementData.id)
          )
        )
        .returning();
      
      isNewlyCompleted = isCompleted && !existingAchievement.is_completed;
      contractorAchievement = [updated];
      
    } else {
      // Si no existe, lo creamos
      const isCompleted = data.progress >= achievementData.required_count;
      
      const [created] = await db
        .insert(contractor_achievements)
        .values({
          contractor_id: data.contractorId,
          achievement_id: achievementData.id,
          progress: data.progress,
          is_completed: isCompleted,
          earned_at: Date.now(),
          notified: false
        })
        .returning();
      
      isNewlyCompleted = isCompleted;
      contractorAchievement = [created];
    }
    
    // Si el logro se completó, actualizar el XP del contratista
    if (isNewlyCompleted) {
      // Obtener la racha actual del contratista
      const streak = await db
        .select()
        .from(contractor_streaks)
        .where(eq(contractor_streaks.contractor_id, data.contractorId))
        .limit(1);
      
      if (streak.length > 0) {
        const currentStreak = streak[0];
        // Actualizar XP
        const newXp = currentStreak.xp + achievementData.points;
        const levelUpThreshold = currentStreak.next_level_xp;
        let newLevel = currentStreak.level;
        let newNextLevelXp = currentStreak.next_level_xp;
        
        // Check if level increased
        if (newXp >= levelUpThreshold) {
          newLevel += 1;
          newNextLevelXp = Math.round(levelUpThreshold * 1.5); // Incremento del 50% para el siguiente nivel
        }
        
        await db
          .update(contractor_streaks)
          .set({
            xp: newXp,
            level: newLevel,
            next_level_xp: newNextLevelXp,
            last_activity_date: Date.now()
          })
          .where(eq(contractor_streaks.contractor_id, data.contractorId));
      } else {
        // Crear registro de racha si no existe
        await db
          .insert(contractor_streaks)
          .values({
            contractor_id: data.contractorId,
            current_streak: 0,
            longest_streak: 0,
            last_activity_date: Date.now(),
            level: 1,
            xp: achievementData.points,
            next_level_xp: 100,
            created_at: Date.now()
          });
      }
    }
    
    return { 
      contractorAchievement: contractorAchievement[0], 
      isNewlyCompleted 
    };
  } catch (error) {
    console.error("Error checking and updating achievement:", error);
    throw new Error("Failed to check and update achievement");
  }
}

/**
 * Actualiza la racha diaria del contratista
 */
export async function updateDailyStreak(contractorId: number) {
  try {
    const today = new Date();
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    const todayStr = formatDate(today);
    
    // Obtener la racha actual del contratista
    const streak = await db
      .select()
      .from(contractor_streaks)
      .where(eq(contractor_streaks.contractor_id, contractorId))
      .limit(1);
    
    if (streak.length > 0) {
      const currentStreak = streak[0];
      const lastActivityDate = new Date(currentStreak.last_activity_date);
      const lastActivityStr = formatDate(lastActivityDate);
      
      // Si ya se actualizó hoy, no hacer nada
      if (lastActivityStr === todayStr) {
        return currentStreak;
      }
      
      // Verificar si es el día siguiente
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDate(yesterday);
      
      let newCurrentStreak = currentStreak.current_streak;
      let newLongestStreak = currentStreak.longest_streak;
      
      if (lastActivityStr === yesterdayStr) {
        // Es el día siguiente, incrementar la racha
        newCurrentStreak += 1;
        if (newCurrentStreak > newLongestStreak) {
          newLongestStreak = newCurrentStreak;
        }
      } else {
        // No es el día siguiente, resetear la racha
        newCurrentStreak = 1;
      }
      
      // Actualizar la racha
      const [updated] = await db
        .update(contractor_streaks)
        .set({
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_activity_date: Date.now()
        })
        .where(eq(contractor_streaks.contractor_id, contractorId))
        .returning();
      
      return updated;
    } else {
      // Crear nueva racha
      const [created] = await db
        .insert(contractor_streaks)
        .values({
          contractor_id: contractorId,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: Date.now(),
          level: 1,
          xp: 0,
          next_level_xp: 100,
          created_at: Date.now()
        })
        .returning();
      
      return created;
    }
  } catch (error) {
    console.error("Error updating daily streak:", error);
    throw new Error("Failed to update daily streak");
  }
}

/**
 * Obtiene las estadísticas del juego del contratista
 */
export async function getContractorGameStats(contractorId: number) {
  try {
    if (!db) {
      console.warn("Database not available, returning default game stats");
      return {
        level: 1,
        xp: 0,
        nextLevelXp: 100,
        currentStreak: 0,
        longestStreak: 0,
        completedAchievements: 0,
        totalAchievements: 0,
        completionPercentage: 0
      };
    }
    
    // Obtener la racha del contratista
    const streak = await db
      .select()
      .from(contractor_streaks)
      .where(eq(contractor_streaks.contractor_id, contractorId))
      .limit(1);
    
    // Obtener logros completados
    const completedAchievements = await db
      .select()
      .from(contractor_achievements)
      .where(and(
        eq(contractor_achievements.contractor_id, contractorId),
        eq(contractor_achievements.is_completed, true)
      ));
    
    // Obtener total de logros disponibles
    const totalAchievements = await db.select().from(achievements);
    
    const stats = {
      level: streak.length > 0 ? streak[0].level : 1,
      xp: streak.length > 0 ? streak[0].xp : 0,
      nextLevelXp: streak.length > 0 ? streak[0].next_level_xp : 100,
      currentStreak: streak.length > 0 ? streak[0].current_streak : 0,
      longestStreak: streak.length > 0 ? streak[0].longest_streak : 0,
      completedAchievements: completedAchievements.length,
      totalAchievements: totalAchievements.length,
      completionPercentage: totalAchievements.length > 0 
        ? Math.round((completedAchievements.length / totalAchievements.length) * 100) 
        : 0
    };
    
    return stats;
  } catch (error) {
    console.error("Error fetching contractor game stats:", error);
    return {
      level: 1,
      xp: 0,
      nextLevelXp: 100,
      currentStreak: 0,
      longestStreak: 0,
      completedAchievements: 0,
      totalAchievements: 0,
      completionPercentage: 0
    };
  }
}