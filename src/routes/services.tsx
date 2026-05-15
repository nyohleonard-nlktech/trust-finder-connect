import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { ShieldCheck, MapPin, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NEIGHBORHOODS_BY_CITY, SERVICE_CATEGORIES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const searchSchema = z.object({
  category: z.string().optional(),
  neighborhood: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/services")({
  validateSearch: searchSchema,
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Find a verified worker — TrustFix" },
      { name: "description", content: "Browse verified plumbers, electricians, mechanics and more across Cameroon." },
    ],
  }),
});

interface WorkerRow {
  user_id: string;
  service_category: string;
  neighborhood: string;
  bio: string | null;
  is_available: boolean;
  profiles: { full_name: string | null; phone: string } | null;
}

function ServicesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["workers", search],
    queryFn: async () => {
      let query = supabase
        .from("worker_profiles")
        .select("user_id, service_category, neighborhood, bio, is_available, profiles!inner(full_name, phone)")
        .eq("is_verified", true)
        .order("is_available", { ascending: false });

      if (search.category) query = query.eq("service_category", search.category);
      if (search.neighborhood) query = query.eq("neighborhood", search.neighborhood);

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as unknown as WorkerRow[];
      if (search.q) {
        const needle = search.q.toLowerCase();
        return rows.filter((w) =>
          (w.profiles?.full_name ?? "").toLowerCase().includes(needle) ||
          w.service_category.toLowerCase().includes(needle)
        );
      }
      return rows;
    },
  });

  const updateSearch = (patch: Partial<typeof search>) => {
    navigate({ search: { ...search, ...patch } as typeof search, replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">Find a worker</h1>
        <p className="text-muted-foreground mt-1">All workers are ID-verified.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-8 sticky top-16 z-30 bg-background/80 backdrop-blur py-3 -mx-4 px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workers…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateSearch({ q })}
            className="pl-9 h-11"
          />
        </div>
        <Select
          value={search.category ?? "all"}
          onValueChange={(v) => updateSearch({ category: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="h-11"><SelectValue placeholder="All services" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select
          value={search.neighborhood ?? "all"}
          onValueChange={(v) => updateSearch({ neighborhood: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="h-11"><SelectValue placeholder="All neighborhoods" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All neighborhoods</SelectItem>
            {Object.entries(NEIGHBORHOODS_BY_CITY).map(([city, hoods]) => (
              <SelectGroup key={city}>
                <SelectLabel>{city}</SelectLabel>
                {hoods.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading workers…</div>
      ) : !data?.length ? (
        <div className="text-center py-20 rounded-2xl bg-card border border-dashed border-border">
          <p className="text-muted-foreground">No verified workers match your filters yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((w) => (
            <Link
              key={w.user_id}
              to="/worker/$id"
              params={{ id: w.user_id }}
              className="group rounded-2xl bg-card border border-border p-5 hover:border-primary hover:shadow-[var(--shadow-card)] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {(w.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-1">
                      {w.profiles?.full_name ?? "Worker"}
                      <ShieldCheck className="h-4 w-4 text-success" />
                    </div>
                    <div className="text-xs text-muted-foreground">{w.service_category}</div>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  w.is_available
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${w.is_available ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                  {w.is_available ? "Live" : "Away"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                <MapPin className="h-3 w-3" /> {w.neighborhood}
              </div>
              {w.bio && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{w.bio}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
