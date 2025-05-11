import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './badge';
import { Button } from './button';
import { X, Award, Trophy, Star, Gift } from 'lucide-react';
import { Achievement, ContractorAchievement, AchievementReward } from '@shared/schema';
import { cn } from '@/lib/utils';

interface AchievementOverlayProps {
  achievement: Achievement;
  contractorAchievement: ContractorAchievement;
  reward?: AchievementReward;
  onClose: () => void;
}

export function AchievementOverlay({ achievement, contractorAchievement, reward, onClose }: AchievementOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Efecto para auto-cerrar después de 10 segundos si el usuario no interactúa
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // Elegir el ícono según la categoría
  const renderIcon = () => {
    switch (achievement.category) {
      case 'client':
        return <Award className="h-16 w-16 stroke-1" />;
      case 'project':
        return <Trophy className="h-16 w-16 stroke-1" />;
      case 'invoice':
      case 'estimate':
        return <Star className="h-16 w-16 stroke-1" />;
      case 'ai':
        return <Gift className="h-16 w-16 stroke-1" />;
      default:
        return <Award className="h-16 w-16 stroke-1" />;
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Permitir tiempo para la animación de salida
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60"
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative z-50 flex flex-col items-center justify-center w-full max-w-md p-6 mx-4 overflow-hidden rounded-lg shadow-2xl bg-gradient-to-b from-background to-background/90 border border-primary/20"
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2" 
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center text-center"
            >
              <div 
                className={cn(
                  "flex items-center justify-center w-32 h-32 mb-4 rounded-full", 
                  "bg-gradient-to-br from-primary/10 to-primary/30",
                  "border-2 border-primary/20"
                )}
              >
                <div 
                  className={cn(
                    "flex items-center justify-center w-24 h-24 rounded-full",
                    "text-primary",
                    achievement.level === "gold" && "text-amber-500",
                    achievement.level === "silver" && "text-slate-400"
                  )}
                >
                  {renderIcon()}
                </div>
              </div>
              
              <Badge 
                className={cn(
                  "mb-2 px-3 py-1 text-sm",
                  achievement.level === "gold" && "bg-amber-500/20 text-amber-500 border-amber-500/50",
                  achievement.level === "silver" && "bg-slate-400/20 text-slate-400 border-slate-400/50",
                  achievement.level === "bronze" && "bg-amber-700/20 text-amber-700 border-amber-700/50",
                )}
              >
                {achievement.level?.toUpperCase()}
              </Badge>
              
              <h2 className="text-2xl font-bold text-primary mb-2">
                ¡Logro Desbloqueado!
              </h2>
              
              <h3 className="text-xl font-semibold mb-1">
                {achievement.name}
              </h3>
              
              <p className="text-muted-foreground mb-4">
                {achievement.description}
              </p>
              
              <div className="text-lg font-bold text-primary mb-4">
                +{achievement.points} XP
              </div>

              {reward && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-primary/10 border border-primary/20 rounded-lg p-4 w-full mt-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">¡Recompensa Obtenida!</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{reward.description}</p>
                </motion.div>
              )}
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="w-full flex justify-center mt-4"
              >
                <Button onClick={handleClose} className="w-full">
                  Continuar
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}