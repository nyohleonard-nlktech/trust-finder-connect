import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Search } from "lucide-react";
import { NEIGHBORHOODS_BY_CITY, SERVICE_CATEGORIES } from "@/lib/constants";
import { fetchVerifiedWorkers } from "@/lib/workers";
import { WorkerCard } from "@/components/WorkerCard";
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

function ServicesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["workers", "services", search],
    queryFn: () => fetchVerifiedWorkers(search),
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
            onKeyDown={(e) => e.key === "Enter" && updateSearch({ q: q || undefined })}
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
          <SelectTrigger className="h-11"><SelectValue placeholder="All locations" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {Object.entries(NEIGHBORHOODS_BY_CITY).map(([city, hoods]) => (
              <SelectGroup key={city}>
                <SelectLabel>{city}</SelectLabel>
                <SelectItem value={`city:${city}`}>All {city}</SelectItem>
                {hoods.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading workers…</div>
      ) : !data?.length ? (
        <div className="text-center py-20 px-6 rounded-2xl bg-card border border-dashed border-border">
          <p className="text-muted-foreground">
            No workers found in this specific neighborhood yet. Try searching in a nearby area!
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((w) => <WorkerCard key={w.user_id} w={w} />)}
        </div>
      )}
    </div>
  );
}
