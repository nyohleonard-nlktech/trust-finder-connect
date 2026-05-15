import { Link } from "@tanstack/react-router";
import { ShieldCheck, MapPin } from "lucide-react";
import type { WorkerRow } from "@/lib/workers";

export function WorkerCard({ w }: { w: WorkerRow }) {
  return (
    <Link
      to="/worker/$id"
      params={{ id: w.user_id }}
      className="group rounded-2xl bg-card border border-border p-5 hover:border-primary hover:shadow-[var(--shadow-card)] transition-all flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
            {(w.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{w.profiles?.full_name ?? "Worker"}</div>
            <div className="text-xs text-muted-foreground truncate">{w.service_category}</div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full shrink-0 ${
          w.is_available ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${w.is_available ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
          {w.is_available ? "Live" : "Away"}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" /> {w.neighborhood}
      </div>

      {w.bio && <p className="text-sm text-muted-foreground line-clamp-2">{w.bio}</p>}

      <div className="mt-auto pt-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success text-success-foreground px-3 py-1 text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" /> Verified
        </span>
      </div>
    </Link>
  );
}
