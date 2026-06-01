import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId: callerId, supabase } = context;

    // Verify caller is admin (RLS-scoped query)
    const { data: roles, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    if (roleErr) throw new Error(roleErr.message);
    if (!roles?.some((r) => r.role === "admin")) {
      throw new Error("Forbidden: admin only");
    }

    const target = data.userId;
    if (target === callerId) throw new Error("Cannot delete your own account");

    // Safe deletion order
    const j = await supabaseAdmin.from("job_requests").delete().eq("worker_id", target);
    if (j.error) throw new Error(`job_requests: ${j.error.message}`);

    const s1 = await supabaseAdmin.from("support_messages").delete().eq("sender_id", target);
    if (s1.error) throw new Error(`support_messages sender: ${s1.error.message}`);
    const s2 = await supabaseAdmin.from("support_messages").delete().eq("receiver_id", target);
    if (s2.error) throw new Error(`support_messages receiver: ${s2.error.message}`);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", target);
    await supabaseAdmin.from("worker_profiles").delete().eq("user_id", target);

    const p = await supabaseAdmin.from("profiles").delete().eq("id", target);
    if (p.error) throw new Error(`profiles: ${p.error.message}`);

    const { error: aErr } = await supabaseAdmin.auth.admin.deleteUser(target);
    if (aErr) throw new Error(`auth: ${aErr.message}`);

    return { ok: true };
  });
