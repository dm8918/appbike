import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Trophy, PlusCircle, Home, History, Shield, LogOut, Bike } from "lucide-react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/registrar", label: "Registrar", icon: PlusCircle },
    { href: "/historial", label: "Historial", icon: History },
    { href: "/ranking", label: "Ranking", icon: Trophy },
  ];

  if (user?.isAdmin) {
    navItems.push({ href: "/admin", label: "Admin", icon: Shield });
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
              <Bike className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">BiciOffice</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
              Hola, {user?.name.split(" ")[0]}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => logout()}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 sm:pb-0">
        <div className="max-w-screen-md mx-auto p-4 sm:p-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? "fill-primary/20" : ""}`} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar (optional, if we want full layout. we'll stick to a simpler centered wrapper with top nav for desktop as per requirements) */}
    </div>
  );
}
