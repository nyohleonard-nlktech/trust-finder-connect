import { useState } from "react";
import { MessageCircle, Send, LifeBuoy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ADMIN_WHATSAPP } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const FEEDBACK_TYPES = ["Complaint", "Suggestion", "Tech Issue"] as const;

export function SupportFooter() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [type, setType] = useState<string>("Suggestion");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("admin_feedback").insert({
      name: name.trim().slice(0, 120),
      contact: contact.trim().slice(0, 160),
      feedback_type: type,
      message: message.trim().slice(0, 2000),
      actor_id: user?.id ?? null,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Thanks! Your message has reached TrustFix support.");
    setName("");
    setContact("");
    setMessage("");
    setType("Suggestion");
  };

  const waHref = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(
    "Hello TrustFix Support, I need help.",
  )}`;

  return (
    <footer className="border-t border-border bg-card/40 mt-12">
      <div className="mx-auto max-w-5xl px-4 py-10 grid gap-10 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Contact TrustFix Support &amp; Feedback</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Customer or worker, we want to hear from you. Send a complaint, a
            suggestion, or report a tech issue — we read every message.
          </p>
          <Button asChild size="lg" className="mt-5 gap-2 bg-success text-success-foreground hover:bg-success/90">
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5" /> Chat with Admin Support on WhatsApp
            </a>
          </Button>
          <p className="mt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} TrustFix · Verified workers across Cameroon
          </p>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-card border border-border p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sf-name">Your name</Label>
              <Input id="sf-name" value={name} onChange={(e) => setName(e.target.value)} className="h-10 mt-1" maxLength={120} required />
            </div>
            <div>
              <Label htmlFor="sf-contact">Phone or email</Label>
              <Input id="sf-contact" value={contact} onChange={(e) => setContact(e.target.value)} className="h-10 mt-1" maxLength={160} required />
            </div>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FEEDBACK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sf-message">Message</Label>
            <Textarea
              id="sf-message" value={message} onChange={(e) => setMessage(e.target.value)}
              className="min-h-28 mt-1" maxLength={2000} required
              placeholder="Tell us what's on your mind…"
            />
          </div>
          <Button type="submit" disabled={sending} size="lg" className="w-full gap-2">
            <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send to TrustFix"}
          </Button>
        </form>
      </div>
    </footer>
  );
}
