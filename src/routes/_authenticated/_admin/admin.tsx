import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldAlert, Eye, Phone, MessageSquare, Activity, Inbox, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_admin/admin")({
  component: AdminPanel,
});

interface WorkerRow {
  user_id: string;
  service_category: string;
  neighborhood: string;
  bio: string | null;
  cni_number: string | null;
  is_verified: boolean;
  id_card_path: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string } | null;
}

function AdminPanel() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [filter, setFilter] = useState<"pending" | "verified" | "all">("pending");
  const [selected, setSelected] = useState<WorkerRow | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-workers", filter],
    queryFn: async () => {
      let q = supabase
        .from("worker_profiles")
        .select("user_id, service_category, neighborhood, bio, cni_number, is_verified, id_card_path, created_at")
        .order("created_at", { ascending: false });
      if (filter === "pending") q = q.eq("is_verified", false);
      if (filter === "verified") q = q.eq("is_verified", true);
      const { data: workers, error } = await q;
      if (error) throw error;
      const ids = (workers ?? []).map((w) => w.user_id);
      let profilesById: Record<string, { full_name: string | null; phone: string }> = {};
      if (ids.length) {
        const { data: profs, error: pErr } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", ids);
        if (pErr) throw pErr;
        profilesById = Object.fromEntries((profs ?? []).map((p) => [p.id, { full_name: p.full_name, phone: p.phone }]));
      }
      return (workers ?? []).map((w) => ({ ...w, profiles: profilesById[w.user_id] ?? null })) as WorkerRow[];
    },
  });

  const openWorker = async (w: WorkerRow) => {
    setSelected(w);
    setSignedUrl(null);
    if (w.id_card_path) {
      const { data } = await supabase.storage
        .from("verification-docs")
        .createSignedUrl(w.id_card_path, 60 * 5);
      setSignedUrl(data?.signedUrl ?? null);
    }
  };

  const verify = async () => {
    if (!selected || !user) return;
    const { error } = await supabase
      .from("worker_profiles")
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq("user_id", selected.user_id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Worker verified!");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["admin-workers"] });
    }
  };

  const reject = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("worker_profiles")
      .update({ is_verified: false, verified_at: null, verified_by: null })
      .eq("user_id", selected.user_id);
    if (error) toast.error(error.message);
    else {
      toast.success("Verification removed.");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["admin-workers"] });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold">Admin · Worker verification</h1>
      <p className="text-muted-foreground mt-1">Review National ID submissions and approve workers.</p>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="mt-4">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">Loading…</div>
          ) : !data?.length ? (
            <div className="text-center py-16 rounded-2xl bg-card border border-dashed border-border text-muted-foreground">
              No workers in this view.
            </div>
          ) : (
            <ul className="space-y-3">
              {data.map((w) => (
                <li key={w.user_id} className="rounded-2xl bg-card border border-border p-4 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {(w.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                      {w.profiles?.full_name ?? "Worker"}
                      {w.is_verified ? (
                        <ShieldCheck className="h-4 w-4 text-success" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {w.service_category} · {w.neighborhood} · {w.profiles?.phone}
                    </div>
                  </div>
                  <Button onClick={() => openWorker(w)} variant="outline" size="sm" className="gap-1.5">
                    <Eye className="h-4 w-4" /> Review
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.profiles?.full_name ?? "Worker"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Phone:</span> {selected.profiles?.phone}</div>
              <div><span className="text-muted-foreground">Service:</span> {selected.service_category}</div>
              <div><span className="text-muted-foreground">Neighborhood:</span> {selected.neighborhood}</div>
              <div><span className="text-muted-foreground">CNI number:</span> {selected.cni_number ?? <span className="text-destructive">Missing</span>}</div>
              {selected.bio && <div><span className="text-muted-foreground">Bio:</span> {selected.bio}</div>}
              <div>
                <div className="text-muted-foreground mb-2">National ID card</div>
                {signedUrl ? (
                  <img src={signedUrl} alt="ID card" className="w-full rounded-lg border border-border" />
                ) : selected.id_card_path ? (
                  <div className="text-muted-foreground">Loading image…</div>
                ) : (
                  <div className="text-destructive">No ID uploaded.</div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                {!selected.is_verified ? (
                  <Button onClick={verify} className="flex-1 gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Verify worker
                  </Button>
                ) : (
                  <Button onClick={reject} variant="destructive" className="flex-1">
                    Revoke verification
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BusinessActivity />
      <LiveJobFeed />
      <FeedbackInbox />
    </div>
  );
}

interface LeadRow {
  id: string;
  worker_id: string;
  interaction_type: "call" | "whatsapp";
  created_at: string;
  worker_name: string | null;
}

function BusinessActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async (): Promise<{ rows: LeadRow[]; calls: number; whatsapp: number; today: number }> => {
      const { data: events, error } = await supabase
        .from("lead_events")
        .select("id, worker_id, interaction_type, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const ids = Array.from(new Set((events ?? []).map((e) => e.worker_id)));
      let names: Record<string, string | null> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name]));
      }
      const rows = (events ?? []).map((e) => ({
        ...e,
        interaction_type: e.interaction_type as "call" | "whatsapp",
        worker_name: names[e.worker_id] ?? null,
      }));
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const today = rows.filter((r) => new Date(r.created_at) >= todayStart).length;
      const calls = rows.filter((r) => r.interaction_type === "call").length;
      const whatsapp = rows.filter((r) => r.interaction_type === "whatsapp").length;
      return { rows, calls, whatsapp, today };
    },
  });

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Business activity</h2>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Today" value={data?.today ?? 0} loading={isLoading} />
        <StatCard label="Calls" value={data?.calls ?? 0} loading={isLoading} icon={<Phone className="h-4 w-4" />} />
        <StatCard label="WhatsApp" value={data?.whatsapp ?? 0} loading={isLoading} icon={<MessageSquare className="h-4 w-4" />} />
      </div>
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-semibold">Recent leads</div>
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
        ) : !data?.rows.length ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No leads yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {data.rows.map((r) => (
              <li key={r.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  r.interaction_type === "call" ? "bg-primary/10 text-primary" : "bg-success/15 text-success"
                }`}>
                  {r.interaction_type === "call" ? <Phone className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                  {r.interaction_type === "call" ? "Call" : "WhatsApp"}
                </span>
                <span className="flex-1 truncate">{r.worker_name ?? "Worker"}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, loading, icon }: { label: string; value: number; loading: boolean; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</div>
      <div className="text-2xl font-bold mt-1">{loading ? "…" : value}</div>
    </div>
  );
}
