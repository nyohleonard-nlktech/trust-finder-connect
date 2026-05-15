import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_admin")({
  component: AdminGate,
});

function AdminGate() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [isAdmin, loading, navigate]);

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return null;
  return <Outlet />;
}
