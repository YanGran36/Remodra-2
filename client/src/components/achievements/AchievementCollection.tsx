import { useQuery } from '@tanstack/react-query';
import { Achievement, ContractorAchievement } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Trophy, Star, Check, GiftIcon, Brain, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Componente que muestra la colección de logros del contratista
 */
export function AchievementCollection() {
  // Obtener todos los logros
  const { data: allAchievements, isLoading: loadingAll } = useQuery({
    queryKey: ['/api/achievements'],
  });

  // Obtener logros del contratista
  const { data: contractorAchievements, isLoading: loadingContractor } = useQuery({
    queryKey: ['/api/contractor/achievements'],
  });

  // Obtener estadísticas
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/contractor/stats'],
  });

  const isLoading = loadingAll || loadingContractor || loadingStats;

  // Crear un mapa para buscar rápidamente el progreso de los logros del contratista
  const achievementProgressMap = new Map<number, ContractorAchievement>();
  
  if (contractorAchievements) {
    contractorAchievements.forEach((ca: ContractorAchievement) => {
      achievementProgressMap.set(ca.achievementId, ca);
    });
  }

  // Obtener el icono según la categoría
  const renderIcon = (category: string, level: string = 'bronze') => {
    const iconClass = cn(
      "h-6 w-6",
      level === "gold" && "text-amber-500",
      level === "silver" && "text-slate-400",
      level === "bronze" && "text-amber-700"
    );

    switch (category) {
      case 'client':
        return <Award className={iconClass} />;
      case 'project':
        return <Trophy className={iconClass} />;
      case 'estimate':
      case 'invoice':
        return <Star className={iconClass} />;
      case 'system':
        return <Calendar className={iconClass} />;
      case 'ai':
        return <Brain className={iconClass} />;
      default:
        return <Award className={iconClass} />;
    }
  };

  // Renderizar la tarjeta de un logro
  const renderAchievementCard = (achievement: Achievement) => {
    const progressData = achievementProgressMap.get(achievement.id);
    const isCompleted = progressData?.isCompleted || false;
    const progress = progressData?.progress || 0;
    const progressPercent = Math.min(100, Math.round((progress / achievement.requiredCount) * 100));
    
    return (
      <Card key={achievement.id} className={cn(
        "transition-all duration-300 h-full",
        isCompleted 
          ? "bg-primary/5 border-primary/30" 
          : "bg-background border-border/50 opacity-70"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {renderIcon(achievement.category, achievement.level)}
              <Badge variant={isCompleted ? "default" : "outline"} className={cn(
                achievement.level === "gold" && "bg-amber-500/20 text-amber-500 border-amber-500/50",
                achievement.level === "silver" && "bg-slate-400/20 text-slate-400 border-slate-400/50",
                achievement.level === "bronze" && "bg-amber-700/20 text-amber-700 border-amber-700/50",
                !isCompleted && "opacity-60"
              )}>
                {achievement.level?.toUpperCase()}
              </Badge>
            </div>
            {isCompleted && <Check className="h-5 w-5 text-primary" />}
          </div>
          <CardTitle className="text-md mt-2">{achievement.name}</CardTitle>
          <CardDescription>{achievement.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso:</span>
            <span className={isCompleted ? "font-medium text-primary" : "text-muted-foreground"}>
              {progress}/{achievement.requiredCount}
            </span>
          </div>
          <Progress 
            value={progressPercent} 
            className={cn(
              "h-2",
              isCompleted ? "bg-primary/20" : "bg-muted"
            )} 
          />
          {isCompleted && (
            <div className="flex justify-between items-center mt-3 text-sm">
              <span className="text-primary font-medium">+{achievement.points} XP</span>
              
              {achievement.rewards && achievement.rewards.length > 0 && (
                <div className="flex items-center text-muted-foreground">
                  <GiftIcon className="h-4 w-4 mr-1" />
                  <span>Recompensa disponible</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Filtrar logros por categoría
  const filterAchievementsByCategory = (category: string) => {
    return allAchievements?.filter((a: Achievement) => a.category === category) || [];
  };

  // Estadísticas de resumen
  const renderSummary = () => {
    if (!stats || isLoading) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Nivel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-primary">
                {stats.streak?.level || 1}
              </span>
              <div className="mt-2 w-full">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">XP:</span>
                  <span>{stats.streak?.xp || 0}/{stats.streak?.nextLevelXp || 100}</span>
                </div>
                <Progress 
                  value={Math.round(((stats.streak?.xp || 0) / (stats.streak?.nextLevelXp || 100)) * 100)} 
                  className="h-2" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Logros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-amber-700">{stats.stats?.bronzeCount || 0}</span>
                <span className="text-xs text-muted-foreground">Bronce</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-slate-400">{stats.stats?.silverCount || 0}</span>
                <span className="text-xs text-muted-foreground">Plata</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-amber-500">{stats.stats?.goldCount || 0}</span>
                <span className="text-xs text-muted-foreground">Oro</span>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="text-sm text-muted-foreground">
                {stats.stats?.completedAchievements || 0} de {allAchievements?.length || 0} completados
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Racha</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-primary">
                  {stats.streak?.currentStreak || 0}
                </span>
                <span className="text-sm text-muted-foreground">días consecutivos</span>
              </div>
              <span className="text-sm text-muted-foreground mt-2">
                Racha más larga: {stats.streak?.longestStreak || 0} días
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Mi Progreso</h1>
      
      {renderSummary()}
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-6 mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="client">Clientes</TabsTrigger>
          <TabsTrigger value="project">Proyectos</TabsTrigger>
          <TabsTrigger value="estimate">Estimaciones</TabsTrigger>
          <TabsTrigger value="invoice">Facturación</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allAchievements?.map(renderAchievementCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="client" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterAchievementsByCategory('client').map(renderAchievementCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="project" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterAchievementsByCategory('project').map(renderAchievementCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="estimate" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterAchievementsByCategory('estimate').map(renderAchievementCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="invoice" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterAchievementsByCategory('invoice').map(renderAchievementCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="system" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterAchievementsByCategory('system').map(renderAchievementCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}