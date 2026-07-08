import { useMyRides, useDeleteRide } from "@/hooks/use-rides";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { photoUrl } from "@/lib/api";
import { Trash2, Calendar, MapPin, Bike, Loader2, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function Historial() {
  const { data: rides, isLoading } = useMyRides();
  const deleteRide = useDeleteRide();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Mi Historial</h2>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!rides || rides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Bike className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Aún no hay rutas</h2>
        <p className="text-muted-foreground max-w-[250px]">
          Tus sesiones aparecerán aquí. ¡Es hora de pedalear!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Mi Historial</h2>
      
      <div className="space-y-4">
        {rides.map((ride, index) => (
          <Card 
            key={ride.id} 
            className="overflow-hidden bg-card/50 shadow-sm border-border/50 animate-in slide-in-from-bottom-4 fade-in"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
          >
            <div className="flex">
              {/* Photo Area */}
              <div className="w-1/3 min-w-[100px] bg-muted relative">
                {ride.photoFilename ? (
                  <img 
                    src={photoUrl(ride.photoFilename)} 
                    alt="Evidencia" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
              
              {/* Info Area */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center text-xs text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {format(new Date(ride.date), "d MMM, yyyy", { locale: es })}
                    </div>
                    <div className="text-2xl font-extrabold text-primary flex items-baseline gap-1">
                      {ride.km.toFixed(1)} <span className="text-sm font-medium text-foreground">km</span>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 -mr-2 -mt-2">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar sesión?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se restarán estos kilómetros de tus estadísticas y ranking.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteRide.mutate(ride.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
