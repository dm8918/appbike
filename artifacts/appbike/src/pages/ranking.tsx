import { useState } from "react";
import { useLeaderboard } from "@/hooks/use-gamification";
import { LeaderboardPeriod } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Ranking() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const { data: leaderboard, isLoading } = useLeaderboard(period);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-inner">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Ranking</h2>
        
        <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
            <TabsTrigger value="all">Siempre</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : leaderboard?.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Aún no hay registros en este periodo.
        </div>
      ) : (
        <div className="space-y-3 relative">
          {/* Top 3 Decorator background */}
          <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl -z-10 -mx-2" />
          
          {leaderboard?.map((entry) => {
            const isTop3 = entry.rank <= 3;
            
            return (
              <Card 
                key={entry.userId} 
                className={`p-4 flex items-center gap-4 border-none shadow-sm transition-all ${
                  entry.isMe 
                    ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" 
                    : isTop3 
                      ? "bg-card/90" 
                      : "bg-card/50"
                }`}
              >
                <div className="flex-shrink-0 w-8 text-center font-black text-xl opacity-80 flex justify-center">
                  {entry.rank === 1 ? <Crown className="w-6 h-6 text-yellow-500" /> :
                   entry.rank === 2 ? <Medal className="w-6 h-6 text-slate-400" /> :
                   entry.rank === 3 ? <Medal className="w-6 h-6 text-amber-700" /> :
                   entry.rank}
                </div>
                
                <Avatar className={`h-12 w-12 border-2 ${entry.isMe ? 'border-primary-foreground/30' : 'border-background shadow-sm'}`}>
                  <AvatarFallback className={entry.isMe ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary font-bold'}>
                    {entry.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate text-lg leading-tight">
                    {entry.name}
                    {entry.isMe && <span className="ml-2 text-xs font-normal opacity-80">(Tú)</span>}
                  </p>
                  <div className={`text-xs flex items-center gap-1 mt-1 ${entry.isMe ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    <Star className="w-3 h-3" /> {entry.points} pts
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-xl leading-none">{entry.totalKm.toFixed(1)}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${entry.isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>km</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
