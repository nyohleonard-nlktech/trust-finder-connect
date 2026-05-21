import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, LifeBuoy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/support")({
  component: SupportInbox,
});

interface SupportMsg {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

function SupportInbox() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    enabled: !!user,
    queryKey: ["support-thread", user?.id],
    queryFn: async (): Promise<SupportMsg[]> => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupportMsg[];
    },
  });

  // Mark admin messages as read on view
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
        .then(() => qc.invalidateQueries({ queryKey: ["support-unread", user.id] }));
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, user, qc]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("support-self")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages", filter: `receiver_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["support-thread", user.id] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages", filter: `sender_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["support-thread", user.id] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;

    // Pick an admin recipient
    const { data: admins, error: aErr } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);
    if (aErr || !admins?.length) {
      toast.error("Support is currently unavailable.");
      return;
    }
    const receiverId = admins[0].user_id;
    const { error } = await supabase.from("support_messages").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      body: text.trim(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
    qc.invalidateQueries({ queryKey: ["support-thread", user.id] });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <LifeBuoy className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Support Inbox</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        Chat directly with our team. We typically reply within a few hours.
      </p>

      <div className="rounded-2xl bg-card border border-border flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!messages?.length ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No messages yet. Send your first message below.
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
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
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
            placeholder="Type your message…"
            className="flex-1"
          />
          <Button type="submit" disabled={!text.trim()} className="gap-1.5">
            <Send className="h-4 w-4" /> Send
          </Button>
        </form>
      </div>
    </div>
  );
}
