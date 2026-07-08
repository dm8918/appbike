import { useAdminUsers, useAdminRides } from "@/hooks/use-admin";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, Bike, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { photoUrl } from "@/lib/api";

export default function Admin() {
  const { data: users, isLoading } = useAdminUsers();
  const [search, setSearch] = useState("");

  const filteredUsers = users?.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Administración</h2>
          <p className="text-sm text-muted-foreground">Gestión de usuarios y validación de evidencias.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          placeholder="Buscar por nombre o email..." 
          className="pl-9 h-12 bg-card/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {filteredUsers?.map((user) => (
            <AccordionItem key={user.userId} value={user.userId.toString()} className="border bg-card/50 rounded-xl px-4 data-[state=open]:bg-card data-[state=open]:shadow-md transition-all">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-4 text-left w-full pr-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {user.name.substring(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{user.totalKm.toFixed(1)} km</p>
                    <p className="text-xs text-muted-foreground">{user.rides} sesiones</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-4">
                <UserRidesList userId={user.userId} />
              </AccordionContent>
            </AccordionItem>
          ))}
          
          {filteredUsers?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No se encontraron usuarios.
            </div>
          )}
        </Accordion>
      )}
    </div>
  );
}

function UserRidesList({ userId }: { userId: number }) {
  const { data: rides, isLoading } = useAdminRides(userId);

  if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground">Cargando sesiones...</div>;
  if (!rides || rides.length === 0) return <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">No hay sesiones registradas.</div>;

  return (
    <div className="space-y-2 mt-4">
      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">Últimas sesiones</h4>
      {rides.map(ride => (
        <div key={ride.id} className="flex gap-3 bg-muted/40 rounded-lg p-3 items-center">
          <div className="w-16 h-16 bg-muted-foreground/10 rounded-md overflow-hidden flex-shrink-0 relative">
            {ride.photoFilename ? (
              <img src={photoUrl(ride.photoFilename)} alt="Evidencia" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Bike className="w-6 h-6 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg leading-none mb-1">{ride.km} km</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(ride.date), "dd MMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
