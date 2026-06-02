import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { JobChat } from "@/components/JobChat";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/my-requests")({
  component: MyRequests,
});

interface CustomerJob {
  id: string;
  worker_id: string;
  job_description: string;
  status: string;
  created_at: string;
}

interface WorkerInfo {
  user_id: string;
  full_name: string | null;
  service_category: string;
}

function MyRequests() {
  const { user } = useAuth();
  const [chat, setChat] = useState<{ jobId: string; workerId: string; name: string } | null>(null);

  const { data: jobs, refetch } = useQuery({
    enabled: !!user,
    queryKey: ["customer-jobs", user?.id],
    queryFn: async (): Promise<CustomerJob[]> => {
      const { data, error } = await supabase
        .from("job_requests")
        .select("id, worker_id, job_description, status, created_at")
        .eq("actor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const workerIds = Array.from(new Set((jobs ?? []).map((j) => j.worker_id)));
  const { data: workers } = useQuery({
    enabled: workerIds.length > 0,
    queryKey: ["customer-jobs-workers", workerIds.join(",")],
    queryFn: async (): Promise<Record<string, WorkerInfo>> => {
      const [{ data: wp }, { data: profs }] = await Promise.all([
        supabase
          .from("worker_profiles")
          .select("user_id, service_category")
          .in("user_id", workerIds),
        supabase.from("profiles").select("id, full_name").in("id", workerIds),
      ]);
      const map: Record<string, WorkerInfo> = {};
      (wp ?? []).forEach((w) => {
        map[w.user_id] = {
          user_id: w.user_id,
          full_name: null,
          service_category: w.service_category,
        };
      });
      (profs ?? []).forEach((p) => {
        if (map[p.id]) map[p.id].full_name = p.full_name;
        else map[p.id] = { user_id: p.id, full_name: p.full_name, service_category: "" };
      });
      return map;
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("customer-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_requests", filter: `actor_id=eq.${user.id}` },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, refetch]);

  const statusStyle = (s: string) =>
    s === "completed"
      ? "bg-success/15 text-success"
      : s === "accepted"
      ? "bg-primary/10 text-primary"
      : "bg-warning/15 text-warning";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Briefcase className="h-7 w-7" /> My Requests
      </h1>
      <p className="text-muted-foreground mt-2">
        Track the jobs you've requested and chat with the worker.
      </p>

      <div className="mt-6">
        {!jobs?.length ? (
          <div className="text-center py-16 rounded-2xl bg-card border border-dashed border-border text-muted-foreground">
            You haven't requested any jobs yet.{" "}
            <Link to="/services" className="text-primary">Find a worker</Link>.
          </div>
        ) : (
          <ul className="space-y-3">
            {jobs.map((j) => {
              const w = workers?.[j.worker_id];
              const name = w?.full_name || "Worker";
              return (
                <li key={j.id} className="rounded-2xl bg-card border border-border p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-semibold">{name}</div>
                      {w?.service_category && (
                        <div className="text-xs text-muted-foreground capitalize">
                          {w.service_category}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusStyle(j.status)}`}>
                      {j.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap text-foreground/90">
                    {j.job_description}
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}
                  </div>
                  {j.status !== "completed" && (
                    <button
                      onClick={() =>
                        setChat({ jobId: j.id, workerId: j.worker_id, name })
                      }
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90"
                    >
                      <MessageSquare className="h-4 w-4" /> Message
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {chat && (
        <JobChat
          open={!!chat}
          onOpenChange={(o: boolean) => !o && setChat(null)}
          jobId={chat.jobId}
          otherUserId={chat.workerId}
          title={`Chat with ${chat.name}`}
        />
      )}
    </div>
  );
}
