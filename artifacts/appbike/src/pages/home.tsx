import { useMyStats } from "@/hooks/use-gamification";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Flame, Star, Trophy, Activity, Medal, Zap, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: stats, isLoading } = useMyStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const progressPercent =
    stats.pointsForNextLevel > 0
      ? (stats.pointsInLevel / stats.pointsForNextLevel) * 100
      : 100;

  return (
    <div className="space-y-6 pb-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Level Card */}
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-xl">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Nivel {stats.level}
              </p>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                {stats.levelName}
              </h2>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 text-primary">
              <Trophy className="w-8 h-8" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted-foreground">{stats.pointsInLevel} pts</span>
              <span className="text-muted-foreground">{stats.pointsForNextLevel} pts</span>
            </div>
            <Progress value={progressPercent} className="h-3 bg-primary/10" />
            <p className="text-xs text-muted-foreground text-center pt-1">
              Faltan {stats.pointsForNextLevel - stats.pointsInLevel} puntos para subir de nivel
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 shadow-sm flex flex-col items-center text-center justify-center bg-card/50">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center mb-2">
            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold">{stats.streakDays}</p>
          <p className="text-xs text-muted-foreground uppercase font-semibold">Días seguidos</p>
        </Card>

        <Card className="p-4 shadow-sm flex flex-col items-center text-center justify-center bg-card/50">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold">{stats.weekKm} <span className="text-sm">km</span></p>
          <p className="text-xs text-muted-foreground uppercase font-semibold">Esta semana</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 shadow-sm flex flex-col items-center text-center justify-center bg-card/50">
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center mb-2">
            <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <p className="text-2xl font-bold">{stats.points}</p>
          <p className="text-xs text-muted-foreground uppercase font-semibold">Puntos Totales</p>
        </Card>
        
        <Card className="p-4 shadow-sm flex flex-col items-center text-center justify-center bg-card/50">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-2">
            <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold">{stats.totalKm} <span className="text-sm">km</span></p>
          <p className="text-xs text-muted-foreground uppercase font-semibold">Distancia Total</p>
        </Card>
      </div>

      {/* Badges Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Medal className="w-5 h-5 text-primary" /> Insignias
          </h3>
        </div>
        <Card className="p-4 shadow-sm bg-card/50">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {stats.badges.map((badge) => (
              <div 
                key={badge.code} 
                className={`flex flex-col items-center text-center space-y-2 p-2 rounded-xl transition-all ${
                  badge.earned ? "opacity-100" : "opacity-40 grayscale"
                }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-inner ${
                  badge.earned ? "bg-gradient-to-br from-yellow-200 to-yellow-400 dark:from-yellow-600 dark:to-yellow-800" : "bg-muted"
                }`}>
                  <Zap className={`w-7 h-7 ${badge.earned ? "text-yellow-700 dark:text-yellow-200" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">{badge.name}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="pt-4">
        <Link href="/registrar">
          <Button size="lg" className="w-full rounded-2xl h-14 text-lg font-bold shadow-lg shadow-primary/25">
            <Zap className="mr-2 w-5 h-5" /> Registrar Sesión
          </Button>
        </Link>
      </div>
    </div>
  );
}
