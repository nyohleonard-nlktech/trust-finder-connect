import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldAlert, Inbox, Power, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: worker } = useQuery({
    enabled: !!user,
    queryKey: ["my-worker", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("worker_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: messages, refetch } = useQuery({
    enabled: !!user,
    queryKey: ["my-messages", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("to_worker", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Realtime: refresh on new messages
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `to_worker=eq.${user.id}` },
        () => refetch(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refetch]);

  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (worker) setAvailable(worker.is_available);
  }, [worker]);

  const toggleAvailable = async (v: boolean) => {
    setAvailable(v);
    const { error } = await supabase
      .from("worker_profiles")
      .update({ is_available: v })
      .eq("user_id", user!.id);
    if (error) {
      toast.error(error.message);
      setAvailable(!v);
    } else {
      toast.success(v ? "You're now Live" : "Set to Away");
      qc.invalidateQueries({ queryKey: ["my-worker"] });
    }
  };

  if (!worker) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Complete your worker profile</h1>
        <p className="text-muted-foreground mt-2">
          Set up your worker info and upload your National ID to get verified.
        </p>
        <Link to="/onboarding" className="inline-block mt-5">
          <span className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
            Start onboarding
          </span>
        </Link>
      </div>
    );
  }

  const unread = messages?.filter((m) => !m.read_at).length ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Worker dashboard</h1>
          <div className="mt-2">
            {worker.is_verified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 text-success text-sm font-medium">
                <ShieldCheck className="h-4 w-4" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/20 text-warning-foreground text-sm font-medium">
                <ShieldAlert className="h-4 w-4" /> Pending Approval
              </span>
            )}
          </div>
        </div>
        <div className="rounded-2xl bg-card border border-border px-5 py-4 flex items-center gap-4">
          <Power className={`h-5 w-5 ${available ? "text-success" : "text-muted-foreground"}`} />
          <div>
            <div className="text-sm font-medium">{available ? "Live" : "Away"}</div>
            <div className="text-xs text-muted-foreground">Clients can {available ? "" : "not "}call you</div>
          </div>
          <Switch checked={available} onCheckedChange={toggleAvailable} disabled={!worker.is_verified} />
        </div>
      </div>

      {!worker.is_verified && (
        <div className="mt-6 p-4 rounded-xl bg-warning/10 border border-warning/30 text-sm">
          Your ID is being reviewed. You'll appear in search results once verified.
        </div>
      )}

      <Tabs defaultValue="jobs" className="mt-8">
        <TabsList>
          <TabsTrigger value="jobs" className="gap-2">
            <Briefcase className="h-4 w-4" /> My Jobs
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" /> Inbox {unread > 0 && <span className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full">{unread}</span>}
          </TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="jobs" className="mt-4">
          <MyJobs workerId={user!.id} />
        </TabsContent>
        <TabsContent value="inbox" className="mt-4">
          {!messages?.length ? (
            <div className="text-center py-16 rounded-2xl bg-card border border-dashed border-border text-muted-foreground">
              No messages yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li key={m.id} className={`rounded-2xl bg-card border border-border p-4 ${!m.read_at ? "ring-1 ring-primary/30" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{m.sender_name || "Anonymous client"}</div>
                    <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</div>
                  </div>
                  {m.sender_phone && (
                    <a href={`tel:+${m.sender_phone.replace(/\D/g, "")}`} className="text-sm text-primary">
                      {m.sender_phone}
                    </a>
                  )}
                  <p className="mt-2 text-foreground/90 whitespace-pre-wrap">{m.body}</p>
                  {!m.read_at && (
                    <button
                      onClick={async () => {
                        await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", m.id);
                        refetch();
                      }}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Mark as read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="profile" className="mt-4">
          <div className="rounded-2xl bg-card border border-border p-5 space-y-2 text-sm">
            <div><span className="text-muted-foreground">Service:</span> {worker.service_category}</div>
            <div><span className="text-muted-foreground">Neighborhood:</span> {worker.neighborhood}</div>
            {worker.bio && <div><span className="text-muted-foreground">Bio:</span> {worker.bio}</div>}
            <Link to="/onboarding" className="inline-block mt-2 text-primary text-sm">Edit profile / re-upload ID</Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface JobRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  job_description: string;
  status: string;
  created_at: string;
  actor_id: string | null;
}

function MyJobs({ workerId }: { workerId: string }) {
  const qc = useQueryClient();
  const [chatJob, setChatJob] = useState<JobRequest | null>(null);
  const { data: jobs, refetch } = useQuery({
    queryKey: ["my-jobs", workerId],
    queryFn: async (): Promise<JobRequest[]> => {
      const { data, error } = await supabase
        .from("job_requests")
        .select("id, customer_name, customer_phone, job_description, status, created_at, actor_id")
        .eq("worker_id", workerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("my-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_requests", filter: `worker_id=eq.${workerId}` },
        () => refetch(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [workerId, refetch]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("job_requests").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Job ${status}`);
      qc.invalidateQueries({ queryKey: ["my-jobs"] });
    }
  };

  if (!jobs?.length) {
    return (
      <div className="text-center py-16 rounded-2xl bg-card border border-dashed border-border text-muted-foreground">
        No incoming jobs yet.
      </div>
    );
  }

  const statusStyle = (s: string) =>
    s === "completed" ? "bg-success/15 text-success"
    : s === "accepted" ? "bg-primary/10 text-primary"
    : "bg-warning/15 text-warning";

  return (
    <ul className="space-y-3">
      {jobs.map((j) => (
        <li key={j.id} className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="font-semibold">{j.customer_name}</div>
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusStyle(j.status)}`}>{j.status}</span>
          </div>
          <a href={`tel:+${j.customer_phone.replace(/\D/g, "")}`} className="text-sm text-primary">
            {j.customer_phone}
          </a>
          <p className="mt-2 text-foreground/90 whitespace-pre-wrap text-sm">{j.job_description}</p>
          <div className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {j.status === "pending" && (
              <button
                onClick={() => updateStatus(j.id, "accepted")}
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
              >
                Accept Job
              </button>
            )}
            {j.status !== "completed" && (
              <button
                onClick={() => updateStatus(j.id, "completed")}
                className="px-3 py-1.5 rounded-md bg-success text-success-foreground text-sm font-medium hover:opacity-90"
              >
                Mark as Completed
              </button>
            )}
            {j.status !== "completed" && j.actor_id && (
              <button
                onClick={() => setChatJob(j)}
                className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90"
              >
                Message
              </button>
            )}
          </div>
        </li>
      ))}
      {chatJob && chatJob.actor_id && (
        <JobChat
          open={!!chatJob}
          onOpenChange={(o) => !o && setChatJob(null)}
          jobId={chatJob.id}
          otherUserId={chatJob.actor_id}
          title={`Chat with ${chatJob.customer_name}`}
        />
      )}
    </ul>
  );
}

