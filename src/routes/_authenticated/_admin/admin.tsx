import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ShieldAlert, Eye, Phone, MessageSquare, Activity, Inbox, ClipboardList, Users, LifeBuoy, Send, ArrowLeft, Trash2, Megaphone } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useServerFn as _useServerFnDup } from "@tanstack/react-start";
import { sendBroadcast } from "@/lib/admin-broadcasts.functions";
import { formatDistanceToNow as _fdtnDup } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/admin-users.functions";

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

      <UsersDirectory />
      <SupportTickets />
      <Announcements />
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

interface JobRequestRow {
  id: string;
  worker_id: string;
  customer_name: string;
  customer_phone: string;
  job_description: string;
  status: string;
  created_at: string;
  worker_name: string | null;
}

function LiveJobFeed() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-job-requests"],
    queryFn: async (): Promise<JobRequestRow[]> => {
      const { data: rows, error } = await supabase
        .from("job_requests")
        .select("id, worker_id, customer_name, customer_phone, job_description, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const ids = Array.from(new Set((rows ?? []).map((r) => r.worker_id)));
      let names: Record<string, string | null> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name]));
      }
      return (rows ?? []).map((r) => ({ ...r, worker_name: names[r.worker_id] ?? null }));
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_requests" },
        () => qc.invalidateQueries({ queryKey: ["admin-job-requests"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Live job feed / Leads</h2>
      </div>
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
        ) : !data?.length ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No job requests yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="font-semibold">{r.customer_name} <span className="text-muted-foreground font-normal">→ {r.worker_name ?? "Worker"}</span></div>
                  <span className="text-xs px-2 py-1 rounded-full bg-warning/15 text-warning capitalize">{r.status}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {r.customer_phone} · {new Date(r.created_at).toLocaleString()}
                </div>
                <p className="mt-2 text-foreground/90 whitespace-pre-wrap">{r.job_description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface FeedbackRow {
  id: string;
  name: string;
  contact: string;
  feedback_type: string;
  message: string;
  created_at: string;
}

function FeedbackInbox() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async (): Promise<FeedbackRow[]> => {
      const { data: rows, error } = await supabase
        .from("admin_feedback")
        .select("id, name, contact, feedback_type, message, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return rows ?? [];
    },
  });

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <Inbox className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Inbox / Feedback</h2>
      </div>
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
        ) : !data?.length ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No feedback yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="font-semibold">{r.name}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{r.feedback_type}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {r.contact} · {new Date(r.created_at).toLocaleString()}
                </div>
                <p className="mt-2 text-foreground/90 whitespace-pre-wrap">{r.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


interface UserDirRow {
  id: string;
  full_name: string | null;
  phone: string;
  neighborhood: string | null;
  role: string;
  profession: string | null;
}

function UsersDirectory() {
  const qc = useQueryClient();
  const { isAdmin, user } = useAuth();
  const deleteFn = useServerFn(deleteUserAccount);
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [professionFilter, setProfessionFilter] = useState<string>("all");
  const [toDelete, setToDelete] = useState<UserDirRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users-directory"],
    queryFn: async (): Promise<UserDirRow[]> => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, phone, neighborhood")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;
      const ids = (profiles ?? []).map((p) => p.id);
      const [{ data: roles }, { data: workers }] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").in("user_id", ids),
        supabase.from("worker_profiles").select("user_id, service_category").in("user_id", ids),
      ]);
      const rolesByUser: Record<string, string[]> = {};
      (roles ?? []).forEach((r) => {
        rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] ?? []), r.role as string];
      });
      const profByUser = Object.fromEntries((workers ?? []).map((w) => [w.user_id, w.service_category]));
      return (profiles ?? []).map((p) => {
        const userRoles = rolesByUser[p.id] ?? [];
        const role = userRoles.includes("admin")
          ? "admin"
          : userRoles.includes("worker")
            ? "worker"
            : userRoles[0] ?? "customer";
        return {
          id: p.id,
          full_name: p.full_name,
          phone: p.phone,
          neighborhood: p.neighborhood,
          role,
          profession: profByUser[p.id] ?? null,
        };
      });
    },
  });

  const locations = Array.from(
    new Set((data ?? []).map((u) => u.neighborhood).filter((x): x is string => !!x)),
  ).sort();
  const professions = Array.from(
    new Set((data ?? []).map((u) => u.profession).filter((x): x is string => !!x)),
  ).sort();

  const filtered = (data ?? []).filter(
    (u) =>
      (locationFilter === "all" || u.neighborhood === locationFilter) &&
      (professionFilter === "all" || u.profession === professionFilter),
  );

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteFn({ data: { userId: toDelete.id } });
      toast.success("User deleted");
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ["admin-users-directory"] });
      qc.invalidateQueries({ queryKey: ["admin-workers"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">All users</h2>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={professionFilter} onValueChange={setProfessionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by profession" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All professions</SelectItem>
            {professions.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-muted-foreground self-center">
          {filtered.length} {filtered.length === 1 ? "user" : "users"}
        </div>
      </div>
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
        ) : !filtered.length ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No users match these filters.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Profession</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                      u.role === "admin"
                        ? "bg-primary/10 text-primary"
                        : u.role === "worker"
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                    }`}>{u.role}</span>
                  </TableCell>
                  <TableCell>{u.neighborhood ?? "—"}</TableCell>
                  <TableCell>{u.profession ?? "—"}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={u.id === user?.id}
                        onClick={() => setToDelete(u)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{toDelete?.full_name ?? toDelete?.phone}</strong>, including their job
              requests, support messages, profile, and login. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface SupportMsg {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

interface SupportThread {
  userId: string;
  name: string | null;
  phone: string | null;
  lastBody: string;
  lastAt: string;
  unread: number;
}

function SupportTickets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeUser, setActiveUser] = useState<{ id: string; name: string | null } | null>(null);

  const { data: threads, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["admin-support-threads", user?.id],
    queryFn: async (): Promise<SupportThread[]> => {
      const { data: msgs, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const adminId = user!.id;
      const byUser = new Map<string, SupportMsg[]>();
      (msgs ?? []).forEach((m) => {
        const other = m.sender_id === adminId ? m.receiver_id : m.sender_id;
        if (!byUser.has(other)) byUser.set(other, []);
        byUser.get(other)!.push(m as SupportMsg);
      });
      const ids = Array.from(byUser.keys());
      let profs: Record<string, { full_name: string | null; phone: string }> = {};
      if (ids.length) {
        const { data: p } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", ids);
        profs = Object.fromEntries((p ?? []).map((r) => [r.id, { full_name: r.full_name, phone: r.phone }]));
      }
      return ids.map((uid) => {
        const list = byUser.get(uid)!;
        const last = list[0];
        const unread = list.filter((m) => m.receiver_id === adminId && !m.read_at).length;
        return {
          userId: uid,
          name: profs[uid]?.full_name ?? null,
          phone: profs[uid]?.phone ?? null,
          lastBody: last.body,
          lastAt: last.created_at,
          unread,
        };
      });
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-support")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages" },
        () => qc.invalidateQueries({ queryKey: ["admin-support-threads"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <LifeBuoy className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Support tickets</h2>
      </div>
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {activeUser ? (
          <SupportConversation
            otherUserId={activeUser.id}
            otherName={activeUser.name}
            onBack={() => setActiveUser(null)}
          />
        ) : isLoading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
        ) : !threads?.length ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No support tickets yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {threads.map((t) => (
              <li key={t.userId}>
                <button
                  onClick={() => setActiveUser({ id: t.userId, name: t.name })}
                  className="w-full text-left px-4 py-3 hover:bg-accent/40 transition-colors flex items-start gap-3"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
                    {(t.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold truncate">{t.name ?? "User"}</div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {new Date(t.lastAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{t.lastBody}</div>
                  </div>
                  {t.unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full self-center">
                      {t.unread}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SupportConversation({
  otherUserId,
  otherName,
  onBack,
}: {
  otherUserId: string;
  otherName: string | null;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    enabled: !!user,
    queryKey: ["admin-support-chat", user?.id, otherUserId],
    queryFn: async (): Promise<SupportMsg[]> => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user!.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user!.id})`,
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupportMsg[];
    },
  });

  useEffect(() => {
    if (!user || !messages?.length) return;
    const unreadIds = messages
      .filter((m) => m.receiver_id === user.id && !m.read_at)
      .map((m) => m.id);
    if (unreadIds.length) {
      supabase
        .from("support_messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds)
        .then(() => qc.invalidateQueries({ queryKey: ["admin-support-threads"] }));
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, user, qc]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`admin-chat-${otherUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages" },
        () => qc.invalidateQueries({ queryKey: ["admin-support-chat", user.id, otherUserId] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, otherUserId, qc]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const { error } = await supabase.from("support_messages").insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      body: text.trim(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
    qc.invalidateQueries({ queryKey: ["admin-support-chat", user.id, otherUserId] });
    qc.invalidateQueries({ queryKey: ["admin-support-threads"] });
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">{otherName ?? "User"}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!messages?.length ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No messages in this conversation yet.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                  <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your reply…"
          className="flex-1"
        />
        <Button type="submit" disabled={!text.trim()} className="gap-1.5">
          <Send className="h-4 w-4" /> Send
        </Button>
      </form>
    </div>
  );
}

