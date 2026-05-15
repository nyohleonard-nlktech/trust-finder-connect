import { Link, useRouterState } from "@tanstack/react-router";
import { ShieldCheck, LogOut, LayoutDashboard, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import logo from "/icons/trustfix-192.png?url";

export function Header() {
  const { user, isWorker, isAdmin, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        path === to
          ? "text-primary"
          : "text-foreground/70 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} width={36} height={36} alt="TrustFix" className="rounded-lg" />
          <span className="font-display font-bold text-xl">
            Trust<span className="text-primary">Fix</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLink("/", "Home")}
          {navLink("/services", "Find a Worker")}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isWorker && (
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
              )}
              <Button onClick={() => signOut()} variant="ghost" size="sm" className="gap-1.5">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Join
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
