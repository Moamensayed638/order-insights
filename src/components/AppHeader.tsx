import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { LogOut, Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearToken, getStoredRefreshToken, logout } from "@/lib/auth";
import { toast } from "sonner";

type Props = {
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function AppHeader({ onRefresh, isRefreshing }: Props) {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    let logoutError: unknown = null;
    try {
      const refreshToken = getStoredRefreshToken();
      if (refreshToken) await logout(refreshToken);
    } catch (error) {
      logoutError = error;
    } finally {
      clearToken();
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
    if (logoutError) {
      toast.error(logoutError instanceof Error ? logoutError.message : "Failed to log out");
    }
  }

  const linkBase =
    "px-2.5 sm:px-3 h-8 inline-flex items-center rounded-md text-xs font-mono uppercase tracking-wide transition-colors whitespace-nowrap";
  const linkInactive = "text-muted-foreground hover:text-foreground hover:bg-muted";
  const linkActive = "bg-primary text-primary-foreground";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur-xl">
      <div className="container flex flex-nowrap items-center justify-between gap-2 sm:gap-4 py-3 sm:py-4">
        <div className="flex flex-nowrap items-center gap-3 sm:gap-6 min-w-0">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 rounded-md bg-gradient-primary flex items-center justify-center shadow-glow">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-lg font-semibold tracking-tight text-foreground leading-none">
                Biscofa
              </span>
              <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground leading-none mt-0.5">
                Admin Console
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1" aria-label="Primary">
            <NavLink
              to="/adminorders"
              className={({ isActive }) =>
                cn(linkBase, isActive ? linkActive : linkInactive)
              }
            >
              Orders
            </NavLink>
            <NavLink
              to="/adminproducts"
              className={({ isActive }) =>
                cn(linkBase, isActive ? linkActive : linkInactive)
              }
            >
              Products
            </NavLink>
          </nav>
        </div>

        <div className="flex flex-nowrap items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-primary">
              Live
            </span>
          </div>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="border-border/60 bg-muted/40 text-foreground hover:bg-muted hover:border-primary/40 h-8 px-2 sm:px-3 gap-1.5 text-xs font-mono"
              title="Refresh"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin-slow")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
