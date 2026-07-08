import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Camera, Loader2, PartyPopper, UploadCloud } from "lucide-react";
import { Link, useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useCreateRide } from "@/hooks/use-rides";
import { cn } from "@/lib/utils";

const rideSchema = z.object({
  date: z.date({
    required_error: "La fecha es requerida",
  }),
  km: z.coerce.number().min(0.1, "Debes registrar al menos 0.1 km"),
});

export default function Registrar() {
  const [, setLocation] = useLocation();
  const createRide = useCreateRide();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof rideSchema>>({
    resolver: zodResolver(rideSchema),
    defaultValues: {
      date: new Date(),
      km: "" as any,
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  async function onSubmit(data: z.infer<typeof rideSchema>) {
    try {
      await createRide.mutateAsync({
        date: format(data.date, "yyyy-MM-dd"),
        km: data.km,
        photo,
      });
      
      setSuccess(true);

      // Redirect after showing success state for a moment
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    } catch (error) {
      // Error handled by global query client / toast
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg shadow-green-500/20">
          <PartyPopper className="w-12 h-12 text-green-600 dark:text-green-400 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">¡Excelente trabajo!</h2>
          <p className="text-muted-foreground text-lg">Sesión registrada con éxito.</p>
        </div>
        <p className="text-sm font-medium animate-pulse text-primary mt-8">Volviendo al inicio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nueva Sesión</h2>
        <p className="text-muted-foreground">Registra los kilómetros de hoy.</p>
      </div>

      <Card className="p-6 bg-card/50 shadow-lg border-border/50">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Kilómetros recorridos</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        className="h-16 text-3xl font-bold text-center pr-12 bg-background/50 shadow-inner"
                        {...field}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                        km
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-12 pl-3 text-left font-normal bg-background/50",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecciona una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Foto de evidencia (Opcional)</FormLabel>
              <div 
                className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-2xl p-6 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md">
                    <img src={photoPreview} alt="Preview" className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white font-medium flex items-center gap-2">
                        <Camera className="w-5 h-5" /> Cambiar foto
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-medium text-primary">Tomar foto o subir</div>
                    <p className="text-xs text-muted-foreground">Captura la pantalla de la bici</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </FormItem>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
              disabled={createRide.isPending}
            >
              {createRide.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "Guardar Sesión"
              )}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
