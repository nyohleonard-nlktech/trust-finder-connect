import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BroadcastSchema = z.object({
  message: z.string().min(1).max(2000),
  target: z.enum(["all", "workers", "customers"]),
});

export const sendBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => BroadcastSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Verify admin
    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      throw new Error("Unauthorized: admin only");
    }

    // Resolve recipient user ids based on target
    let recipientIds: string[] = [];

    if (data.target === "workers" || data.target === "all") {
      const { data: workers, error } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "worker");
      if (error) throw new Error(error.message);
      recipientIds.push(...(workers ?? []).map((r) => r.user_id));
    }

    if (data.target === "customers" || data.target === "all") {
      // Customers = anyone with the 'customer' role
      const { data: customers, error } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "customer");
      if (error) throw new Error(error.message);
      recipientIds.push(...(customers ?? []).map((r) => r.user_id));
    }

    // De-dupe and exclude the admin themselves
    recipientIds = Array.from(new Set(recipientIds)).filter((id) => id !== userId);

    if (recipientIds.length === 0) {
      return { broadcastId: null, recipients: 0 };
    }

    // Create the broadcast record
    const { data: broadcast, error: bErr } = await supabaseAdmin
      .from("admin_broadcasts")
      .insert({
        message_content: data.message,
        target_audience: data.target,
        sender_id: userId,
        recipients_count: recipientIds.length,
      })
      .select("id")
      .single();
    if (bErr || !broadcast) throw new Error(bErr?.message ?? "Failed to create broadcast");

    // Insert one support_messages row per recipient
    const rows = recipientIds.map((rid) => ({
      sender_id: userId,
      receiver_id: rid,
      body: data.message,
      is_admin_message: true,
      broadcast_id: broadcast.id,
    }));

    const { error: insErr } = await supabaseAdmin.from("support_messages").insert(rows);
    if (insErr) throw new Error(insErr.message);

    return { broadcastId: broadcast.id, recipients: recipientIds.length };
  });
