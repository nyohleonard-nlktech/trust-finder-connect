import { supabase } from "@/integrations/supabase/client";
import { NEIGHBORHOODS_BY_CITY } from "@/lib/constants";

export interface WorkerRow {
  user_id: string;
  service_category: string;
  neighborhood: string;
  bio: string | null;
  is_available: boolean;
  is_verified: boolean;
  profiles: { full_name: string | null; phone: string } | null;
}

export interface WorkerFilters {
  category?: string;
  neighborhood?: string; // can be a neighborhood, or "city:Bamenda"
  q?: string;
}

export async function fetchVerifiedWorkers(filters: WorkerFilters = {}): Promise<WorkerRow[]> {
  let query = supabase
    .from("worker_profiles")
    .select("user_id, service_category, neighborhood, bio, is_available, is_verified")
    .eq("is_verified", true)
    .order("is_available", { ascending: false });

  if (filters.category) query = query.eq("service_category", filters.category);

  if (filters.neighborhood) {
    if (filters.neighborhood.startsWith("city:")) {
      const city = filters.neighborhood.slice(5) as keyof typeof NEIGHBORHOODS_BY_CITY;
      const hoods = NEIGHBORHOODS_BY_CITY[city];
      if (hoods) query = query.in("neighborhood", hoods as unknown as string[]);
    } else {
      query = query.eq("neighborhood", filters.neighborhood);
    }
  }

  const { data: workers, error } = await query;
  if (error) throw error;
  if (!workers?.length) return [];

  const ids = workers.map((w) => w.user_id);
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .in("id", ids);

  const byId = new Map((profs ?? []).map((p) => [p.id, p]));
  let rows: WorkerRow[] = workers.map((w) => ({
    ...w,
    profiles: byId.get(w.user_id)
      ? { full_name: byId.get(w.user_id)!.full_name, phone: byId.get(w.user_id)!.phone }
      : null,
  }));

  if (filters.q) {
    const needle = filters.q.toLowerCase();
    rows = rows.filter((w) =>
      (w.profiles?.full_name ?? "").toLowerCase().includes(needle) ||
      w.service_category.toLowerCase().includes(needle)
    );
  }
  return rows;
}
