import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare, ShieldCheck, MapPin, ArrowLeft, Send, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { phoneForLink } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/worker/$id")({
  component: WorkerPage,
});

function WorkerPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["worker", id],
    queryFn: async () => {
      const { data: worker, error } = await supabase
        .from("worker_profiles")
        .select("user_id, service_category, neighborhood, bio, is_verified, is_available")
        .eq("user_id", id)
        .eq("is_verified", true)
        .maybeSingle();
      if (error) throw error;
      if (!worker) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", worker.user_id)
        .maybeSingle();
      return { ...worker, profiles: profile ?? null };
    },
  });

  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Worker not found or not verified yet.</p>
        <Link to="/services" className="mt-4 inline-block text-primary underline">Browse workers</Link>
      </div>
    );
  }

  const phoneDigits = phoneForLink(data.profiles?.phone ?? "");

  const trackLead = (type: "call" | "whatsapp") => {
    void supabase.from("lead_events").insert({
      worker_id: data.user_id,
      interaction_type: type,
      actor_id: user?.id ?? null,
    });
  };

  // --- Request Service modal state ---
  const [requestOpen, setRequestOpen] = useState(false);
  const [reqName, setReqName] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqPhone.trim() || !reqDesc.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmittingReq(true);
    const { error } = await supabase.from("job_requests").insert({
      worker_id: data.user_id,
      customer_name: reqName.trim().slice(0, 120),
      customer_phone: reqPhone.trim().slice(0, 40),
      job_description: reqDesc.trim().slice(0, 2000),
      actor_id: user?.id ?? null,
    });
    setSubmittingReq(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    trackLead("whatsapp");
    const waText =
      `Hello! I found you on TrustFix. My name is ${reqName.trim()}. ` +
      `I need help with: ${reqDesc.trim()}. ` +
      `Please reach out to me at ${reqPhone.trim()}.`;
    setRequestOpen(false);
    toast.success("Request saved. Opening WhatsApp…");
    window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(waText)}`, "_blank", "noopener,noreferrer");
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to send a message.");
      return;
    }
    if (!body.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      from_user: user.id,
      to_worker: data.user_id,
      sender_name: name || null,
      sender_phone: contact || null,
      body: body.trim(),
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Message sent!");
      setBody("");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/services" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to workers
      </Link>

      <div className="rounded-3xl bg-card border border-border p-6 md:p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-semibold">
            {(data.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold">{data.profiles?.full_name ?? "Worker"}</h1>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-success/15 text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            </div>
            <div className="text-muted-foreground mt-1">{data.service_category}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
              <MapPin className="h-3.5 w-3.5" /> {data.neighborhood}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full self-start ${
            data.is_available ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${data.is_available ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
            {data.is_available ? "Live now" : "Away"}
          </span>
        </div>

        {data.bio && <p className="mt-5 text-foreground/90">{data.bio}</p>}

        <div className="mt-6">
          <Button
            onClick={() => setRequestOpen(true)}
            disabled={!data.is_available}
            size="lg"
            className="h-14 w-full gap-2 text-base"
          >
            <Wrench className="h-5 w-5" />
            {data.is_available ? "Request Service" : "Worker currently away"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            We'll save your request and connect you to the worker on WhatsApp.
          </p>
        </div>
      </div>

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request service from {data.profiles?.full_name ?? "this worker"}</DialogTitle>
            <DialogDescription>
              Tell us what you need. After you send, we'll open WhatsApp with your request
              already typed in.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRequest} className="space-y-3">
            <div>
              <Label htmlFor="req-name">Your name</Label>
              <Input id="req-name" value={reqName} onChange={(e) => setReqName(e.target.value)} className="h-11 mt-1" maxLength={120} required />
            </div>
            <div>
              <Label htmlFor="req-phone">Your phone</Label>
              <Input id="req-phone" value={reqPhone} onChange={(e) => setReqPhone(e.target.value)} className="h-11 mt-1" maxLength={40} placeholder="e.g. 6XX XXX XXX" required />
            </div>
            <div>
              <Label htmlFor="req-desc">What do you need?</Label>
              <Textarea
                id="req-desc" value={reqDesc} onChange={(e) => setReqDesc(e.target.value)}
                className="min-h-28 mt-1" maxLength={2000} required
                placeholder="Briefly describe the job (location, problem, urgency)…"
              />
            </div>
            <Button type="submit" disabled={submittingReq} size="lg" className="w-full gap-2">
              <MessageSquare className="h-4 w-4" /> {submittingReq ? "Sending…" : "Send request & open WhatsApp"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-3xl bg-card border border-border p-6 md:p-8 mt-6">
        <h2 className="text-xl font-bold">Leave a private message</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The worker will see this in their inbox. {!user && <Link to="/login" className="text-primary underline">Sign in to send.</Link>}
        </p>
        <form onSubmit={sendMessage} className="mt-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name">Your name</Label>

      <div className="rounded-3xl bg-card border border-border p-6 md:p-8 mt-6">
        <h2 className="text-xl font-bold">Leave a private message</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The worker will see this in their inbox. {!user && <Link to="/login" className="text-primary underline">Sign in to send.</Link>}
        </p>
        <form onSubmit={sendMessage} className="mt-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" className="h-11 mt-1" />
            </div>
            <div>
              <Label htmlFor="contact">Callback phone</Label>
              <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Optional" className="h-11 mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body" required maxLength={1000}
              value={body} onChange={(e) => setBody(e.target.value)}
              placeholder="Describe what you need help with…"
              className="min-h-32 mt-1"
            />
          </div>
          <Button type="submit" disabled={!user || sending} size="lg" className="gap-2">
            <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send message"}
          </Button>
        </form>
      </div>
    </div>
  );
}
